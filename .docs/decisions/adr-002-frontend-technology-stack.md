# ADR-002: Lựa Chọn Ngăn Xếp Công Nghệ Frontend (Tech Stack)

## Trạng Thái
Accepted

## Bối Cảnh
Dự án cần một ngăn xếp công nghệ hiện đại, có tốc độ build/dev nhanh, hệ thống UI component dễ tùy biến, hỗ trợ chuẩn accessibility (A11y), responsive tốt và đảm bảo an toàn kiểu dữ liệu (type-safe) để phát triển nhanh bản MVP trong thời hạn mục tiêu.

## Quyết Định
Lựa chọn các công nghệ cốt lõi sau cho Frontend:
1. **Core Framework:** React 19 kết hợp Vite 8 và TypeScript.
2. **Styling:** Tailwind CSS v4 kết hợp `tw-animate-css` và biến CSS theme.
3. **UI Component System:** Bộ UI primitives Radix UI thông qua hệ thống component của shadcn/ui.
4. **Icons:** Lucide React (đồng nhất, hiện đại, nhẹ).
5. **Định tuyến:** React Router v7 (`react-router-dom`).
6. **Đa ngôn ngữ & Theme:** `react-i18next` cho song ngữ (Việt - Anh) và `next-themes` cho Dark/Light mode.
7. **Thông báo & Biểu đồ:** `sonner` cho toast notification và `recharts` cho thống kê/dashboard.
8. **Chất lượng mã:** Oxlint (linter siêu nhanh), Prettier và Vitest + Testing Library.

## Hệ Quả
- **Ưu điểm:**
  - Vite và Oxlint mang lại trải nghiệm phát triển cực nhanh (HMR tính bằng mili-giây).
  - Radix UI cung cấp khả năng tiếp cận (Accessibility) chuẩn WAI-ARIA cho các component phức tạp như Accordion, Dialog, Popover, Dropdown.
  - Tailwind v4 tinh giản cấu hình, dễ dàng điều chỉnh màu sắc và phong cách giao diện pháp luật chuyên nghiệp.
- **Lưu ý:**
  - Giữ bundle gọn gàng, tránh import các thư viện UI cồng kềnh ngoài danh mục đã chọn.
