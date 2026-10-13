#!/usr/bin/env python3
"""Kiểm nhanh hợp đồng API còn nguyên không — chạy TAY, không nằm trong CI.

CI của repo không có secret nên không thể gọi API thật. Script này lấp đúng khoảng
đó: chạy trước một job dài, hoặc sau khi service bên kia deploy, hoặc khi skill bắt
đầu cư xử lạ. Nó dùng CHUNG `contract.py` với client — nên không có chuyện script
nói "ổn" mà client vẫn vỡ.

    python3 check_contract.py                 # chỉ kiểm quota/me (0 quota, 0 file)
    python3 check_contract.py --file-id <id>  # kiểm luôn shape GET /files/{id}

Không tạo file, không tiêu quota.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import httpx  # noqa: E402

from audio_trans import credentials as creds_module  # noqa: E402
from audio_trans.contract import (  # noqa: E402
    REQUIRED_JOB_KEYS,
    check_file_payload,
    describe_drift,
)
from audio_trans.errors import AudioTransError  # noqa: E402


class Netfail(str):
    """Lỗi tầng vận chuyển. Tách khỏi lỗi hợp đồng vì cách xử lý khác hẳn:
    mạng chập thì chạy lại, hợp đồng đổi thì phải sửa client."""


def _probe(client: httpx.Client, path: str) -> tuple[bool, object]:
    try:
        response = client.get(path)
    except httpx.HTTPError as exc:
        return False, Netfail(f"lỗi mạng ({type(exc).__name__}) — chạy lại thử")
    # Phân loại TRƯỚC khi đếm. Một mã HTTP >= 400 nói rất ít về shape: 401 chỉ là key
    # bị thu hồi, 503 chỉ là service đang xuống, 429 chỉ là gọi quá nhanh. Gộp cả ba
    # vào `failures` là script in "hợp đồng đã đổi, báo người bảo trì skill" rồi exit 1
    # — đúng kiểu chẩn đoán sai mà cặp netfails/exit-2 ở cuối file sinh ra để loại bỏ.
    if response.status_code in (401, 403):
        return False, Netfail(
            f"HTTP {response.status_code} — key sai hoặc bị thu hồi, không phải shape"
        )
    if response.status_code == 429:
        return False, Netfail(f"HTTP {response.status_code} — bị rate-limit, chờ rồi chạy lại")
    if response.status_code >= 500:
        return False, Netfail(f"HTTP {response.status_code} — service đang lỗi, thử lại sau")
    if response.status_code >= 400:
        # Còn lại là 4xx thật sự nói về request: 404 (id không tồn tại), 400 (tham số
        # sai) — những mã mà chạy lại y nguyên sẽ ra y nguyên. Giữ ở `failures`.
        return False, f"HTTP {response.status_code}"
    try:
        return True, response.json()
    except ValueError:
        return False, "trả về không phải JSON"


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Kiểm hợp đồng Audio Transcribe API.")
    parser.add_argument("--file-id", help="id một file đã có để soi shape GET /files/{id}")
    args = parser.parse_args(argv)

    try:
        creds = creds_module.load()
    except AudioTransError as exc:
        print(f"[X] {exc}")
        return 1

    failures = 0
    netfails = 0
    with httpx.Client(
        base_url=creds.base_url, headers={"x-api-key": creds.api_key},
        timeout=httpx.Timeout(30, connect=10),
    ) as client:
        ok, payload = _probe(client, "/files")
        print(f"[{'OK' if ok else ' X'}] GET /files            {'' if ok else payload}")
        if not ok:
            netfails += isinstance(payload, Netfail)
            failures += not isinstance(payload, Netfail)

        ok, quota = _probe(client, "/quota/me")
        if ok and isinstance(quota, dict) and "available_minutes" in quota:
            print(f"[OK] GET /quota/me        còn {quota['available_minutes']} phút")
        else:
            print(f"[ X] GET /quota/me        {quota if not ok else 'thiếu available_minutes'}")
            if isinstance(quota, Netfail):
                netfails += 1
            else:
                failures += 1

        if args.file_id:
            ok, payload = _probe(client, f"/files/{args.file_id}")
            if not ok:
                print(f"[ X] GET /files/{{id}}      {payload}")
                if isinstance(payload, Netfail):
                    netfails += 1
                else:
                    failures += 1
            else:
                missing = check_file_payload(payload)
                if missing:
                    print("[ X] GET /files/{id}      " + describe_drift(payload, missing))
                    failures += 1
                else:
                    job = payload.get("job")
                    detail = "job=null (chưa có job)" if job is None else \
                             f"job có đủ {len(REQUIRED_JOB_KEYS)} khoá"
                    print(f"[OK] GET /files/{{id}}      {detail}")
        else:
            print("[--] GET /files/{id}      bỏ qua (truyền --file-id để kiểm)")

    print()
    if failures:
        print(f"{failures} kiểm tra THẤT BẠI vì SHAPE — hợp đồng đã đổi. Báo người bảo trì skill.")
        return 1
    if netfails:
        # Đừng đổ cho hợp đồng thứ mà mạng gây ra — đó đúng là kiểu chẩn đoán sai
        # mà cả bộ dò này sinh ra để loại bỏ.
        print(f"{netfails} kiểm tra không chạy được vì MẠNG, không phải vì hợp đồng. Thử lại.")
        return 2
    print("Hợp đồng còn nguyên.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
