"""Vòng poll `GET /files/{id}` và bảng phân loại trạng thái.

Tách khỏi `client.py` vì riêng bảng này đã đủ nặng, và nó là phần dễ sai nhất
của cả skill: quota cạn KHÔNG lộ ra ở response của PATCH (PATCH luôn 202), nó
chỉ hiện ra ở đây dưới dạng `status='error'` kèm `job=null`.

Chữ ký đó **không duy nhất** (RT#4): nhánh `createJob` ném lỗi cũng refund quota
rồi set `error` mà không tạo job row — nên phải hỏi `quota/me` trước khi kết luận.
Kiểm khoá bắt buộc nằm ở `contract.py`; đọc docstring ở đó để biết vì sao chỉ kiểm
giá trị là không đủ.
"""

from __future__ import annotations

import time
from typing import Callable

import httpx

from .contract import (
    KNOWN_FILE_STATUSES,
    KNOWN_JOB_STATUSES,
    check_file_payload,
    describe_drift,
)
from .errors import AudioTransError, translate_http_error

__all__ = ["poll_until_done", "GRACE_SECONDS"]

# Worker chưa nhận việc trong ngần này thì cảnh báo — nhưng vẫn chờ tiếp tới hạn tổng.
GRACE_SECONDS = 90

_FAST_POLL_SECONDS = 3      # 60 giây đầu dò dày, job ngắn xong luôn trong khoảng này
_FAST_POLL_WINDOW = 60
_SLOW_POLL_SECONDS = 10
_TRANSIENT_RETRIES = 3
_BACKOFF = (2, 4, 8)


def _curl_hint(base_url: str, file_id: str) -> str:
    return (
        f'curl -H "x-api-key: $AUDIO_TRANS_API_KEY" {base_url}/files/{file_id}'
    )


def _abort(base_url: str, file_id: str, message: str, hint: str = "") -> AudioTransError:
    tail = f"\n     Tự kiểm sau bằng: {_curl_hint(base_url, file_id)}"
    return AudioTransError(f"{message}\n     file_id: {file_id}", hint=(hint + tail).strip())


def _get_file(client: httpx.Client, file_id: str) -> dict:
    """Một lần GET, ném AudioTransError nếu server trả mã lỗi."""
    response = client.get(f"/files/{file_id}")
    if response.status_code >= 400:
        raise AudioTransError(
            translate_http_error(response.status_code, response.text),
            status=response.status_code,
        )
    return response.json()


def _get_file_resilient(client: httpx.Client, file_id: str, base_url: str) -> dict:
    """[RT#2] Lỗi tạm thời (timeout, mất kết nối, 5xx, 429) retry 3 lần rồi mới bỏ cuộc.

    Rớt mạng giữa vòng poll 19 phút mà để exception trần xuyên qua là người dùng
    mất `file_id`, trong khi job vẫn chạy và vẫn trừ quota.
    """
    last = None
    for attempt in range(_TRANSIENT_RETRIES + 1):
        try:
            return _get_file(client, file_id)
        except AudioTransError as exc:
            if exc.status is None or (exc.status < 500 and exc.status != 429):
                raise                      # lỗi thật (401/404/...) — không retry
            # 429 nằm dưới 500 nhưng là lỗi TẠM THỜI, cùng nhóm với 5xx: một job 19 phút
            # gửi hơn 100 request, dính rate-limit đúng một lần mà bỏ cuộc là hỏng cả lần
            # chạy trong khi job vẫn chạy và vẫn trừ quota. Backoff (2, 4, 8) giây là đủ;
            # đọc `Retry-After` thì chính xác hơn nhưng để sau.
            last = exc
        except httpx.HTTPError as exc:
            last = exc
        if attempt < _TRANSIENT_RETRIES:
            time.sleep(_BACKOFF[attempt])

    raise _abort(
        base_url, file_id,
        f"Mất liên lạc với server sau {_TRANSIENT_RETRIES + 1} lần thử ({last}).",
        "Job nhiều khả năng VẪN ĐANG CHẠY và đã trừ quota.",
    )


def _diagnose_missing_job(client: httpx.Client, requested_minutes: int) -> str:
    """[RT#4] `error` + `job=null`: hết quota, hay lỗi tạo job phía server?

    `quota/me` là route ngoài spec — đã xác minh nhận `x-api-key` (2026-09-21),
    nhưng vẫn bọc try: mất nó thì mất phần số liệu, không được làm hỏng thông báo.
    """
    try:
        quota = client.get("/quota/me").json()
        available = quota.get("available_minutes")
        limit = quota.get("monthly_limit_minutes")
    except Exception:
        return (
            "Job không được tạo — hết quota HOẶC lỗi server tạm thời. "
            f"Vừa xin {requested_minutes} phút. (Không đọc được /quota/me để nói chắc.)"
        )

    if isinstance(available, int) and available < requested_minutes:
        return (
            f"Hết quota tháng (mặc định {limit} phút/user, theo tháng dương lịch). "
            f"Còn {available} phút, vừa xin {requested_minutes} phút."
        )
    return (
        f"Job không được tạo dù quota còn ({available}/{limit} phút) — lỗi phía server. "
        "Thử lại sau, hoặc báo người quản trị Audio Transcribe."
    )


