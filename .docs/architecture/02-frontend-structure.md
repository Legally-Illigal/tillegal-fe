# Cấu Trúc Thư Mục Frontend

## 1. Sơ Đồ Tổ Chức Mã Nguồn (`src/`)
Frontend được tổ chức theo mô hình module hóa và hướng tính năng (Feature-based structure):

```
src/
├── app/               # Cấu hình gốc: Router, Providers, App Shell
│   ├── providers.tsx  # Theme, Tooltip, I18n Providers
│   └── router.tsx     # Định tuyến ứng dụng (react-router-dom v7)
├── components/        # Thành phần dùng chung toàn ứng dụng
│   ├── ui/            # UI Primitives dựa trên Radix UI & shadcn (button, input, dialog...)
│   └── layout/        # Layout dùng chung (Navbar, Sidebar, MainLayout)
├── config/            # Cấu hình môi trường runtime (env.ts)
├── features/          # Các module nghiệp vụ cốt lõi (Domain modules)
│   ├── auth/          # Đăng nhập, đăng ký, bảo vệ route theo role
│   ├── chat/          # Khung hội thoại, tin nhắn, streaming, disclaimer
│   ├── citation/      # Trích dẫn nguồn, badge kiểm chứng, modal xem điều khoản
│   └── history/       # Danh sách và quản lý các phiên chat trước đó
├── hooks/             # Custom hooks dùng chung (useMediaQuery, useDebounce...)
├── lib/               # Thư viện tiện ích và cấu hình client
│   ├── api/           # API Client (Axios/Fetch wrapper), request/response interceptors
│   ├── i18n/          # Cấu hình đa ngôn ngữ (locales en/vi)
│   └── utils.ts       # Hàm hỗ trợ class Tailwind (hàm cn)
└── pages/             # Các trang gắn với Router (HomePage, ChatPage, AdminPage...)
```

## 2. Quy Tắc & Ranh Giới Module
- **Alias Import:** Luôn dùng `@/` để trỏ vào `src/` (ví dụ: `@/components/ui/button`).
- **Feature Encapsulation:**
  - Logic đặc thù của tính năng (components con, hooks con, types, api calls) nằm gọn trong `src/features/<feature-name>/`.
  - Chỉ export các thành phần công khai (public API của feature) qua file `index.ts` trong thư mục feature đó.
- **Tái sử dụng UI:** Các components cơ bản thuộc `components/ui/` không được chứa nghiệp vụ domain pháp luật.
- **Biến môi trường:** Không gọi `import.meta.env` trực tiếp ở các component; luôn import từ `@/config/env`.
