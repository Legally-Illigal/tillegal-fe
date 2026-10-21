# Trạng Thái Triển Khai & Lộ Trình Phát Triển (Status & Roadmap)

## 1. Trạng Thái Hiện Tại Của Mã Nguồn
- **Hạ tầng cơ sở (Đã hoàn thiện):**
  - Setup React 19 + Vite 8 + TypeScript 6 thành công.
  - Cấu hình Tailwind CSS v4, Biến Theme CSS và Font Geist.
  - Cài đặt đầy đủ bộ UI Primitives của shadcn/ui trong `src/components/ui/` (~35 components: button, dialog, drawer, card, sonner, v.v.).
  - Cấu hình App Providers (`ThemeProvider`, `TooltipProvider`, `I18nextProvider`).
  - Cấu hình bộ khung song ngữ `vi` và `en` trong `src/lib/i18n/`.
- **Phần khung còn trống (Cần triển khai):**
  - `src/app/router.tsx`: Hiện tại chỉ có route rỗng `*`.
  - `src/features/`: Các thư mục chức năng domain đang ở dạng khung chờ viết logic.
  - `src/components/layout/`: Cần xây dựng MainLayout, ChatLayout, Sidebar.

## 2. Lộ Trình Triển Khai Cho MVP (Task Backlog)

### Giai Đoạn 1: Khung Giao Diện & Bố Cục (Layout & Navigation)
- [ ] Xây dựng `MainLayout` với Header (Logo Tillegal, Chuyển Theme, Chọn Ngôn ngữ, Nút Đăng nhập).
- [ ] Xây dựng `ChatLayout` có Sidebar thu gọn (danh sách phiên hội thoại, nút "Tạo hội thoại mới").
- [ ] Thiết lập Router với các trang: `HomePage`, `ChatPage`, `CitationVerifyPage`, `LoginPage`.

### Giai Đoạn 2: Tính Năng Hỏi Đáp Pháp Luật (Feature: Legal Q&A)
- [ ] Giao diện danh sách tin nhắn (`MessageList`) hỗ trợ Markdown, phân biệt User và Assistant.
- [ ] Thanh nhập liệu (`ChatInput`) hỗ trợ gửi bằng Enter, tự động dãn dòng.
- [ ] Thanh thông báo Disclaimer pháp lý cố định ở chân trang chat.
- [ ] Hiển thị trạng thái xử lý AI (Loading spinner, streaming progress step).

### Giai Đoạn 3: Hiển Thị Trích Dẫn & Kiểm Chứng (Feature: Citation & Verification)
- [ ] Xây dựng `CitationCard` và `CitationBadge` gắn liền với câu trả lời.
- [ ] Xây dựng `CitationDrawer` để xem toàn văn trích đoạn điều khoản khi click vào căn cứ.
- [ ] Xây dựng `VerificationStatusAlert` hiển thị cảnh báo khi căn cứ hết hiệu lực hoặc thiếu cơ sở.

### Giai Đoạn 4: Kiểm Chứng Độc Lập & Xác Thực (Feature: Independent Check & Auth)
- [ ] Form kiểm chứng độc lập cho người dùng/luật sư dán trích dẫn cần thẩm định.
- [ ] Giao diện đăng nhập, phân quyền hiển thị giữa Người dân và Luật sư.
