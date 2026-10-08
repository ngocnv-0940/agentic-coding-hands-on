"""Client gọi thẳng Audio Transcribe API (thay cho CLI Soniox cũ).

Gói này chỉ khai báo tên module — import ở đây không chạy gì và không đọc biến
môi trường nào, để `import audio_trans` luôn sạch kể cả khi chưa có API key.
"""

__all__ = ["client", "credentials", "errors", "hints", "media", "polling", "srt", "upload"]
__version__ = "2.0.0"
