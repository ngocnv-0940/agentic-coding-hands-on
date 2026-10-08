#!/usr/bin/env python3
"""Xem lại lịch sử transcribe của chính mình, ngay ở terminal.

    python3 history_audio_trans.py                      # 20 file gần nhất + quota
    python3 history_audio_trans.py --limit 50
    python3 history_audio_trans.py --status completed
    python3 history_audio_trans.py --json               # payload thô, không định dạng

Xác thực bằng cùng `AUDIO_TRANS_API_KEY` mà lệnh transcribe dùng, nên những gì hiện
ra ở đây đúng bằng những gì hiện trên dashboard web của tài khoản đó.

Không tiêu quota, không tạo file, chỉ đọc.
"""

from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import httpx  # noqa: E402

from audio_trans import credentials as creds_module          # noqa: E402
from audio_trans import history as history_module            # noqa: E402
from audio_trans.errors import AudioTransError, translate_http_error  # noqa: E402

EXIT_OK, EXIT_ERROR = 0, 1

_CONNECT_TIMEOUT = 10
_READ_TIMEOUT = 30


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def _positive_int(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        raise argparse.ArgumentTypeError(f"phải là số nguyên, nhận được {raw!r}") from None
    if value <= 0:
        raise argparse.ArgumentTypeError(f"phải lớn hơn 0, nhận được {value}")
    return value


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="history_audio_trans.py",
        description="Liệt kê lịch sử transcribe của tài khoản đang cầm key.",
    )
    parser.add_argument(
        "--limit", type=_positive_int, default=20,
        help="số file gần nhất cần lấy (mặc định 20)",
    )
    parser.add_argument(
        "--status",
        help="lọc theo trạng thái, vd completed / processing / error",
    )
    parser.add_argument(
        "--json", action="store_true", dest="as_json",
        help="in payload thô của server thay vì bảng — đường lui khi shape đổi",
    )
    return parser.parse_args(argv)


def scrub(text: str, secret: str | None) -> str:
    """[RT#13] Cùng bất biến với entrypoint transcribe: không bao giờ in key ra."""
    return text.replace(secret, "***") if secret else text


def main(argv=None) -> int:
    args = parse_args(argv)
    api_key = None

    try:
        credentials = creds_module.load()
        api_key = credentials.api_key

        with httpx.Client(
            base_url=credentials.base_url,
            headers={"x-api-key": credentials.api_key},
            timeout=httpx.Timeout(_READ_TIMEOUT, connect=_CONNECT_TIMEOUT),
        ) as client:
            try:
                payload = history_module.fetch_files(
                    client, limit=args.limit, status=args.status
                )
            except httpx.HTTPStatusError as exc:
                raise AudioTransError(
                    translate_http_error(exc.response.status_code, exc.response.text),
                    status=exc.response.status_code,
                ) from None

            if args.as_json:
                print(json.dumps(payload, ensure_ascii=False, indent=2))
                return EXIT_OK

            quota = history_module.fetch_quota(client)

        rows = history_module.unwrap_listing(payload, limit=args.limit)
        if not rows:
            # Phân biệt "không có file" với "không bóc nổi shape" — hai việc khác hẳn.
            shape = history_module.describe_shape(payload)
            log(f"[cảnh báo] Không bóc được row nào. Server trả: {shape}")
            log("           Nếu tài khoản có file thật thì hợp đồng API đã đổi — "
                "chạy lại với --json và báo người bảo trì skill.")

        print(history_module.format_quota(quota))
        print()
        print(history_module.format_table(rows))
        return EXIT_OK

    except AudioTransError as exc:
        log(f"\nLỗi: {scrub(str(exc), api_key)}")
        return EXIT_ERROR
    except httpx.HTTPError as exc:
        log(f"\nLỗi mạng: {type(exc).__name__} — thử lại.")
        return EXIT_ERROR
    except KeyboardInterrupt:
        log("\nĐã dừng theo yêu cầu.")
        return EXIT_ERROR
    except Exception:
        # Lưới cuối, giống hệt `transcribe_audio_trans.py`. Thiếu nhánh này thì một
        # proxy trả trang HTML thay JSON là `json.JSONDecodeError` bay ra thành
        # traceback 20 dòng — thứ người dùng không làm gì được với nó.
        # `scrub()` quanh traceback là BẮT BUỘC ([RT#13]): repr của một biến cục bộ
        # trong khung stack có thể chứa key, và traceback in cả chúng.
        log("\nLỗi ngoài dự kiến — báo lại cho người bảo trì skill:")
        log(scrub(traceback.format_exc(), api_key))
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
