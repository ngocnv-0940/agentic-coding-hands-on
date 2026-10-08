"""Luồng giao thức: upload → confirm → poll → segments → SRT → delete.

Module DUY NHẤT biết về giao thức. Mọi thứ khác là hàm thuần hoặc I/O cục bộ.

Hợp đồng đã xác minh trên service thật 2026-09-21
(`plans/reports/verify-260921-2012-audio-trans-live-contract.md`):

- `PATCH` luôn trả **202** `{file_id, status:"queued"}`, KHÔNG BAO GIỜ 402.
  Quota được worker giữ về sau ⇒ hết quota chỉ lộ ra ở vòng poll (xem `polling.py`).
- Presigned PUT ký kèm `Content-Type` + `Content-Length` ⇒ body phải là file handle TRẦN.
- `GET /jobs/{id}/segments` trả **mảng trần** — và điều đó được KIỂM ở `transcribe()`,
  vì đây là route ngoài spec không có lớp gác nào khác.
- `DELETE` → 200, và `GET` sau đó → **404**. 404 ở đó là BÌNH THƯỜNG, không phải lỗi.
- KHÔNG dùng `POST /jobs`: nó trả 201 rồi treo `pending` vĩnh viễn nhưng vẫn giữ quota.

**Mặc định GIỮ file trên server** (`delete_remote=False`) — anh Toàn 2026-09-22:
*"nhớ có cơ chế nào để auth với bên audio transcribe server nhé, sau này còn xem lại
được log với lịch sử transcribe của user"*. Xoá xong là file biến mất khỏi dashboard,
tức mất đúng thứ đó.

Đổi default này KHÔNG làm lộ thêm gì: `DELETE` là xoá MỀM (chỉ set `deleted_at`),
`hardDeleteFile` không có caller nào, không có job purge — dữ liệu ở lại trong cả hai
trường hợp. Khác biệt duy nhất là chính chủ còn thấy được file của mình hay không.
"""

from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Any, Callable

import httpx

from .contract import check_file_payload, describe_drift
from .credentials import Credentials
from .errors import AudioTransError, translate_http_error
from .media import probe_duration_seconds, validate_media
from .upload import confirm_upload, upload_file
from .polling import poll_until_done
from .srt import segments_to_srt

__all__ = ["transcribe"]

_CONNECT_TIMEOUT = 10
_READ_TIMEOUT = 60

# Sàn 30 phút vì worker chết giữa chừng chỉ được reclaim sau
# VISIBILITY_TIMEOUT_SECONDS x 3 = 900s; bỏ cuộc sớm hơn là bỏ đúng lúc job sắp tự hồi.
_MIN_DEADLINE_MINUTES = 30


def _check(response: httpx.Response) -> Any:
    """Body đã giải mã. KHÔNG phải lúc nào cũng là dict — `/segments` trả mảng trần,
    nên caller có trách nhiệm tự kiểm kiểu trước khi dùng."""
    if response.status_code >= 400:
        raise AudioTransError(
            translate_http_error(response.status_code, response.text),
            status=response.status_code,
        )
    return response.json() if response.content else {}


def _cleanup(api: httpx.Client, file_id: str, say: Callable[[str], None]) -> None:
    """DELETE best-effort trong `finally`. Không bao giờ được che lỗi thật phía trên."""
    try:
        response = api.delete(f"/files/{file_id}")
    except Exception as exc:
        say(f"[cảnh báo] Không gọi được DELETE ({exc}). File còn trên server: {file_id}")
        return

    if response.status_code < 300:
        say("Đã xoá khỏi server (xoá mềm — row, transcript và object S3 vẫn còn bên đó).")
    elif response.status_code == 409:
        # BA nguyên nhân, đọc từ `files-controller.ts:600-621`:
        #   1. status đang active (queued/processing/…)  -> đợi job xong
        #   2. pending_upload và URL chưa hết hạn        -> đợi hết 3600s rồi xoá lại
        #   3. đã xoá rồi                                -> không cần làm gì
        # Server trả câu cụ thể trong body; in nguyên văn thay vì đoán.
        detail = ""
        try:
            detail = str(response.json().get("error") or "")
        except Exception:
            pass
        say(
            f"[cảnh báo] Chưa xoá được{': ' + detail if detail else ''}. File còn trên server.\n"
            f"           Xoá lại sau bằng: curl -X DELETE -H \"x-api-key: $AUDIO_TRANS_API_KEY\" "
            f"<base_url>/files/{file_id}"
        )
    else:
        say(f"[cảnh báo] DELETE trả HTTP {response.status_code}. File còn trên server: {file_id}")


