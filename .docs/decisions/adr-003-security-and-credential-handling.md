# ADR-003: Xử Lý Bảo Mật Và Thông Tin Xác Thực Phía Client

## Trạng Thái
Accepted (Tuân thủ nguyên tắc CC-01 & CC-02 trong Document 7)

## Bối Cảnh
Frontend chạy hoàn toàn trên trình duyệt của người dùng cuối. Bất kỳ thông tin nào gửi xuống client (mã nguồn, biến môi trường, bundle JavaScript) đều có thể bị dịch ngược và kiểm tra. Dự án sử dụng các dịch vụ LLM bên ngoài và cơ sở dữ liệu pháp lý có kiểm soát.

## Quyết Định
1. **Không chứa Secret của LLM / AI Service:**
   - Tuyệt đối không nhúng OpenAI/Claude/Google API keys hoặc token nội bộ vào mã nguồn hay file `.env` của Frontend.
   - Mọi request của người dùng đều phải qua Backend (.NET Web API).
2. **Xác thực và Phân quyền tập trung tại Backend:**
   - Backend chịu trách nhiệm xác thực người dùng và áp dụng kiểm soát quyền (RBAC).
   - Frontend chỉ lưu trữ token phiên (JWT hoặc Session Cookie) do Backend cấp sau khi đăng nhập thành công.
   - Frontend ẩn/hiện menu theo Role chỉ nhằm phục vụ UX; Backend là nơi từ chối request không hợp lệ.
3. **Bảo vệ dữ liệu người dùng (Privacy):**
   - Không ghi log nội dung câu hỏi/tình huống pháp lý nhạy cảm của người dùng ra `console.log` trong môi trường Production.
   - Tự động xóa token và chuyển hướng về trang đăng nhập khi nhận lỗi HTTP 401 Unauthorized.

## Hệ Quả
- Đảm bảo an toàn 100% cho các API key trả phí của dự án.
- Frontend không bị ràng buộc vào các thay đổi nhà cung cấp AI ở tầng backend.
- Cần xây dựng Axios/Fetch Interceptor để tự động đính kèm Bearer token và xử lý refresh token.
