# Kiến Trúc Tổng Thể Hệ Thống (Frontend Context)

## 1. Mục Tiêu Dự Án Tillegal
Tillegal là trợ lý AI chuyên sâu về pháp luật Việt Nam, phục vụ 2 nhóm người dùng chính:
- **Người dân:** Giải thích pháp luật dễ hiểu, hỗ trợ phân tích tình huống đời thường.
- **Luật sư:** Tra cứu chuyên sâu, đối chiếu căn cứ pháp lý, phân tích nhiều lượt trao đổi.

## 2. Vị Trí Của Frontend Trong Hệ Thống
Hệ thống Tillegal chia làm 4 thành phần triển khai độc lập (theo ADR-001):
1. **Frontend Web (Repo này):** SPA xây dựng bằng React 19, Vite, TypeScript.
2. **Backend Web Service:** .NET Clean Architecture, quản trị API, Auth, Conversation & RBAC.
3. **Python AI Service:** Multi-Agent RAG (Query, Search, Judge, Summary, Verify).
4. **Legal Data Pipeline:** Thu thập, chuẩn hóa và đánh chỉ mục dữ liệu pháp luật.

```
[ Trình Duyệt / Người Dùng ]
             │ (HTTPS)
             ▼
   [ Frontend Web (React) ]
             │ (REST / SSE)
             ▼
   [ Backend Web (.NET) ] ──(Nội bộ)──► [ Python AI Service ]
             │                                   │
             ▼                                   ▼
      [ PostgreSQL DB ]                [ Legal Knowledge Base ]
```

## 3. Ranh Giới Trách Nhiệm Của Frontend
- **Được làm:**
  - Cung cấp giao diện tương tác hội thoại, lịch sử chat, kiểm chứng trích dẫn.
  - Hiển thị phản hồi stream (SSE) theo thời gian thực kèm các bước xử lý của Agent.
  - Hiển thị Markdown, cấu trúc câu trả lời, badge trạng thái kiểm chứng.
  - Hiển thị cảnh báo trách nhiệm (Disclaimer) bắt buộc.
  - Bảo vệ các tuyến đường (Protected Routes): **Bắt buộc đăng nhập**, không hỗ trợ khách vãng lai.
- **Tuyệt đối KHÔNG làm:**
  - Không gọi trực tiếp Python AI Service hoặc LLM Providers bên ngoài.
  - Không lưu trữ Secret Keys / API Keys của các dịch vụ AI.
  - Không tự quyết định quyền truy cập hoặc tự thẩm định tính hợp lệ của căn cứ pháp lý.
