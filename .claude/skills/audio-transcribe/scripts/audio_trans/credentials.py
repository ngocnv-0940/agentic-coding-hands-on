"""Nơi DUY NHẤT đọc credential. Không module nào khác chạm `os.environ`.

Hai quy tắc bảo mật ở đây không phải trang trí:

1. [RT#1] `AUDIO_TRANS_API_URL` chỉ đọc từ biến môi trường THẬT, không từ `.env`.
   Key không có hạn dùng — lộ một lần là lộ vĩnh viễn. Một `.env` nằm trong cwd
   có thể do repo lạ cài vào; đọc base URL từ đó là để người khác chỉ định nơi
   nhận key của mình. Bắt buộc `https`; host lạ thì cảnh báo ra stderr.
2. [RT#14] Dùng `dotenv_values()` chứ không tự viết parser, và KHÔNG dùng
   `load_dotenv()` — `load_dotenv` đổ biến vào `os.environ`, làm `.env` lén cấp
   được cả những biến ta cố ý chỉ nhận từ môi trường thật.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from urllib.parse import urlparse

from dotenv import dotenv_values

from .errors import MissingCredentials

__all__ = ["Credentials", "load", "DEFAULT_BASE_URL"]

DEFAULT_BASE_URL = "https://audio-transcribe.sun-asterisk.ai/api/v1"
DEFAULT_HOST = "audio-transcribe.sun-asterisk.ai"

KEY_ENV = "AUDIO_TRANS_API_KEY"
URL_ENV = "AUDIO_TRANS_API_URL"

_HOW_TO_GET_KEY = (
    "Lấy key:\n"
    "  1. Đăng nhập https://audio-transcribe.sun-asterisk.ai bằng mail công ty\n"
    "  2. Sidebar > Integrations > API Keys > Create — chép ngay, key chỉ hiện MỘT lần\n"
    f"  3. export {KEY_ENV}=<key>   (hoặc thêm dòng đó vào .env ở thư mục đang chạy)"
)


@dataclass(frozen=True)
class Credentials:
    """Key + base URL đã kiểm.

    CẢNH BÁO cho người viết client.py/entrypoint: `__repr__` dưới đây chỉ bịt
    đường `print()`/`str()`/traceback. `vars(creds)`, `creds.__dict__` và
    `dataclasses.asdict(creds)` vẫn trả về key TRẦN. Đừng đưa object này vào
    log, dump JSON hay bất kỳ chỗ serialize nào — lấy `masked()` mà dùng.
    """

    api_key: str
    base_url: str

    def masked(self) -> str:
        """Dạng hiển thị được. Dùng cái này ở mọi chỗ cần nhắc tới key."""
        if len(self.api_key) <= 6:
            return "***"
        return f"{self.api_key[:6]}…"

    def __repr__(self) -> str:  # chặn key rò qua repr/traceback của dataclass
        return f"Credentials(api_key={self.masked()!r}, base_url={self.base_url!r})"


def _read_key(env: dict, cwd_env: dict) -> str:
    key = (env.get(KEY_ENV) or cwd_env.get(KEY_ENV) or "").strip()
    if not key:
        raise MissingCredentials(
            f"Thiếu {KEY_ENV} — chưa có key thì không gọi được API.",
            hint=_HOW_TO_GET_KEY,
        )
    return key


def _read_base_url(env: dict, *, warn_stream) -> str:
    """URL chỉ từ môi trường thật. `.env` cố tình bị bỏ qua — xem [RT#1] ở đầu file."""
    raw = (env.get(URL_ENV) or "").strip()
    if not raw:
        return DEFAULT_BASE_URL

    url = raw.rstrip("/")
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise MissingCredentials(
            f"{URL_ENV} phải dùng https, đang là: {parsed.scheme or '(không có scheme)'}://…",
            hint=(
                "Key được gửi trong header của mọi request — qua http là gửi trần trên đường "
                f"truyền. Sửa {URL_ENV} thành https, hoặc bỏ hẳn để dùng mặc định."
            ),
        )
    if not parsed.netloc:
        raise MissingCredentials(
            f"{URL_ENV} không phải URL hợp lệ: {raw!r}",
            hint=f"Bỏ {URL_ENV} đi để dùng mặc định {DEFAULT_BASE_URL}",
        )

    if parsed.hostname != DEFAULT_HOST:
        print(
            f"[cảnh báo] {URL_ENV} trỏ tới host lạ: {parsed.hostname} "
            f"(mặc định {DEFAULT_HOST}). Key của bạn sẽ được gửi tới đó.",
            file=warn_stream,
        )
    return url


def load(env: dict | None = None, *, cwd_env_path: str = ".env", warn_stream=None) -> Credentials:
    """Đọc key + base URL. Tham số `env`/`cwd_env_path` để test bơm vào, mặc định là thật."""
    real_env = os.environ if env is None else env
    warn_stream = sys.stderr if warn_stream is None else warn_stream

    try:
        cwd_env = dotenv_values(cwd_env_path) if os.path.exists(cwd_env_path) else {}
    except Exception:
        cwd_env = {}  # .env hỏng không nên giết cả lần chạy — key có thể đã ở env thật

    return Credentials(
        api_key=_read_key(real_env, cwd_env),
        base_url=_read_base_url(real_env, warn_stream=warn_stream),
    )