def poll_until_done(
    client: httpx.Client,
    file_id: str,
    *,
    base_url: str,
    deadline_seconds: float,
    requested_minutes: int,
    progress_cb: Callable[[str], None] | None = None,
) -> dict:
    """Chờ tới khi job xong. Trả payload cuối của `GET /files/{id}`.

    Ném `AudioTransError` ở mọi nhánh hỏng, luôn kèm `file_id` và lệnh curl.
    """
    say = progress_cb or (lambda _m: None)
    started = time.monotonic()
    last_seen = None
    warned_stuck = False
    warned_unknown = False

    while True:
        elapsed = time.monotonic() - started
        if elapsed > deadline_seconds:
            raise _abort(
                base_url, file_id,
                f"Quá hạn chờ {deadline_seconds / 60:.0f} phút.",
                "Job CÓ THỂ VẪN ĐANG CHẠY. ĐỪNG chạy lại lệnh này cho tới khi curl ra "
                "trạng thái cuối — chạy lại là trừ quota lần hai.",
            )

        payload = _get_file_resilient(client, file_id, base_url)

        # Kiểm hợp đồng TRƯỚC mọi nhánh phân loại. Thiếu khoá thì mọi suy luận bên
        # dưới đều vô nghĩa — và nếu không chặn ở đây, `job` bị đổi tên sẽ giả dạng
        # thành "worker chưa nhận việc" rồi chờ hết 30 phút mới báo sai. Xem contract.py.
        missing = check_file_payload(payload)
        if missing:
            raise _abort(base_url, file_id, describe_drift(payload, missing))

        status = payload.get("status")
        job = payload.get("job")

        if job and job.get("status") == "error":
            raise _abort(
                base_url, file_id,
                "Pipeline xử lý thất bại: " + str(job.get("error_message") or "(không rõ lý do)"),
            )

        if status == "completed" and job and job.get("status") == "completed":
            say("Xong.")
            return payload

        # `status == "error"` phải KẾT THÚC ở đây trong mọi trường hợp. Bản đầu chỉ bắt
        # ca `job is None`: file lỗi trong khi job còn đứng ở `processing` không khớp nhánh
        # nào — không phải `job.status == "error"`, không phải `completed`, không phải
        # `error + job is None` — nên rơi xuống cảnh báo "trạng thái lạ" rồi poll tới hết
        # hạn, và sau 30 phút báo "Job CÓ THỂ VẪN ĐANG CHẠY. ĐỪNG chạy lại", trong khi job
        # đã chết ngay từ vòng poll đầu.
        if status == "error":
            if job is None:
                raise _abort(base_url, file_id, _diagnose_missing_job(client, requested_minutes))
            raise _abort(
                base_url, file_id,
                "File ở trạng thái error: "
                + str(job.get("error_message") or "(không rõ lý do)"),
            )

        if status == "pending_upload":
            raise _abort(
                base_url, file_id,
                "File vẫn ở trạng thái pending_upload — bước PATCH chưa ăn.",
            )

        unknown = status not in KNOWN_FILE_STATUSES or (
            job is not None and job.get("status") not in KNOWN_JOB_STATUSES
        )
        if unknown and not warned_unknown:
            warned_unknown = True
            say(
                f"[cảnh báo] Server trả trạng thái lạ — file={status!r} "
                f"job={(job or {}).get('status')!r}. Hợp đồng API có thể đã đổi. "
                "Vẫn chờ tới hạn tổng, nhưng hãy báo người bảo trì skill."
            )

        if job is None:
            if not unknown and elapsed > GRACE_SECONDS and not warned_stuck:
                warned_stuck = True
                say(
                    f"Hàng đợi đang tắc — {elapsed:.0f} giây rồi worker vẫn chưa nhận việc. "
                    "Có thể do tải, có thể worker lỗi. Vẫn chờ tiếp."
                )
        else:
            seen = (job.get("progress"), job.get("stage_message"))
            if seen != last_seen:
                last_seen = seen
                say(f"  {job.get('progress')}% — {job.get('stage_message') or job.get('status')}")

        time.sleep(_FAST_POLL_SECONDS if elapsed < _FAST_POLL_WINDOW else _SLOW_POLL_SECONDS)
