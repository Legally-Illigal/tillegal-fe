# Hợp Đồng API: Hội Thoại & Hỏi Đáp Pháp Luật (Chat Endpoints)

## 1. Cấu Trúc Dữ Liệu Cốt Lõi (Core Data Types)
```ts
export interface CitationItem {
  id: string
  lawName: string          // Ví dụ: "Bộ luật Dân sự 2015"
  articleNumber: string    // Ví dụ: "Điều 357"
  clauseNumber?: string    // Ví dụ: "Khoản 1"
  excerptText: string      // Trích đoạn nội dung điều luật
  status: 'active' | 'amended' | 'expired' // Hiệu lực pháp lý
  sourceUrl?: string       // Link tra cứu chính thức (Thư Viện Pháp Luật, Cổng TTĐT)
}

export interface ChatMessage {
  id: string
  conversationId: string
  sender: 'user' | 'assistant'
  content: string          // Hỗ trợ Markdown text
  citations?: CitationItem[]
  verificationStatus?: 'verified' | 'inconclusive' | 'warning'
  createdAt: string
}
```

## 2. Danh Sách Endpoint

### A. Lấy Danh Sách Hội Thoại (`GET /conversations`)
- **Query:** `?page=1&limit=20`
- **Response Data:** Mảng các object tóm tắt phiên chat: `{ id, title, lastMessageAt, messageCount }`.

### B. Tạo Hội Thoại Mới (`POST /conversations`)
- **Request Body:** `{ "initialTitle": "Tư vấn tranh chấp đặt cọc" }` (tùy chọn).
- **Response Data (201 Created):** Trả về phiên chat mới rỗng: `{ id, title, createdAt }`.

### C. Lấy Chi Tiết Tin Nhắn Trong Phiên (`GET /conversations/:id/messages`)
- **Response Data:** Mảng các đối tượng `ChatMessage`.

### D. Gửi Câu Hỏi Pháp Luật (`POST /conversations/:id/messages`)
- **Request Body:**
  ```json
  {
    "content": "Bên bán không chịu bàn giao nhà đúng hẹn thì tôi được phạt cọc bao nhiêu?",
    "stream": true
  }
  ```
- **Xử lý Response:**
  - **Chế độ REST thông thường:** Trả về đối tượng `ChatMessage` hoàn chỉnh (gồm content, citations, verificationStatus).
  - **Chế độ Streaming (SSE - Server-Sent Events):** Backend gửi stream các chunk dữ liệu:
    - `event: step` — Trạng thái agent (`"Đang phân tích câu hỏi"`, `"Đang tìm kiếm căn cứ"`).
    - `event: delta` — Token chữ trả lời tiếp theo.
    - `event: citations` — Danh sách căn cứ pháp lý được đính kèm.
    - `event: done` — Hoàn tất tin nhắn.
