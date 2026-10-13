"""Kiểm file media và đo thời lượng bằng `ffprobe`. Chạy TRƯỚC mọi request.

Hai cạm bẫy phase này chặn:

1. Đuôi ngoài whitelist → server suy ra `file_type=reference`, trần 100 MB, và
   trigger transcribe KHÔNG BAO GIỜ fire. File nằm im trên server, không lỗi,
   không kết quả. `.mov/.mkv/.avi` rơi đúng vào đó. Phải chặn ở client.
2. Thiếu `estimated_duration_seconds` → trigger đoán theo dung lượng ở
   960 KB/phút; video bị vống ~8.7 lần, chặn trần 120 phút → một video ăn 1/5
   quota tháng. Nên `probe_duration_seconds` không bao giờ trả None: đo được
   thì trả int, không đo được thì ném lỗi có nêu đường thoát.
"""

from __future__ import annotations

import math
import os
import subprocess

from .errors import DurationProbeFailed, UnsupportedMedia

__all__ = [
    "validate_media",
    "probe_duration_seconds",
    "SUPPORTED_EXTENSIONS",
    "MAX_FILE_SIZE_BYTES",
]

# Nguồn: audio-transcribe/web/types/index.ts:53-63 (SUPPORTED_MIME_TYPES).
# Giữ whitelist ở đúng một chỗ; lệch so với server thì sửa ở đây.
EXTENSION_TO_MIME = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "m4a": "audio/mp4",
    "flac": "audio/flac",
    "ogg": "audio/ogg",
    "webm": "audio/webm",
    "mp4": "video/mp4",
}
SUPPORTED_EXTENSIONS = frozenset(EXTENSION_TO_MIME)

# Nguồn: web/types/index.ts:90 — MAX_AUDIO_FILE_SIZE = 1_073_741_824.
# Là GiB nhị phân (1024³), KHÔNG phải GB thập phân. Đã đối chiếu source, khớp chính xác;
# lệch định nghĩa ở đây là file 954 MiB–1 GB lọt qua client rồi ăn 422 của server.
MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024

_PROBE_TIMEOUT_SECONDS = 30
_MAX_PLAUSIBLE_SECONDS = 604_800  # 7 ngày — quá mức này là ffprobe đọc rác

_CONVERT_HINT = (
    "Chuyển sang .m4a rồi chạy lại:\n"
    "     ffmpeg -i \"{path}\" -vn -c:a aac -b:a 128k \"{stem}.m4a\""
)


def _extension_of(path: str) -> str:
    return os.path.splitext(path)[1].lstrip(".").lower()


def validate_media(path: str) -> tuple[str, int]:
    """Kiểm đuôi + dung lượng. Trả `(mime, size_bytes)`.

    `mime` trả về khớp cách server suy từ đuôi, nên dùng được luôn cho
    `Content-Type` của presigned PUT.
    """
    if not os.path.isfile(path):
        raise UnsupportedMedia(f"Không thấy file: {path}")

    extension = _extension_of(path)
    if extension not in SUPPORTED_EXTENSIONS:
        stem = os.path.splitext(path)[0]
        raise UnsupportedMedia(
            f"Đuôi .{extension or '(không có)'} không được hỗ trợ. "
            f"Chỉ nhận: {', '.join(sorted(SUPPORTED_EXTENSIONS))}.",
            hint=(
                "Server sẽ coi file này là tài liệu tham chiếu và KHÔNG BAO GIỜ transcribe "
                "— nó nằm im trên đó, không báo lỗi. "
                + _CONVERT_HINT.format(path=path, stem=stem)
            ),
        )

    try:
        size = os.path.getsize(path)
    except OSError as exc:  # quyền đọc, mount hỏng, đường dẫn quá dài…
        raise UnsupportedMedia(f"Không đọc được file: {path} ({exc})") from None
    if size <= 0:
        raise UnsupportedMedia(f"File rỗng: {path}")
    if size > MAX_FILE_SIZE_BYTES:
        raise UnsupportedMedia(
            f"File {size / 1024 / 1024:.1f} MB, vượt trần 1 GB của service.",
            hint="Cắt nhỏ bằng ffmpeg, hoặc nén audio xuống bitrate thấp hơn.",
        )

    return EXTENSION_TO_MIME[extension], size


def probe_duration_seconds(path: str) -> int:
    """Thời lượng làm tròn LÊN, tính bằng giây.

    Làm tròn lên ở client dù server đã ceil hộ từ bản vá gần đây — an toàn với
    mọi phiên bản server, và không bao giờ xin thiếu quota so với thực tế.
    """
    command = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        path,
    ]
    escape = "Đường thoát: chạy lại kèm --duration-seconds <số giây> để tự khai thời lượng."

    try:
        # argv dạng list, không shell=True → tên file không mở được đường inject.
        proc = subprocess.run(
            command, capture_output=True, text=True, timeout=_PROBE_TIMEOUT_SECONDS
        )
    except FileNotFoundError:
        raise DurationProbeFailed(
            "Không tìm thấy `ffprobe` trên PATH.",
            hint=(
                "Cài ffmpeg (đã gồm ffprobe): macOS `brew install ffmpeg` · "
                "Ubuntu `sudo apt-get install ffmpeg`.\n     " + escape
            ),
        ) from None
    except subprocess.TimeoutExpired:
        raise DurationProbeFailed(
            f"`ffprobe` không phản hồi sau {_PROBE_TIMEOUT_SECONDS} giây.", hint=escape
        ) from None
    except OSError as exc:
        # ffprobe có trên PATH nhưng không chạy được (mất quyền x, binary sai kiến trúc).
        # Bắt ở đây để giữ bất biến của cả file: không bao giờ để lọt traceback trần.
        raise DurationProbeFailed(f"Không chạy được `ffprobe`: {exc}", hint=escape) from None

    if proc.returncode != 0:
        detail = (proc.stderr or "").strip().splitlines()
        raise DurationProbeFailed(
            f"`ffprobe` lỗi (exit {proc.returncode}): {detail[-1] if detail else 'không rõ'}",
            hint="File có thể hỏng hoặc không phải media hợp lệ.\n     " + escape,
        )

    raw = (proc.stdout or "").strip()
    try:
        seconds = float(raw)
    except ValueError:
        raise DurationProbeFailed(
            f"`ffprobe` không trả ra số thời lượng (nhận được: {raw[:80]!r}).", hint=escape
        ) from None

    if not (0 < seconds <= _MAX_PLAUSIBLE_SECONDS):
        raise DurationProbeFailed(
            f"Thời lượng đọc được không hợp lý: {seconds} giây.", hint=escape
        )

    return math.ceil(seconds)
