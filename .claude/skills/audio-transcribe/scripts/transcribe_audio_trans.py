#!/usr/bin/env python3
"""Transcribe audio/video sang SRT bằng Audio Transcribe API.

File này chỉ parse tham số và in kết quả — mọi logic thật nằm trong `audio_trans/`.

Quy ước luồng ra: tiến độ ra **stderr**, đường dẫn SRT ra **stdout** ở dòng cuối,
để bước sau của skill đọc stdout mà không lẫn.
"""

from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audio_trans import credentials as creds_module          # noqa: E402
from audio_trans.client import transcribe                    # noqa: E402
from audio_trans.errors import AudioTransError               # noqa: E402
from audio_trans.hints import build_hints                    # noqa: E402

EXIT_OK, EXIT_ERROR, EXIT_INTERRUPTED = 0, 1, 130


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def _positive_int(raw: str) -> int:
    """Giá trị này đi thẳng vào `estimated_duration_seconds` — trường quyết định quota.

    Số âm hoặc 0 lọt qua là xin quota sai; chặn ngay ở tầng phân tích tham số.
    """
    try:
        value = int(raw)
    except ValueError:
        raise argparse.ArgumentTypeError(f"phải là số nguyên, nhận được {raw!r}") from None
    if value <= 0:
        raise argparse.ArgumentTypeError(f"phải lớn hơn 0, nhận được {value}")
    return value


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="transcribe_audio_trans.py",
        description="Transcribe audio/video sang SRT qua Audio Transcribe API.",
    )
    parser.add_argument("audio", help="file audio/video (mp3, wav, m4a, flac, ogg, webm, mp4)")
    parser.add_argument("--context-json", help="context JSON do Phase 1 của skill sinh ra")
    parser.add_argument("--hints", default="", help="chuỗi tự do, gộp thêm vào hints")
    parser.add_argument(
        "--language", default="vi,en,ja",
        help="CHỈ dùng để dựng câu mô tả trong hints — service tự phát hiện ngôn ngữ nguồn",
    )
    parser.add_argument("--output", help="đường ra (mặc định: cùng tên, đuôi .srt)")
    parser.add_argument(
        "--duration-seconds", type=_positive_int,
        help="tự khai thời lượng (giây, > 0) — đường thoát khi ffprobe hỏng",
    )
    parser.add_argument(
        "--send-doc-summary", action="store_true",
        help="gửi kèm đoạn văn mô tả tự trích từ tài liệu ngữ cảnh. MẶC ĐỊNH TẮT — "
             "đoạn đó lưu vĩnh viễn ở service và chuyển tiếp sang Soniox; "
             "để tắt thì nó vẫn được dùng cục bộ ở bước Claude sửa SRT",
    )
    parser.add_argument(
        "--delete-remote", action="store_true",
        help="xoá file khỏi server sau khi xong. MẶC ĐỊNH TẮT — giữ lại để còn xem "
             "lịch sử transcribe trên web. Lưu ý đây là xoá MỀM: dữ liệu vẫn nằm "
             "trên server, chỉ biến mất khỏi dashboard của chính bạn",
    )
    return parser.parse_args(argv)


def load_context(path: str | None) -> dict | None:
    """Context JSON hỏng thì cảnh báo và chạy tiếp — không nên giết cả lần chạy."""
    if not path:
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        log(f"[cảnh báo] Không đọc được context JSON ({exc}). Chạy tiếp chỉ với --hints.")
        return None


def scrub(text: str, secret: str | None) -> str:
    """[RT#13] Bảo đảm 'không in key' là bất biến toàn chương trình, không riêng credentials.py."""
    return text.replace(secret, "***") if secret else text


def main(argv=None) -> int:
    args = parse_args(argv)
    api_key = None

    try:
        credentials = creds_module.load()
        api_key = credentials.api_key

        hints = build_hints(
            load_context(args.context_json), args.language, args.hints,
            include_prose=args.send_doc_summary,
        )
        if hints:
            # In ĐỦ, không cắt. Cắt ở 120 ký tự nghĩa là người dùng không nhìn thấy
            # thứ thực sự rời khỏi máy mình — mà chuỗi này đi tới hai nơi và ở lại đó.
            log(f"hints ({len(hints)} ký tự) — gửi lên service:")
            log("    " + hints.replace("\n", "\n    "))
            log("    ^ LƯU VĨNH VIỄN ở files.hints, và CHUYỂN TIẾP sang Soniox (STT bên thứ ba).")
            log("      Audio cũng được Soniox tải về. DELETE của skill là xoá MỀM.")
            if args.send_doc_summary:
                log("      --send-doc-summary đang BẬT: có cả đoạn văn trích từ tài liệu.")

        output = transcribe(
            args.audio,
            credentials=credentials,
            hints=hints,
            output_srt=args.output,
            duration_seconds=args.duration_seconds,
            delete_remote=args.delete_remote,
            progress_cb=log,
        )
    except AudioTransError as exc:
        # Scrub ở đây nữa: `translate_http_error` nối nguyên văn body lỗi của server vào
        # thông báo, mà một API có thể echo lại chính key vừa nhận trong body 401.
        log(f"\nLỗi: {scrub(str(exc), api_key)}")
        return EXIT_ERROR
    except KeyboardInterrupt:
        # client.py đã chạy xong khối `finally` dọn dẹp trước khi tới đây.
        log("\nĐã dừng theo yêu cầu.")
        return EXIT_INTERRUPTED
    except Exception:
        log("\nLỗi ngoài dự kiến — báo lại cho người bảo trì skill:")
        log(scrub(traceback.format_exc(), api_key))
        return EXIT_ERROR

    print(f"SRT: {output.resolve()}")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
