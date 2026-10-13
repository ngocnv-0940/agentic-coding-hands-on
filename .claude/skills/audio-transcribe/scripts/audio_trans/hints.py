"""Gộp context JSON + ngôn ngữ + hints tự do thành một chuỗi `hints`.

`hints` là ô DUY NHẤT còn lại để truyền tri thức miền sang service. API không có
tham số gợi ý ngôn ngữ nguồn (`target_language` là ngôn ngữ DỊCH SANG), nên
`--language vi,en,ja` phải biến thành một câu mô tả nằm trong chính chuỗi này.

Thứ tự ưu tiên khi vượt trần 5000 ký tự — cắt ngược từ dưới lên:
    1. câu ngôn ngữ   giữ tới cùng, không bao giờ cắt
    2. general        rụng thứ ba
    3. terms          cắt bớt từ cuối danh sách, rụng thứ hai
    4. text           rụng ĐẦU TIÊN
Lý do: một thuật ngữ viết đúng chính tả cứu được nhiều từ hơn một đoạn văn mô tả.

**Mặc định KHÔNG gửi đoạn văn tự trích từ tài liệu** (`include_prose=False`).

Lý do: chuỗi này đi tới HAI nơi — lưu vĩnh viễn ở cột `files.hints` của service
(xoá mềm, không có job purge), VÀ được bọc thành `{text: hints}` rồi chuyển tiếp
sang Soniox, hãng STT bên thứ ba (`files-controller.ts:262,424`).

Audio sang Soniox là bản chất của mọi STT thuê ngoài, không tránh được. Nhưng đoạn
văn mô tả thì khác hẳn về nguồn gốc: nó do Claude **tự trích từ tài liệu người dùng
đưa cho một việc cục bộ** — người dùng chưa từng hình thành ý định gửi nội dung spec
sang hãng thứ ba. Và nó gần như không mất gì: `text` vẫn giữ nguyên giá trị ở Phase 3,
nơi Claude sửa SRT bằng context JSON đầy đủ, chạy hoàn toàn trên máy người dùng.

Cái bias được model là `terms` — danh sách tên riêng. Đó là thứ giữ lại.
Chuỗi `--hints` người dùng TỰ GÕ cũng giữ: đó là ý định tường minh.

Hàm thuần, không I/O.
"""

from __future__ import annotations

from typing import Any

__all__ = ["build_hints", "MAX_HINTS_CHARS"]

MAX_HINTS_CHARS = 5000

# Mã lạ (vd "jp" thay "ja") cố ý KHÔNG validate cứng — đưa nguyên vào câu mô tả,
# model tự hiểu. Chặn cứng chỉ tổ làm hỏng lần chạy vì một lỗi gõ vô hại.
_LANGUAGE_NAMES = {
    "vi": "tiếng Việt",
    "en": "tiếng Anh",
    "ja": "tiếng Nhật",
    "zh": "tiếng Trung",
    "ko": "tiếng Hàn",
    "fr": "tiếng Pháp",
    "es": "tiếng Tây Ban Nha",
    "de": "tiếng Đức",
}


def _language_sentence(language: str | None) -> str:
    if not language or not language.strip():
        return ""
    codes = [c.strip() for c in language.split(",") if c.strip()]
    if not codes:
        return ""
    names = [_LANGUAGE_NAMES.get(c.lower(), c) for c in codes]
    if len(names) == 1:
        return f"Bản ghi chủ yếu {names[0]}."
    return f"Bản ghi chủ yếu {names[0]}, xen {', '.join(names[1:])}."


def _unwrap(context_json: dict | None) -> dict:
    """Chấp nhận cả {"context": {...}} lẫn {...} trần."""
    if not isinstance(context_json, dict):
        return {}
    inner = context_json.get("context")
    return inner if isinstance(inner, dict) else context_json


def _general_sentence(context: dict) -> str:
    entries = context.get("general")
    if not isinstance(entries, list):
        return ""
    parts = []
    for item in entries:
        if not isinstance(item, dict):
            continue
        key = str(item.get("key", "")).strip()
        value = str(item.get("value", "")).strip()
        # Template chưa điền để lại giá trị dạng "<project or product name>" — bỏ.
        if key and value and not value.startswith("<"):
            parts.append(f"{key}: {value}")
    return ". ".join(parts) + "." if parts else ""


def _term_list(context: dict) -> list[str]:
    terms = context.get("terms")
    if not isinstance(terms, list):
        return []
    seen, out = set(), []
    for term in terms:
        text = str(term).strip()
        if text and not text.startswith("<") and text not in seen:
            seen.add(text)
            out.append(text)
    return out


def _text_block(context: dict, extra_hints: str | None, include_prose: bool) -> str:
    """`extra_hints` (người dùng gõ) luôn gửi; `context["text"]` chỉ khi được bật."""
    chunks = []
    if include_prose:
        text = context.get("text")
        if isinstance(text, str) and text.strip() and not text.strip().startswith("<"):
            chunks.append(text.strip())
    if extra_hints and extra_hints.strip():
        chunks.append(extra_hints.strip())
    return " ".join(chunks)


def _join(language: str, general: str, terms: list[str], text: str) -> str:
    parts = [p for p in (language, general) if p]
    if terms:
        parts.append("Thuật ngữ: " + ", ".join(terms) + ".")
    if text:
        parts.append(text)
    return " ".join(parts)


def build_hints(
    context_json: dict | None = None,
    language: str | None = None,
    extra_hints: str | None = None,
    *,
    max_chars: int = MAX_HINTS_CHARS,
    include_prose: bool = False,
) -> str:
    """Trả chuỗi `hints` dài tối đa `max_chars`, cắt theo thứ tự ưu tiên ở docstring.

    `include_prose=False` (mặc định) bỏ `context["text"]` — xem docstring module.
    """
    context = _unwrap(context_json)
    language_part = _language_sentence(language)
    general_part = _general_sentence(context)
    terms = _term_list(context)
    text_part = _text_block(context, extra_hints, include_prose)

    result = _join(language_part, general_part, terms, text_part)
    if len(result) <= max_chars:
        return result

    # 1. text rụng trước.
    result = _join(language_part, general_part, terms, "")
    if len(result) <= max_chars:
        return result

    # 2. terms cắt dần từ cuối danh sách.
    while terms:
        terms = terms[:-1]
        result = _join(language_part, general_part, terms, "")
        if len(result) <= max_chars:
            return result

    # 3. general rụng.
    result = _join(language_part, "", [], "")
    # Câu ngôn ngữ giữ tới cùng; chỉ khi chính nó vượt trần mới cắt cứng.
    return result if len(result) <= max_chars else result[:max_chars]
