# Quy Chuẩn Kiểm Thử & Đảm Bảo Chất Lượng (Testing & QA)

## 1. Bộ Công Cụ Đảm Bảo Chất Lượng
Dự án được cấu hình sẵn các công cụ kiểm tra tự động tiên tiến:
- **Test Runner:** `Vitest` (tương thích cực cao với Vite, chạy nhanh).
- **DOM Testing:** `@testing-library/react` và `@testing-library/jest-dom`.
- **Linter:** `oxlint` (Rust-based linter, tốc độ siêu tốc).
- **Formatter:** `prettier` kết hợp `prettier-plugin-tailwindcss`.
- **Type Checker:** `tsc -b` (TypeScript Compiler).

## 2. Các Lệnh Kiểm Tra Tiêu Chuẩn (Run Commands)
Trước khi bàn giao bất kỳ tính năng hoặc sửa lỗi nào, Agent phải thực thi các lệnh sau:
- Chạy toàn bộ test: `npm test`
- Chạy test có báo cáo độ phủ: `npm run test:coverage`
- Kiểm tra kiểu dữ liệu: `npm run typecheck`
- Kiểm tra lint: `npm run lint`
- Kiểm tra format: `npm run format:check`
- **Lệnh tổng hợp (bắt buộc pass trước khi commit):**
  ```bash
  npm run check
  ```
  *(Lệnh này tự động chạy: format check -> lint -> typecheck -> test -> build)*

## 3. Quy Tắc Viết Unit Test & Component Test
- **Vị trí file test:** Đặt ngay cạnh component tương ứng với đuôi `.test.tsx` (ví dụ: `button.test.tsx`, `ChatMessage.test.tsx`).
- **File setup chung:** `src/test/setup.ts` đã cấu hình sẵn `@testing-library/jest-dom`.
- **Mục tiêu test:**
  - Kiểm tra render đúng cấu trúc giao diện theo props.
  - Kiểm tra các tương tác người dùng chính (click nút, nhập text, submit form).
  - Kiểm tra các trạng thái biên: loading spinner, thông báo lỗi mạng, danh sách rỗng.
  - Kiểm tra điều kiện render của huy hiệu kiểm chứng (Verified / Inconclusive / Refuted).

## 4. Nguyên Tắc Trung Thực Khi Kiểm Thử (Từ AGENTS.md)
- Tuyệt đối không bịa đặt hoặc tự suy đoán kết quả test.
- Chỉ báo một bước kiểm thử thành công khi đã thực sự chạy lệnh và lệnh thoát với mã code 0.
- Nếu không thể chạy test do thiếu môi trường, phải báo rõ nguyên nhân và rủi ro chưa kiểm chứng.
