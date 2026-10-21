# Tillegal Frontend Knowledge Base (.docs)

Tài liệu cô đọng dành cho AI Agent nắm bắt toàn bộ bối cảnh hệ thống Frontend `tillegal-fe` mà không cần mở lại các file tài liệu gốc cồng kềnh.

## Cấu Trúc Tài Liệu

### 1. [architecture/](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/architecture/) — Kiến Trúc Hiện Hành
- [01-system-overview.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/architecture/01-system-overview.md): Mục tiêu dự án, vị trí của Frontend trong toàn hệ thống, ranh giới trách nhiệm.
- [02-frontend-structure.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/architecture/02-frontend-structure.md): Sơ đồ tổ chức mã nguồn `src/`, quy tắc phân chia module theo feature.
- [03-ui-ux-principles.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/architecture/03-ui-ux-principles.md): Nguyên tắc thiết kế cho 2 nhóm người dùng (Người dân & Luật sư), Disclaimer, Citations, Huy hiệu kiểm chứng.
- [04-state-management.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/architecture/04-state-management.md): Chiến lược quản lý Server state, UI state, Theme, I18n và Auth session.

### 2. [decisions/](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/decisions/) — Quyết Định Kỹ Thuật (ADR)
- [adr-001-frontend-separation.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/decisions/adr-001-frontend-separation.md): Quyết định tách Frontend thành SPA độc lập.
- [adr-002-frontend-technology-stack.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/decisions/adr-002-frontend-technology-stack.md): Ngăn xếp React 19, Vite, TypeScript, Tailwind CSS v4, Radix UI (shadcn).
- [adr-003-security-and-credential-handling.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/decisions/adr-003-security-and-credential-handling.md): Ranh giới bảo mật, cấm lưu API Key của AI Service ở Frontend, phân quyền tập trung tại Backend.
- [adr-004-citation-verification-presentation.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/decisions/adr-004-citation-verification-presentation.md): Cơ chế hiển thị câu trả lời tách biệt với Căn cứ pháp lý và Trạng thái kiểm chứng.

### 3. [development/](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/development/) — Hướng Dẫn & Trạng Thái Triển Khai
- [01-guidelines-and-conventions.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/development/01-guidelines-and-conventions.md): Quy ước code TypeScript, Tailwind, i18n, xử lý bất đồng bộ.
- [02-implementation-status.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/development/02-implementation-status.md): Trạng thái hiện tại của codebase và backlog các bước triển khai MVP tiếp theo.
- [03-testing-and-quality.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/development/03-testing-and-quality.md): Quy chuẩn kiểm thử Vitest, Testing Library, oxlint, lệnh `npm run check`.

### 4. [api/](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/api/) — Hợp Đồng API & Tích Hợp
- [01-integration-conventions.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/api/01-integration-conventions.md): Quy ước chung: Base URL, headers, chuẩn Response Envelope, xử lý HTTP error.
- [02-auth-endpoints.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/api/02-auth-endpoints.md): Hợp đồng API xác thực: Login, Register, Me, Refresh, Roles (citizen/lawyer/admin).
- [03-chat-endpoints.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/api/03-chat-endpoints.md): Hợp đồng API hội thoại pháp lý, định dạng tin nhắn, trích dẫn, Server-Sent Events (SSE).
- [04-citation-endpoints.md](file:///c:/Users/Asus/Desktop/Tillegal/tillegal-fe/.docs/api/04-citation-endpoints.md): Hợp đồng API kiểm chứng trích dẫn pháp lý độc lập và tra cứu căn cứ.
