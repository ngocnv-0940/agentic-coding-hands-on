"""Dựng SRT từ mảng `segments` của `GET /jobs/{id}/segments`.

Ta tự dựng thay vì gọi `download/srt` vì chỉ đường `segments` mới mang `speaker`.

`speaker` LUÔN có giá trị — diarization bật cứng phía server; khi không xác định
được thì là chuỗi "unknown", không phải null. Nên ở đây không cần nhánh None,
chỉ cần nhánh "unknown".

Hàm thuần, không I/O.
"""

from __future__ import annotations

from typing import Any, Iterable

__all__ = ["format_timestamp", "segments_to_srt", "UNKNOWN_SPEAKER"]

UNKNOWN_SPEAKER = "unknown"

# Cue có độ dài <= 0 làm player bỏ qua dòng đó. Thà kéo dài tối thiểu còn hơn mất.
_MIN_CUE_MS = 500


def format_timestamp(ms: int) -> str:
    """Mili-giây → "HH:MM:SS,mmm". Giá trị âm coi như 0."""
    ms = max(0, int(ms))
    hours, rest = divmod(ms, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    seconds, millis = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"


def _as_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _speaker_of(segment: dict) -> str:
    speaker = segment.get("speaker")
    text = str(speaker).strip() if speaker is not None else ""
    return text or UNKNOWN_SPEAKER


def segments_to_srt(segments: Iterable[dict], speaker_labels: bool = True) -> str:
    """Mảng segment → chuỗi SRT.

    Nhãn người nói chỉ chèn khi speaker ĐỔI so với cue trước và khác "unknown" —
    dán nhãn mọi dòng làm phụ đề rất khó đọc.
    """
    items = [s for s in (segments or []) if isinstance(s, dict)]
    if not items:
        return ""

    items.sort(key=lambda s: _as_int(s.get("startMs")))

    blocks = []
    previous_speaker = None
    for index, segment in enumerate(items, start=1):
        start_ms = _as_int(segment.get("startMs"))
        end_ms = _as_int(segment.get("endMs"))
        if end_ms <= start_ms:
            end_ms = start_ms + _MIN_CUE_MS

        text = str(segment.get("text") or "").strip()
        speaker = _speaker_of(segment)
        if speaker_labels and speaker != UNKNOWN_SPEAKER and speaker != previous_speaker:
            text = f"[{speaker}] {text}" if text else f"[{speaker}]"
        previous_speaker = speaker

        blocks.append(
            f"{index}\n{format_timestamp(start_ms)} --> {format_timestamp(end_ms)}\n{text}\n"
        )

    return "\n".join(blocks)
