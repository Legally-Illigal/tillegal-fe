# Nguyên Tắc Thiết Kế UI/UX Cho Legal AI

## 1. Định Hướng Theo Hai Nhóm Người Dùng (Personas)
- **Người dân (Citizen):**
  - Giao diện tối giản, tập trung vào khung hỏi đáp dạng chat quen thuộc.
  - Câu trả lời trực diện, ngôn ngữ giải thích dễ hiểu, tránh thuật ngữ pháp lý nặng nề.
  - Đi kèm disclaimer rõ ràng và gợi ý các câu hỏi làm rõ tình huống.
- **Luật sư (Lawyer):**
  - Giao diện chuyên nghiệp, hỗ trợ làm việc với các hồ sơ/tình huống nhiều dữ kiện.
  - Cung cấp bảng điều khiển chi tiết về điều khoản, văn bản viện dẫn và tình trạng hiệu lực.
  - Hỗ trợ lưu trữ lịch sử theo vụ việc/chủ đề và đối chiếu căn cứ độc lập.

## 2. Các Thành Phần UI Đặc Thù Của Tillegal
1. **Disclaimer Bắt Buộc (Khước Từ Trách Nhiệm):**
   - Luôn hiển thị ở chân trang hoặc đầu phiên: *"Câu trả lời của AI chỉ mang tính chất tham khảo, không thay thế ý kiến tư vấn pháp lý chuyên nghiệp."*
2. **Khối Trích Dẫn Căn Cứ (Citation Block):**
   - Hiển thị trực tiếp bên dưới câu trả lời hoặc dạng footnote liên kết số [1], [2].
   - Bấm vào mở Drawer/Popover hiển thị: Tên văn bản, Số hiệu, Điều/Khoản, Cơ quan ban hành, Trạng thái hiệu lực.
3. **Huy Hiệu Kiểm Chứng Pháp Lý (Verification Badges):**
   - `Đã kiểm chứng (Verified)`: Căn cứ chính xác, còn hiệu lực và hỗ trợ nhận định.
   - `Chưa đủ căn cứ (Inconclusive)`: Dữ liệu chưa đủ khẳng định, cần thêm thông tin.
   - `Cảnh báo hiệu lực (Outdated/Refuted)`: Văn bản đã hết hiệu lực hoặc bị sửa đổi/thay thế.

## 3. Trải Nghiệm Hội Thoại (Conversational UX)
- **Multi-turn Context:** Duy trì lịch sử trao đổi qua từng phiên để người dùng tiếp tục làm rõ tình huống.
- **Streaming Response:** Hiển thị phản hồi từng phần kèm trạng thái tiến trình (Đang truy cứu văn bản -> Đang kiểm chứng...).
- **Xử lý sự cố rõ ràng:** Khi hệ thống không tìm thấy căn cứ hoặc quá tải, thông báo trung thực giới hạn thay vì bịa câu trả lời.
