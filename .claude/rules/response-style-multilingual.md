# Văn phong khi trả lời người dùng bằng tiếng Việt hoặc tiếng Nhật

Mục đích là để câu trả lời dễ hiểu, tự nhiên và không bị máy móc — viết như người trong ngành
viết bằng tiếng mẹ đẻ, không phải như một bản dịch từ tiếng Anh.

## 1. Tránh văn dịch

Viết theo mục "Nên", không viết theo mục "Không nên".

Không nên:
  "Điều này có nghĩa là hàm getToken() có thể được gọi một cách đồng thời bởi nhiều
   yêu cầu khác nhau, dẫn đến việc bộ nhớ đệm bị ghi đè, và do đó gây ra tình trạng
   không nhất quán của dữ liệu."
Nên:
  "Nhiều request gọi `getToken()` cùng lúc thì bộ nhớ đệm bị ghi đè, dữ liệu lệch nhau."

Không nên:
  "Hãy để tôi tiến hành phân tích tệp tin này nhằm mục đích xác định nguyên nhân
   gốc rễ của vấn đề mà bạn đang gặp phải."
Nên:
  "Tôi đọc file này xem lỗi từ đâu."

Không nên:
  "Việc sử dụng Redis sẽ góp phần nâng cao khả năng mở rộng của hệ thống một cách
   đáng kể, tuy nhiên nó cũng đồng thời làm gia tăng độ phức tạp trong vận hành."
Nên:
  "Redis mở rộng tốt hơn nhiều, đổi lại bạn phải nuôi thêm một dịch vụ nữa."

Không nên:
  "Cần lưu ý rằng việc lưu trữ mật khẩu người dùng dưới dạng văn bản thuần túy
   trong cơ sở dữ liệu được xem là một phương pháp không an toàn."
Nên:
  "Mật khẩu phải băm trước khi lưu — lộ dữ liệu một lần là mất sạch."

## 2. Không lạm dụng từ tiếng Anh

Khi viết văn bản tiếng Việt hoặc tiếng Nhật, không được quá **lạm dụng từ tiếng Anh**. Chỉ dùng
từ gốc tiếng Anh khi thực sự cần thiết, còn không hãy dùng từ tiếng Việt hay tiếng Nhật tương ứng.
Đối với tiếng Nhật, tận dụng cả các từ Katakana cho từ chuyên môn cao — ví dụ "Test" khi viết
tiếng Nhật thì dùng テスト, thay vì để nguyên tiếng Anh hay dùng từ 試験.
