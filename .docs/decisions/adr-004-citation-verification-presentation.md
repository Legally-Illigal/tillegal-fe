# ADR-004: Cơ Chế Hiển Thị Căn Cứ & Báo Cáo Kiểm Chứng Pháp Lý

## Trạng Thái
Accepted (Tuân thủ ADR-007 trong Document 7)

## Bối Cảnh
Một trong những khác biệt cốt lõi của Tillegal là khả năng kiểm chứng trích dẫn pháp lý (Legal Citation Verification). Câu trả lời pháp lý không chỉ là văn bản hội thoại thông thường mà phải cung cấp căn cứ có thể kiểm tra, đồng thời nêu rõ mức độ tin cậy và tình trạng hiệu lực.

## Quyết Định
Frontend cấu trúc giao diện phản hồi thành 3 phần hiển thị riêng biệt:
1. **Khối Nội Dung Giải Thích (Answer Body):**
   - Render bằng Markdown chuẩn, hỗ trợ in đậm, gạch đầu dòng, bảng biểu.
   - Các điểm khẳng định (claims) quan trọng có gắn chỉ số chú thích liên kết (ví dụ `[1]`, `[2]`).
2. **Khối Danh Sách Căn Cứ Viện Dẫn (Citations List):**
   - Đặt ngay dưới câu trả lời hoặc trong tab riêng.
   - Mỗi item bao gồm: Tên văn bản (Luật, Nghị định, Thông tư), Số hiệu, Điều/Khoản trích, Cơ quan ban hành, Trạng thái hiệu lực (Còn hiệu lực / Hết hiệu lực / Đã sửa đổi).
   - Nhấp vào căn cứ sẽ mở Drawer/Modal xem trích đoạn văn bản gốc.
3. **Thanh Trạng Thái Kiểm Chứng (Verification Badge & Alert):**
   - Hiển thị kết luận từ Verify Agent của Backend: `Đạt kiểm chứng`, `Cần bổ sung dữ kiện` hoặc `Cảnh báo sai căn cứ`.
   - Nếu phát hiện căn cứ hết hiệu lực hoặc không hỗ trợ nhận định, hiển thị thẻ cảnh báo màu vàng/đỏ nổi bật để người dùng lưu ý.

## Hệ Quả
- Người dùng (đặc biệt là luật sư) có thể kiểm tra chéo ngay lập tức mà không phải tự tìm văn bản thủ công.
- Tăng tính minh bạch và độ tin cậy của trợ lý AI.
- Cần xây dựng các UI component chuyên dụng: `CitationBadge`, `CitationDrawer`, `VerificationAlert`.
