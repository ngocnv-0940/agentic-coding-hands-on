"""Hợp đồng của `GET /files/{id}` — tập trạng thái hợp lệ và tập khoá bắt buộc.

Bốn route client đang dùng **không có trong `openapi.json`** của service. Nguy hiểm
nhất là object con `job` của `GET /files/{id}`: cả bảng 7 nhánh ở `polling.py` bám
vào nó. Upstream đổi tên một trường là mọi bản kit đã cài hỏng, và phía Takumi
không có CI nào bắt được (CI không có secret nên không gọi được API thật).

**Vì sao phải kiểm KHOÁ chứ không chỉ kiểm GIÁ TRỊ.** Bản đầu của `polling.py` chỉ
cảnh báo khi gặp *giá trị lạ*. Đo thử thì thấy nó mù với kiểu breaking change hay
gặp nhất — đổi tên trường:

    upstream đổi `job` -> `jobInfo`
      -> payload.get("job") là None
      -> nhánh "giá trị lạ" không kích hoạt (vì `job is not None` = False)
      -> client rơi vào nhánh `job is None`, sau 90 giây báo "Hàng đợi đang tắc"
      -> quay tới hết hạn 30 phút rồi kết "ĐỪNG chạy lại"

Tức là **chẩn đoán sai một cách tự tin, sau 30 phút, chỉ nhầm sang đội khác**.
Tệ hơn hỏng im lặng. Kiểm khoá biến nó thành lỗi nêu đích danh, trong 3 giây.

**Nguyên tắc thiết kế — chỉ kiểm khoá CÓ MẶT, không bao giờ từ chối khoá lạ.**
Upstream thêm trường mới là chuyện bình thường và phải luôn an toàn. Bộ kiểm này
chỉ được đỏ khi thứ ta THẬT SỰ đọc biến mất; siết hơn là nó thành của nợ.

An toàn với báo động giả: `files-controller.ts:227-233` phát `job` là object có
đủ mọi khoá (dùng `?? null`) hoặc `null` tường minh — không bao giờ thiếu khoá
giữa chừng. Nên đòi khoá có mặt ngay từ vòng poll đầu là an toàn.
"""

from __future__ import annotations

from typing import Any

__all__ = [
    "KNOWN_FILE_STATUSES",
    "KNOWN_JOB_STATUSES",
    "REQUIRED_FILE_KEYS",
    "REQUIRED_JOB_KEYS",
    "check_file_payload",
    "describe_drift",
]

# Quan sát được trên service thật 2026-09-21 (verify-260921-2012).
KNOWN_FILE_STATUSES = frozenset(
    {"pending_upload", "uploaded", "queued", "processing", "transcribing", "completed", "error"}
)
KNOWN_JOB_STATUSES = frozenset({"pending", "processing", "completed", "error"})

# Khoá client THẬT SỰ đọc. Thiếu một cái là logic bên dưới sai, không phải suy biến nhẹ.
REQUIRED_FILE_KEYS = frozenset({"status", "job"})
REQUIRED_JOB_KEYS = frozenset({"id", "status", "progress", "stage_message", "error_message"})


def check_file_payload(payload: Any) -> list[str]:
    """Trả danh sách khoá BẮT BUỘC bị thiếu. Rỗng nghĩa là hợp đồng còn nguyên.

    Khoá lạ được bỏ qua có chủ ý — xem nguyên tắc thiết kế ở docstring module.
    """
    if not isinstance(payload, dict):
        return ["<toàn bộ payload không phải object JSON>"]

    missing = sorted(k for k in REQUIRED_FILE_KEYS if k not in payload)

    # `job` là null hợp lệ (chưa có job). Chỉ soi khoá con khi nó là object.
    #
    # Kiểu của `job` cũng là một phần hợp đồng. Bản đầu chỉ có nhánh `isinstance(job, dict)`:
    # `job` biến thành scalar (upstream rút gọn còn `"J1"`) rơi ra ngoài cả hai nhánh, bộ dò
    # trả rỗng = "hợp đồng còn nguyên", rồi `polling.py` gọi `job.get("status")` và nổ
    # AttributeError trần — mất cả file_id lẫn lệnh curl, đúng thứ module này sinh ra để chặn.
    job = payload.get("job")
    if job is not None and not isinstance(job, dict):
        missing.append(f"job (phải là object hoặc null, nhận được {type(job).__name__})")
    elif isinstance(job, dict):
        missing += sorted(f"job.{k}" for k in REQUIRED_JOB_KEYS if k not in job)
    return missing


def describe_drift(payload: Any, missing: list[str]) -> str:
    """Câu lỗi nêu đích danh khoá mất VÀ khoá thực nhận — để báo được cho người bảo trì."""
    got_file = sorted(payload) if isinstance(payload, dict) else []
    job = payload.get("job") if isinstance(payload, dict) else None
    got_job = sorted(job) if isinstance(job, dict) else None

    lines = [
        "Hợp đồng API đã đổi — thiếu khoá: " + ", ".join(missing) + ".",
        f"     Khoá nhận được ở cấp file: {got_file}",
    ]
    if got_job is not None:
        lines.append(f"     Khoá nhận được trong job: {got_job}")
    lines.append("     Báo người bảo trì skill: service đổi shape, client cần cập nhật.")
    return "\n".join(lines)
