# Trạng Thái Triển Khai & Lộ Trình Phát Triển (Status & Roadmap)

## 1. Trạng Thái Hiện Tại Của Mã Nguồn

- **Hạ tầng cơ sở (Đã hoàn thiện):**
  - Setup React 19 + Vite 8 + TypeScript 6 thành công.
  - Cấu hình Tailwind CSS v4, Biến Theme CSS và Font Geist.
  - Cài đặt đầy đủ bộ UI Primitives của shadcn/ui trong `src/components/ui/` (~35 components: button, dialog, drawer, card, sonner, v.v.).
  - Cấu hình App Providers (`ThemeProvider`, `TooltipProvider`, `I18nextProvider`, `AuthProvider`).
  - Cấu hình i18n chuẩn tiếng Việt trong `src/lib/i18n/`.
  - Xây dựng `MainLayout` (Header, Footer với Disclaimer bắt buộc, ThemeToggle, UserProfile Menu).
  - Hoàn thiện `HomePage` giới thiệu Tillegal, `LoginPage`, và `NotFoundPage`.
  - Cấu hình API Client (`src/lib/api/`): chuẩn envelope, bearer token, interceptor refresh token 401 tự động.
  - Hoàn thiện module xác thực & phân quyền `src/features/auth/` (`AuthProvider`, `useAuth`, `ProtectedRoute`, `LoginForm`, `RegisterForm` phân biệt Người dân & Luật sư).
- **Phần khung còn lại (Cần triển khai tiếp theo):**
  - `src/components/layout/chat-layout.tsx` và `sidebar.tsx`.
  - `src/features/`: Các thư mục chức năng domain (`chat`, `citation`, `history`).

## 2. Lộ Trình Triển Khai Cho MVP (Task Backlog)

### Giai Đoạn 1: Khung Giao Diện & Bố Cục (Layout & Navigation)

- [x] Xây dựng `MainLayout` với Header (Logo Tillegal, Chuyển Theme, User Profile dropdown) và Footer (Disclaimer).
- [x] Xây dựng trang `HomePage` và `NotFoundPage`.
- [x] Thiết lập Router cơ bản trong `src/app/router.tsx` kèm `/login` và `/chat`.
- [x] Xây dựng `ChatSidebar` thu gọn (danh sách phiên hội thoại, nút "Tạo hội thoại mới", hỗ trợ responsive drawer trên Mobile).
- [x] Thiết lập trang `ChatPage` kết nối URL query `?q=...` từ HomePage.

### Giai Đoạn 2: Tính Năng Hỏi Đáp Pháp Luật (Feature: Legal Q&A)

- [x] Giao diện danh sách tin nhắn (`MessageList`) hỗ trợ Markdown pháp lý, phân biệt User và Assistant.
- [x] Thanh nhập liệu (`ChatInput`) hỗ trợ gửi bằng Enter, tự động dãn dòng, chip gợi ý tình huống.
- [x] Thanh thông báo Disclaimer pháp lý cố định ở chân trang chat (`LegalDisclaimer`).
- [x] Hiển thị trạng thái xử lý AI (Loading indicator, tra cứu cơ sở dữ liệu luật).
- [x] Hook điều phối dữ liệu `useChat` và API service `chatApi` kết nối `/conversations`.

### Giai Đoạn 3: Hiển Thị Trích Dẫn & Tra Cứu Căn Cứ (Feature: Citation)

- [x] Xây dựng `CitationCard` và `CitationBadge` `[^1]` gắn liền với câu trả lời và nhúng trong văn bản.
- [x] Xây dựng `CitationDrawer` trượt từ cạnh phải để xem toàn văn trích đoạn điều khoản, sao chép căn cứ và tra cứu link văn bản gốc.
- [x] Tích hợp tự động ánh xạ giữa chú dẫn số trong nội dung trả lời của AI và danh sách trích dẫn `citations`.

### Giai Đoạn 4: Kiểm Chứng & Xác Thực Người Dùng (Feature: Verification & Auth)

- [x] Tích hợp kiểm chứng căn cứ trực tiếp trong phần hỏi đáp (`CitationBadge`, `CitationCard`, `CitationDrawer`, trích đoạn điều khoản gốc và tình trạng hiệu lực; điều hướng `/verify` về `/chat`).
- [x] Giao diện đăng nhập, phân quyền hiển thị giữa Người dân và Luật sư (`LoginForm`, `RegisterForm`, `ProtectedRoute`).
