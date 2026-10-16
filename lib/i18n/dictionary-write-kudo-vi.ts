/**
 * Viết Kudo modal (F007) strings, Vietnamese. Figma copy is verbatim (MoMorph ihQ26W78P2 and its sub-frames); the
 * link dialog title, aria labels, "Tối đa 5 ảnh", "Nội dung tối đa 2000 ký tự", clear-recipient label and every
 * error toast are new (not in Figma) and wait for user confirmation. Hint values may hold "\n" line breaks.
 * Send error keys end with a `CreateKudoErrorCode` (`writeKudo.error.${code}`).
 */
export const writeKudoVi = {
  'writeKudo.title': 'Gửi lời cám ơn và ghi nhận đến đồng đội',
  'writeKudo.required': 'Không được để trống',

  'writeKudo.recipient.label': 'Người nhận',
  'writeKudo.recipient.placeholder': 'Tìm kiếm',
  'writeKudo.recipient.empty': 'Không tìm thấy kết quả',
  'writeKudo.recipient.loading': 'Đang tìm...',
  'writeKudo.recipient.clear': 'Chọn lại người nhận',

  'writeKudo.titleField.label': 'Danh hiệu',
  'writeKudo.titleField.placeholder': 'Dành tặng một danh hiệu cho đồng đội',
  'writeKudo.titleField.hint': 'Ví dụ: Người truyền động lực cho tôi.\nDanh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn.',

  'writeKudo.editor.placeholder': 'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!',
  'writeKudo.editor.mentionHint': 'Bạn có thể “@ + tên” để nhắc tới đồng nghiệp khác',
  'writeKudo.editor.tooLong': 'Nội dung tối đa 2000 ký tự',
  'writeKudo.editor.standards': 'Tiêu chuẩn cộng đồng',
  'writeKudo.tool.bold': 'In đậm',
  'writeKudo.tool.italic': 'In nghiêng',
  'writeKudo.tool.strike': 'Gạch ngang',
  'writeKudo.tool.orderedList': 'Danh sách đánh số',
  'writeKudo.tool.link': 'Chèn liên kết',
  'writeKudo.tool.quote': 'Trích dẫn',

  'writeKudo.link.title': 'Thêm liên kết',
  'writeKudo.link.text': 'Text',
  'writeKudo.link.url': 'Link',
  'writeKudo.link.cancel': 'Hủy',
  'writeKudo.link.save': 'Lưu',
  'writeKudo.link.textRequired': 'Không được để trống',
  'writeKudo.link.textTooLong': 'Text tối đa 100 ký tự',
  'writeKudo.link.urlRequired': 'Không được để trống',
  'writeKudo.link.urlInvalid': 'Liên kết phải bắt đầu bằng http:// hoặc https://',
  'writeKudo.link.urlTooLong': 'Liên kết tối đa 2048 ký tự',

  'writeKudo.hashtag.label': 'Hashtag',
  'writeKudo.hashtag.add': 'Hashtag',
  'writeKudo.hashtag.hint': 'Tối đa 5',
  'writeKudo.hashtag.limit': 'Tối đa 5 hashtag',
  'writeKudo.hashtag.remove': 'Bỏ hashtag',

  'writeKudo.image.label': 'Image',
  'writeKudo.image.add': 'Image',
  'writeKudo.image.hint': 'Tối đa 5',
  'writeKudo.image.remove': 'Xóa ảnh',
  'writeKudo.image.thumbAlt': 'Ảnh đính kèm',
  'writeKudo.image.invalidType': 'Định dạng file không hợp lệ',
  'writeKudo.image.tooLarge': 'Ảnh vượt quá 5 MB',
  'writeKudo.image.tooMany': 'Tối đa 5 ảnh',

  'writeKudo.anonymous.checkbox': 'Gửi lời cám ơn và ghi nhận ẩn danh',
  'writeKudo.anonymous.name': 'Tên ẩn danh',
  'writeKudo.anonymous.default': 'Người gửi ẩn danh',

  'writeKudo.footer.cancel': 'Hủy',
  'writeKudo.footer.submit': 'Gửi',

  'writeKudo.toast.success': 'Đã gửi Kudos thành công!',
  'writeKudo.error.upload': 'Không tải được ảnh lên. Vui lòng thử lại.',
  'writeKudo.error.unauthenticated': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'writeKudo.error.sunner_not_found': 'Tài khoản của bạn chưa có hồ sơ Sunner nên chưa thể gửi Kudos.',
  'writeKudo.error.receiver_not_found': 'Người nhận không còn tồn tại. Vui lòng chọn người khác.',
  'writeKudo.error.self_kudo': 'Bạn không thể gửi Kudos cho chính mình.',
  'writeKudo.error.title_invalid': 'Danh hiệu chưa hợp lệ. Vui lòng kiểm tra lại.',
  'writeKudo.error.content_invalid': 'Nội dung chưa hợp lệ. Vui lòng kiểm tra lại.',
  'writeKudo.error.content_doc_invalid': 'Nội dung chưa hợp lệ. Vui lòng kiểm tra lại.',
  'writeKudo.error.hashtags_invalid': 'Hashtag chưa hợp lệ. Vui lòng chọn lại.',
  'writeKudo.error.images_invalid': 'Không đính kèm được ảnh. Vui lòng chọn lại ảnh và thử lại.',
  'writeKudo.error.anonymous_name_invalid': 'Tên ẩn danh chưa hợp lệ. Vui lòng kiểm tra lại.',
  'writeKudo.error.invalid_input': 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường.',
  'writeKudo.error.unknown': 'Không gửi được Kudos. Vui lòng thử lại.',
} as const