def transcribe(
    path: str,
    *,
    credentials: Credentials,
    hints: str = "",
    output_srt: str | None = None,
    duration_seconds: int | None = None,
    delete_remote: bool = False,
    progress_cb: Callable[[str], None] | None = None,
) -> Path:
    """Chạy trọn luồng, ghi file SRT, trả đường dẫn đã ghi."""
    say = progress_cb or (lambda _m: None)

    # Chặn TRƯỚC mọi request: đuôi ngoài whitelist và file quá trần không bao giờ
    # nên tạo row trên server, vì row bỏ rơi thì API không dọn được.
    mime, size = validate_media(path)
    duration = duration_seconds if duration_seconds is not None else probe_duration_seconds(path)
    minutes = math.ceil(duration / 60)
    say(f"Thời lượng {duration}s — sẽ giữ khoảng {minutes} phút quota.")

    output = Path(output_srt) if output_srt else Path(path).with_suffix(".srt")
    deadline = max(_MIN_DEADLINE_MINUTES, minutes * 2) * 60

    api = httpx.Client(
        base_url=credentials.base_url,
        headers={"x-api-key": credentials.api_key},
        timeout=httpx.Timeout(_READ_TIMEOUT, connect=_CONNECT_TIMEOUT),
    )
    file_id = None
    try:
        slot = upload_file(api, path, mime, size)
        file_id = slot["file_id"]
        say(f"Đã tải lên. file_id: {file_id}")

        confirm_upload(api, file_id, hints, duration)
        say("Đã xác nhận, đang chờ xử lý…")

        # Dùng lại payload poll vừa trả về. GET thêm một lần nữa vừa thừa một round-trip,
        # vừa là một call KHÔNG có lớp retry của vòng poll — hỏng ở đúng bước cuối sau 20 phút
        # chờ thì mất trắng, mà thông báo lỗi lại không kèm file_id.
        final = poll_until_done(
            api, file_id,
            base_url=credentials.base_url,
            deadline_seconds=deadline,
            requested_minutes=minutes,
            progress_cb=say,
        )

        # Không index trần: `final["job"]["id"]` mà shape đổi thì ra KeyError trần,
        # mất cả file_id lẫn ngữ cảnh. polling đã kiểm rồi, đây là lớp chốt cuối.
        missing = check_file_payload(final)
        if missing:
            raise AudioTransError(describe_drift(final, missing) + f"\n     file_id: {file_id}")
        job_id = final["job"]["id"]
        segments = _check(api.get(f"/jobs/{job_id}/segments"))     # mảng trần

        # `/segments` cũng nằm ngoài `openapi.json`, nhưng khác `GET /files/{id}` ở chỗ
        # nó KHÔNG có lớp gác nào. Bọc mảng vào object (`{"data": [...]}`) là kiểu đổi
        # shape phổ biến nhất, và không có dòng này thì nó hỏng IM LẶNG: dict khác rỗng
        # nên cảnh báo bên dưới không nổ, `segments_to_srt` lặp dict ra string key, lọc
        # `isinstance(s, dict)` ra rỗng, và ta ghi một file SRT 0 byte rồi exit 0. Quota
        # đã tiêu, transcript vẫn nằm trên server, mà người dùng không có dấu hiệu nào.
        if not isinstance(segments, list):
            raise AudioTransError(
                f"/segments trả về {type(segments).__name__}, không phải mảng — hợp đồng đã đổi.\n"
                f"     Nhận được: {sorted(segments) if isinstance(segments, dict) else repr(segments)[:80]}\n"
                f"     file_id: {file_id}",
                hint="Báo người bảo trì skill. Transcript CHƯA mất — nó vẫn nằm trên "
                     "server, tải lại được qua web hoặc xem bằng history_audio_trans.py.",
            )

        if not segments:
            say("[cảnh báo] Transcript rỗng — vẫn ghi file SRT rỗng.")

        output.write_text(segments_to_srt(segments), encoding="utf-8", newline="\n")
        return output
    finally:
        if file_id and delete_remote:
            _cleanup(api, file_id, say)
        elif file_id:
            say(f"Giữ trên server để xem lại lịch sử. file_id: {file_id}")
        api.close()
