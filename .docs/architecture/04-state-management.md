# Quản Lý Trạng Thái (State Management)

## 1. Phân Loại Trạng Thái Trong Frontend

Hệ thống phân định rõ 3 tầng trạng thái nhằm tránh xung đột và đơn giản hóa luồng dữ liệu:

### A. Server State (Dữ liệu từ Backend)
- **Bao gồm:** Danh sách phiên chat, nội dung tin nhắn, metadata trích dẫn, thông tin tài khoản người dùng (`User Profile`).
- **Giải pháp chính thức:** Sử dụng **`@tanstack/react-query`**.
  - Tự động quản lý vòng đời dữ liệu bất đồng bộ: `isLoading`, `isError`, `isSuccess`.
  - Caching dữ liệu phiên hội thoại, query invalidation khi tạo phiên hoặc gửi tin nhắn mới.
  - Cấu hình chuẩn trong `src/app/providers.tsx`: `staleTime: 5 phút`, `retry: 1`, `refetchOnWindowFocus: false`.

### B. Client / UI State (Trạng thái giao diện cục bộ)
- **Bao gồm:** Trạng thái mở/đóng Sidebar, Modal xem trích dẫn pháp lý, Drawer chi tiết điều khoản, input form chat.
- **Giải pháp:** Sử dụng React `useState`, `useReducer`, hoặc React Context API cục bộ theo từng feature.

### C. Persistent Global State (Cấu hình người dùng & Thiết bị)
- **Theme (Giao diện Sáng/Tối):** Quản lý qua `next-themes` (lưu tại `localStorage`, đồng bộ `class="dark"` trên thẻ `<html>`).
- **Ngôn ngữ (i18n):** Quản lý qua `react-i18next` (lưu mã ngôn ngữ `vi`/`en` tại `localStorage`).
- **Phiên đăng nhập (Auth Session):** Lưu Bearer access token và thông tin người dùng trong `AuthContext`, tự động chuyển hướng khi chưa xác thực.

## 2. Nguyên Tắc Quản Lý Trạng Thái
- **Không nhồi nhét Server State vào React Context:** Mọi request dữ liệu từ BE phải đi qua React Query hooks (`useQuery`, `useMutation`).
- **Optimistic Updates:** Với tin nhắn người dùng gửi, cập nhật ngay lập tức lên UI trước khi nhận phản hồi từ server.
- **Xử lý Stream (SSE):** Dữ liệu stream từ chat không ghi đè cache ngay mà append dần vào local state của khung chat trước khi sync lại cache.
