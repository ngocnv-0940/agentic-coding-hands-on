"""Đưa file lên server: xin đường presigned, PUT, rồi xác nhận bằng PATCH.

Tách khỏi `client.py` vì đây là một mối quan tâm trọn vẹn và riêng biệt — mọi
cạm bẫy của bước đưa file lên đều nằm gọn ở đây:

- Mỗi lần gọi `upload-url` là một row `files` MỚI ở `pending_upload`. Row đó xoá
  được, nhưng chỉ SAU KHI `upload_expires_at` trôi qua (3600s) — trước đó controller
  chặn bằng 409 (`files-controller.ts:610-617`). Nên hỏng ở bước PUT là ABORT,
  tuyệt đối không xin lại URL: mỗi lần xin là thêm một row phải đợi một tiếng mới dọn được.
- Presigned ký kèm `Content-Type` + `Content-Length` ⇒ body phải là file handle TRẦN.
- PATCH trả 202; timeout ở đó KHÔNG có nghĩa là thất bại (RT#5).
"""

from __future__ import annotations

import os

import httpx

from .errors import AudioTransError, describe_transport_error, translate_http_error

__all__ = ["upload_file", "confirm_upload"]

_CONNECT_TIMEOUT = 10
_UPLOAD_READ_TIMEOUT = 600


def _check(response: httpx.Response) -> dict:
    if response.status_code >= 400:
        raise AudioTransError(
            translate_http_error(response.status_code, response.text),
            status=response.status_code,
        )
    return response.json() if response.content else {}


def upload_file(api: httpx.Client, path: str, mime: str, size: int) -> dict:
    """Xin đường upload rồi PUT thẳng lên S3.

    Mỗi lần gọi `upload-url` là một row `files` mới ở `pending_upload`, không có
    purge. Nên 403 ở đây là ABORT, không xin lại URL (RT#3).
    """
    slot = _check(
        api.post("/files/upload-url", json={"file_name": os.path.basename(path), "file_size": size})
    )

    # Kiểm shape NGAY, trước khi bất cứ ai chạm vào `slot`. Route này nằm ngoài
    # `openapi.json` và ba khoá dưới đây đang được index TRẦN ở bốn chỗ — nguy hiểm
    # nhất là `slot["file_id"]` nằm BÊN TRONG handler lỗi mạng của khối PUT: đổi tên
    # trường ở server thì KeyError nổ ngay tại đó và NUỐT MẤT lỗi transport gốc,
    # người dùng nhận `KeyError: 'file_id'` thay vì "mất kết nối khi đẩy file lên S3".
    #
    # Kiểm sớm còn được thêm một cái lợi: lúc này PUT chưa chạy, nên ném ra đây
    # KHÔNG bỏ rơi row `pending_upload` nào — khác hẳn mọi đường lỗi phía dưới.
    if not isinstance(slot, dict):
        raise AudioTransError(
            f"/files/upload-url trả về {type(slot).__name__}, không phải object — hợp đồng đã đổi.",
            hint="Báo người bảo trì skill. Chưa có gì được tạo trên server, chạy lại cũng vô ích.",
        )
    thieu = [k for k in ("file_id", "upload_url", "upload_headers") if k not in slot]
    if thieu:
        raise AudioTransError(
            "/files/upload-url thiếu khoá: " + ", ".join(thieu) + ".\n"
            f"     Nhận được: {sorted(slot)}",
            hint="Hợp đồng API đã đổi — báo người bảo trì skill. Chưa có gì được tạo trên server.",
        )

    # Client riêng, KHÔNG mang header key — S3 không cần, và gửi đi là rò key sang bên thứ ba.
    try:
        with httpx.Client(timeout=httpx.Timeout(_UPLOAD_READ_TIMEOUT, connect=_CONNECT_TIMEOUT)) as s3:
            # [PR#7] File handle TRẦN. Bọc bất cứ thứ gì (progress wrapper, BytesIO, generator)
            # là httpx không fstat được độ dài, rơi sang Transfer-Encoding: chunked,
            # `Content-Length` đã ký biến mất, S3 trả 403. Đã xác minh httpx 0.27.2 gửi đúng.
            with open(path, "rb") as handle:
                response = s3.put(slot["upload_url"], headers=slot["upload_headers"], content=handle)
    except httpx.HTTPError as exc:
        # Rớt mạng giữa lúc đẩy file 1 GB là kịch bản có thật — read timeout ở đây đặt 600s
        # chính vì thế. Để exception trần bay ra là mất `file_id`, mà row `pending_upload`
        # đã tạo rồi và API không xoá được (DELETE trả 409).
        raise AudioTransError(
            f"Mất kết nối khi đẩy file lên S3: {describe_transport_error(exc)}\n"
            f"     file_id: {slot['file_id']}",
            hint="Chạy lại từ đầu; row cũ nằm lại trên server, không dọn được qua API.",
        ) from None

    if response.status_code >= 400:
        now = os.path.getsize(path)
        why = (
            f"file đang bị ghi dở hoặc đồng bộ — dung lượng đổi từ {size} sang {now} byte"
            if now != size
            else "chữ ký lệch header, hoặc URL đã hết hạn (URL sống 3600 giây)"
        )
        raise AudioTransError(
            f"Upload lên S3 thất bại (HTTP {response.status_code}): {why}.\n"
            f"     file_id: {slot['file_id']}",
            status=response.status_code,
            hint="Không thử lại tự động: xin URL mới là bỏ rơi row cũ ở pending_upload. "
                 "Row đó xoá được, NHƯNG chỉ sau khi URL hết hạn (3600s) — trước đó "
                 "DELETE trả 409 'wait for the upload URL to expire'.",
        )
    return slot


