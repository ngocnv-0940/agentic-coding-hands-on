"""Đọc lại lịch sử transcribe của CHÍNH user đang cầm key.

Vì sao có file này — anh Toàn 2026-09-22: *"nhớ có cơ chế nào để auth với bên audio
transcribe server nhé, sau này còn xem lại được log với lịch sử transcribe của user"*.

Tầng xác thực thì đã sẵn: key tạo dưới tài khoản cá nhân, nên mọi row `files` mang
`user_id` của người đó và `GET /files` chỉ trả về file của chính họ. Thứ còn thiếu là
một đường để xem lại **từ terminal**, không phải mở web. Đó là việc của module này.

**Đọc shape một cách phòng thủ, có chủ ý.** `GET /files` có trong `openapi.json` và đã
xác minh trả 200 với key thật (21/09), NHƯNG chưa ai ghi lại shape chính xác của nó —
mảng trần hay object bọc, và tên trường từng row. Nên ở đây:

- chấp nhận cả mảng trần lẫn object bọc, thử vài tên khoá bọc hay gặp;
- mỗi cột dò qua một danh sách tên ứng viên, không có thì hiện `—`;
- KHÔNG BAO GIỜ ném lỗi vì một khoá lạ.

Cùng nguyên tắc với `contract.py`: chỉ đỏ khi thứ ta THẬT SỰ cần biến mất. Ở đây còn
nới hơn, vì mất một cột hiển thị không làm sai lệch điều gì — khác hẳn `polling.py`,
nơi đọc nhầm `job` dẫn tới chẩn đoán sai. Ai cần sự thật trần thì có `--json`.

Hàm thuần, trừ `fetch_files`/`fetch_quota` nhận sẵn client.
"""

from __future__ import annotations

from typing import Any

__all__ = [
    "fetch_files",
    "fetch_quota",
    "unwrap_listing",
    "describe_shape",
    "row_view",
    "format_table",
    "format_quota",
]

# Tên khoá bọc hay gặp ở API phân trang. Thử theo thứ tự, lấy cái đầu tiên là list.
_LIST_WRAPPERS = ("data", "files", "items", "results", "records")

# Mỗi cột: danh sách tên ứng viên, lấy giá trị non-empty đầu tiên.
_FIELD_CANDIDATES = {
    "id":       ("id", "file_id", "fileId"),
    "name":     ("file_name", "fileName", "name", "original_name", "originalName"),
    "status":   ("status",),
    "created":  ("created_at", "createdAt", "uploaded_at", "uploadedAt", "inserted_at"),
    "duration": ("duration_seconds", "estimated_duration_seconds", "durationSeconds", "duration"),
}

_PLACEHOLDER = "—"


def fetch_files(client, *, limit: int = 20, status: str | None = None) -> Any:
    """Một lần `GET /files`. Trả payload thô — việc bóc tách để `unwrap_listing` làm.

    Tham số lọc/phân trang gửi theo tên openapi mô tả. Server bỏ qua tham số lạ thì
    cùng lắm là trả nhiều hơn mong muốn, và `unwrap_listing` vẫn cắt đúng `limit`.
    """
    params: dict[str, Any] = {"limit": limit}
    if status:
        params["status"] = status
    response = client.get("/files", params=params)
    response.raise_for_status()
    return response.json()


def fetch_quota(client) -> dict | None:
    """`GET /quota/me`. Best-effort: mất nó thì mất một dòng số liệu, không hỏng lệnh."""
    try:
        response = client.get("/quota/me")
        if response.status_code >= 400:
            return None
        payload = response.json()
        return payload if isinstance(payload, dict) else None
    except Exception:
        return None


def unwrap_listing(payload: Any, *, limit: int | None = None) -> list[dict]:
    """Bóc payload thành list row, chấp nhận mảng trần lẫn object bọc.

    Shape không nhận ra → list rỗng, KHÔNG ném lỗi. Người gọi phân biệt được
    "không có file" với "không đọc nổi shape" bằng `describe_shape`.
    """
    rows: list = []
    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        for key in _LIST_WRAPPERS:
            value = payload.get(key)
            if isinstance(value, list):
                rows = value
                break

    rows = [r for r in rows if isinstance(r, dict)]
    return rows[:limit] if limit is not None else rows


def describe_shape(payload: Any) -> str:
    """Câu mô tả shape nhận được — để báo người bảo trì khi không bóc được row nào."""
    if isinstance(payload, list):
        return f"mảng trần, {len(payload)} phần tử"
    if isinstance(payload, dict):
        return f"object với khoá: {sorted(payload)}"
    return f"kiểu {type(payload).__name__}"


def _first_present(row: dict, names: tuple[str, ...]) -> Any:
    for name in names:
        value = row.get(name)
        if value not in (None, ""):
            return value
    return None


def _short_time(raw: Any) -> str:
    """`2026-09-21T20:12:33.123Z` → `2026-09-21 20:12`. Không parse được thì trả nguyên."""
    if not isinstance(raw, str) or len(raw) < 16:
        return str(raw) if raw else _PLACEHOLDER
    head = raw[:16].replace("T", " ")
    return head if head[:4].isdigit() else raw


def _short_duration(raw: Any) -> str:
    """Giây → `mm:ss`. Giá trị không phải số thì trả placeholder."""
    try:
        total = int(float(raw))
    except (TypeError, ValueError):
        return _PLACEHOLDER
    if total < 0:
        return _PLACEHOLDER
    return f"{total // 60}:{total % 60:02d}"


def row_view(row: dict) -> dict[str, str]:
    """Một row thô → các cột đã sẵn sàng in. Khoá thiếu thành `—`, không bao giờ nổ."""
    view = {}
    for column, names in _FIELD_CANDIDATES.items():
        raw = _first_present(row, names)
        if column == "created":
            view[column] = _short_time(raw)
        elif column == "duration":
            view[column] = _short_duration(raw)
        else:
            view[column] = str(raw) if raw is not None else _PLACEHOLDER
    return view


def format_table(rows: list[dict]) -> str:
    """Bảng canh cột. Rỗng thì trả câu giải thích, không trả bảng trống."""
    if not rows:
        return "Chưa có file nào trong lịch sử."

    views = [row_view(r) for r in rows]
    headers = {"created": "THỜI ĐIỂM", "name": "TÊN FILE",
               "duration": "DÀI", "status": "TRẠNG THÁI", "id": "FILE_ID"}
    order = ["created", "name", "duration", "status", "id"]

    widths = {
        col: max(len(headers[col]), *(len(v[col]) for v in views))
        for col in order
    }
    line = "  ".join(headers[col].ljust(widths[col]) for col in order).rstrip()
    out = [line, "  ".join("-" * widths[col] for col in order).rstrip()]
    for view in views:
        out.append("  ".join(view[col].ljust(widths[col]) for col in order).rstrip())
    return "\n".join(out)


def format_quota(quota: dict | None) -> str:
    """Dòng quota. Thiếu số liệu thì nói thẳng là không đọc được, không đoán."""
    if not quota:
        return "Quota: không đọc được (/quota/me không trả lời)."

    available = quota.get("available_minutes")
    limit = quota.get("monthly_limit_minutes")
    if not isinstance(available, int) or not isinstance(limit, int):
        return f"Quota: shape lạ — nhận được khoá {sorted(quota)}."
    return f"Quota tháng này: còn {available}/{limit} phút (đặt lại ngày 1 hàng tháng)."
