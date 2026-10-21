# Hướng Dẫn Phát Triển & Quy Ước Mã Nguồn

## 1. Quy Ước TypeScript & React
- **Functional Components:** 100% sử dụng Function Components và React Hooks.
- **Strict Typing:** Tuyệt đối không dùng kiểu `any`. Định nghĩa interface/type rõ ràng cho Props, API Request/Response.
- **Component File Structure:**
  - 1 component chính / 1 file.
  - Tên file Component: `PascalCase.tsx` (ví dụ: `ChatWindow.tsx`, `CitationCard.tsx`).
  - Tên file Hooks / Utilities: `kebab-case.ts` (ví dụ: `use-chat-session.ts`, `format-date.ts`).
- **Props Typing:** Đặt tên rõ ràng `interface ComponentNameProps { ... }`.

## 2. Quy Chuẩn Styling Với Tailwind CSS v4
- Sử dụng hàm tiện ích `cn(...)` từ `@/lib/utils` để ghép class có điều kiện (kết hợp `clsx` và `tailwind-merge`).
- Không viết CSS inline trực tiếp vào thuộc tính `style={...}` trừ trường hợp tính toán tọa độ động.
- Sử dụng biến màu sắc theme có sẵn (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`) để tự động hỗ trợ Dark/Light mode.

## 3. Quy Chuẩn Đa Ngôn Ngữ (i18n)
- Không hardcode chuỗi text hiển thị cố định trong JSX.
- Sử dụng hook `useTranslation()` từ `react-i18next`:
  ```tsx
  const { t } = useTranslation()
  return <button>{t('chat.send')}</button>
  ```
- Khai báo key tương ứng vào cả 2 file: `src/lib/i18n/locales/vi.json` và `en.json`.

## 4. Xử Lý Bất Đồng Bộ & Gọi API
- Mọi logic gọi API được tập trung trong `src/lib/api/` hoặc thư mục `api/` thuộc từng feature.
- Bắt buộc xử lý đầy đủ 3 trạng thái: `isLoading`, `isError` (kèm thông báo thân thiện) và `data` thành công.
- Thông báo lỗi/thành công qua component Toast (`sonner`): `toast.success(...)` hoặc `toast.error(...)`.