def confirm_upload(api: httpx.Client, file_id: str, hints: str, duration: int) -> None:
    """PATCH sang `uploaded`. Trả 202; 409 nghĩa là đã PATCH rồi.

    [RT#5] Timeout ở đây KHÔNG có nghĩa là thất bại — server có thể đã ghi xong.
    Đối chiếu bằng một GET trước khi kết luận, nếu không sẽ bỏ rơi một job đã trừ quota.
    """
    body = {"status": "uploaded", "estimated_duration_seconds": duration}
    if hints:
        body["hints"] = hints

    try:
        _check(api.patch(f"/files/{file_id}", json=body))
        return
    except httpx.HTTPError as exc:
        transport_error = describe_transport_error(exc)
    except AudioTransError as exc:
        # `_check` ném AudioTransError — lớp KHÁC httpx.HTTPError. Bản đầu chỉ bắt lớp
        # sau, nên PATCH trả 502/503 bay thẳng ra khỏi hàm, bỏ qua trọn vẹn đường đối
        # chiếu viết riêng cho nó: file nằm trên server không ai xác nhận, người dùng
        # không biết nên chạy lại hay không — đúng hậu quả mà [RT#5] sinh ra để chặn.
        #
        # 4xx thì vẫn ném ngay, có chủ ý: 409 nghĩa là ĐÃ PATCH rồi, 400 là body sai,
        # 401 là key hỏng — đối chiếu rồi PATCH lại không chữa được cái nào.
        if exc.status is None or exc.status < 500:
            raise
        transport_error = f"HTTP {exc.status}"

    # Lần đối chiếu này quyết định có bỏ cuộc hay PATCH lại, nên mọi đường ra khỏi nó
    # phải là KẾT LUẬN CHẮC CHẮN. Bản đầu đọc thẳng `.json().get("status")`: một 503 kèm
    # body JSON (`{"error": ...}`) cho ra `status=None`, `None != "pending_upload"` là
    # True, hàm return êm — bỏ rơi đúng cái job mà [RT#5] sinh ra để cứu. Nên ở đây chỉ
    # đi tiếp khi THẬT SỰ đọc được một status hợp lệ; còn lại đều ném ra có file_id.
    _hint = "Kiểm bằng curl trước khi chạy lại — chạy lại có thể trừ quota lần hai."
    try:
        probe = api.get(f"/files/{file_id}")
    except Exception:
        raise AudioTransError(
            f"PATCH không rõ kết quả ({transport_error}) và không đối chiếu được.\n"
            f"     file_id: {file_id}",
            hint=_hint,
        ) from None

    # Kiểm mã HTTP TRƯỚC khi đụng vào body: một 500 trả trang HTML của proxy thì `.json()`
    # ném, và nếu bắt chung thì câu lỗi mất luôn mã 500 — thứ duy nhất nói được là lỗi phía server.
    if probe.status_code >= 400:
        raise AudioTransError(
            f"PATCH không rõ kết quả ({transport_error}), và lần đối chiếu cũng lỗi "
            f"(HTTP {probe.status_code}).\n"
            f"     file_id: {file_id}",
            status=probe.status_code,
            hint=_hint,
        )

    try:
        payload = probe.json() if probe.content else {}
    except Exception:
        raise AudioTransError(
            f"PATCH không rõ kết quả ({transport_error}), và lần đối chiếu trả về "
            f"body không phải JSON.\n"
            f"     file_id: {file_id}",
            hint=_hint,
        ) from None

    current = payload.get("status") if isinstance(payload, dict) else None
    if not isinstance(current, str):
        # Cùng một cái bẫy, cửa khác: GET 200 nhưng shape đã đổi (mất khoá `status`).
        # Coi đó là "PATCH đã ăn" cũng bỏ rơi job y như trên.
        raise AudioTransError(
            f"PATCH không rõ kết quả ({transport_error}), và lần đối chiếu trả về "
            f"payload không đọc được trạng thái.\n"
            f"     Nhận được: {sorted(payload) if isinstance(payload, dict) else type(payload).__name__}\n"
            f"     file_id: {file_id}",
            hint=_hint,
        )

    if current != "pending_upload":
        return                                   # PATCH đã ăn, đi tiếp bình thường

    # Thật sự chưa ăn — thử đúng một lần nữa. Lần này cũng phải bọc: quan sát thật
    # 2026-09-21 cho thấy mạng có thể chập LIÊN TIẾP, và để httpx.ReadTimeout trần
    # bay ra là người dùng nhận traceback 40 dòng thay vì một câu đọc được.
    _hint_hai_lan = (
        "File đã nằm trên server nhưng chưa được xác nhận. Kiểm bằng curl trước "
        "khi chạy lại — chạy lại từ đầu sẽ tạo thêm một row pending_upload nữa."
    )
    try:
        _check(api.patch(f"/files/{file_id}", json=body))
    except httpx.HTTPError as exc:
        raise AudioTransError(
            f"PATCH thất bại hai lần liên tiếp ({describe_transport_error(exc)}).\n"
            f"     file_id: {file_id}",
            hint=_hint_hai_lan,
        ) from None
    except AudioTransError as exc:
        # Cùng cái lỗ hai lớp exception ở trên, cửa ra: câu của `translate_http_error`
        # không mang file_id, mà đây đúng là lúc người dùng cần nó nhất.
        raise AudioTransError(
            f"PATCH thất bại hai lần liên tiếp ({exc.message.splitlines()[0]}).\n"
            f"     file_id: {file_id}",
            status=exc.status,
            hint=_hint_hai_lan,
        ) from None
