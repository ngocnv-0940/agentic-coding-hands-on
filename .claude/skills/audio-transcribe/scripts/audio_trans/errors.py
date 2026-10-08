"""Lỗi của client Audio Transcribe + bộ dịch mã HTTP sang câu tiếng Việt.

Module nền: KHÔNG import module nào khác trong gói. Mọi module khác import nó.

Nguồn mã lỗi: `web/lib/controllers/files-controller.ts` và `jobs-controller.ts`
của service. 402/429 không có trong `openapi.json` nhưng vẫn bắt — route ngoài
spec có thật, và im lặng nuốt chúng thì người dùng không biết chuyện gì xảy ra.
"""

from __future__ import annotations

import json
from typing import Any

__all__ = [
    "AudioTransError",
    "MissingCredentials",
    "UnsupportedMedia",
    "DurationProbeFailed",
    "translate_http_error",
    "describe_transport_error",
]


class AudioTransError(Exception):
    """Lỗi gốc. `hint` là dòng gợi ý hành động, in sau thông báo chính."""

    def __init__(
        self,
        message: str,
        *,
        status: int | None = None,
        payload: Any = None,
        hint: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.payload = payload
        self.hint = hint

    def __str__(self) -> str:
        return f"{self.message}\n  → {self.hint}" if self.hint else self.message


class MissingCredentials(AudioTransError):
    """Thiếu `AUDIO_TRANS_API_KEY`, hoặc `AUDIO_TRANS_API_URL` không hợp lệ."""


class UnsupportedMedia(AudioTransError):
    """Đuôi file ngoài whitelist, hoặc vượt trần dung lượng."""


class DurationProbeFailed(AudioTransError):
    """`ffprobe` không đo được thời lượng. Không bao giờ trả None thay cho lỗi này.

    Bỏ trống `estimated_duration_seconds` khi PATCH là để trigger đoán theo dung
    lượng ở 960 KB/phút — video bị vống ~8.7 lần, chặn trần 120 phút. Một video
    ăn 1/5 quota tháng. Nên thà dừng còn hơn đoán.
    """


def _coerce_payload(body: Any) -> Any:
    """Về dict/list nếu parse được JSON, ngược lại trả chuỗi đã cắt ngắn.

    Body không phải lúc nào cũng là JSON: lỗi từ S3/CDN trả XML, proxy trả HTML.
    """
    if body is None or isinstance(body, (dict, list)):
        return body
    if isinstance(body, (bytes, bytearray)):
        try:
            body = body.decode("utf-8", errors="replace")
        except Exception:
            return None
    if isinstance(body, str):
        text = body.strip()
        if not text:
            return None
        try:
            return json.loads(text)
        except ValueError:
            return text[:500]
    return body


def _field(payload: Any, *names: str) -> Any:
    """Lấy trường đầu tiên có mặt trong payload dict."""
    if not isinstance(payload, dict):
        return None
    for name in names:
        if payload.get(name) is not None:
            return payload[name]
    return None


_MESSAGES = {
    400: "Yêu cầu sai định dạng.",
    401: "Key sai hoặc đã bị thu hồi.",
    404: "Không thấy file/job — có thể đã bị xoá.",
    409: "Trạng thái hiện tại không cho phép thao tác này.",
    422: "Vượt giới hạn dung lượng (trần 1 GB).",
    429: "Bị chặn tốc độ — gửi quá nhiều yêu cầu.",
    503: "Hệ thống đang đầy tải, thử lại sau.",
}

_HINTS = {
    401: "Tạo key mới ở Integrations > API Keys rồi đặt lại AUDIO_TRANS_API_KEY.",
    404: "Kiểm bằng: curl -H \"x-api-key: $AUDIO_TRANS_API_KEY\" <base_url>/files/<file_id>",
    409: "File đã rời trạng thái pending_upload (nhiều khả năng đã PATCH rồi). Đừng thử lại.",
    422: "Cắt nhỏ file, hoặc nén xuống dưới 1 GB.",
    429: "Chờ một lát rồi chạy lại.",
    503: "Chờ vài phút rồi chạy lại.",
}


def _quota_message(payload: Any) -> str:
    """402 — kèm số phút còn/đã xin nếu server trả về."""
    base = "Hết quota tháng (mặc định 600 phút/user, tính theo tháng dương lịch)."
    available = _field(payload, "available_minutes", "availableMinutes", "available")
    requested = _field(payload, "requested_minutes", "requestedMinutes", "requested")
    if available is None and requested is None:
        return base
    parts = []
    if available is not None:
        parts.append(f"còn {available} phút")
    if requested is not None:
        parts.append(f"vừa xin {requested} phút")
    return f"{base} ({', '.join(parts)})"


def translate_http_error(status: int, body: Any = None) -> str:
    """Mã HTTP + body → một câu tiếng Việt nói được người dùng phải làm gì."""
    payload = _coerce_payload(body)

    if status == 402:
        message = _quota_message(payload)
    elif status in _MESSAGES:
        message = _MESSAGES[status]
    elif 500 <= status < 600:
        message = f"Lỗi phía server (HTTP {status})."
    else:
        message = f"Yêu cầu thất bại (HTTP {status})."

    # Câu của server thường cụ thể hơn câu chung của ta — nối thêm, không thay thế.
    detail = _field(payload, "message", "error", "detail")
    if isinstance(detail, str) and detail.strip():
        message = f"{message} Server nói: {detail.strip()[:200]}"

    hint = _HINTS.get(status)
    return f"{message}\n  → {hint}" if hint else message


def describe_transport_error(exc: BaseException) -> str:
    """Lỗi tầng vận chuyển (chưa có response): timeout, DNS, mất kết nối.

    CỐ Ý khớp theo tên class thay vì `isinstance` với kiểu của httpx: làm vậy thì
    module này không phải import httpx, giữ nó thành module nền không phụ thuộc ai.
    Đừng "sửa" thành isinstance — đổi lại chỉ là câu chữ cụ thể hơn cho vài loại
    lỗi hiếm (ReadError/WriteError rơi vào nhánh chung, vẫn được xử lý đúng).
    """
    name = type(exc).__name__
    if "Timeout" in name:
        return f"Hết thời gian chờ mạng ({name}). Mạng chậm hoặc server không phản hồi."
    if "Connect" in name:
        return f"Không kết nối được tới server ({name}). Kiểm mạng và AUDIO_TRANS_API_URL."
    return f"Lỗi mạng ({name}): {exc}"
