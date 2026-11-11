# Hợp Đồng API: Hội Thoại & Hỏi Đáp Pháp Luật (Conversation Endpoints)

Hợp đồng được đối chiếu trực tiếp từ `Tillegal.Api.Controllers.ConversationsController` và `Tillegal.Api.Contracts.Conversations`.

## 1. Cấu Trúc Dữ Liệu Cốt Lõi (Core Data Types)

```ts
export interface CitationItem {
  id: string // Ví dụ: "cit-001"
  index: number // Số thứ tự chú thích liên kết trong bài [^1]
  documentTitle: string // Tên văn bản (Ví dụ: "Luật Doanh nghiệp 2020")
  documentNumber: string // Số hiệu văn bản (Ví dụ: "59/2020/QH14")
  articleReference: string // Điều/Khoản căn cứ (Ví dụ: "Điều 23, Khoản 1")
  sourceUrl: string // Đường link tra cứu văn bản gốc (Thư Viện Pháp Luật, Cổng TTĐT)
  citedText: string // Toàn văn trích đoạn điều luật liên quan
}

export interface ConversationMessage {
  id: string // Guid
  conversationId: string // Guid
  role: 'user' | 'assistant'
  content: string // Nội dung Markdown, có chứa ký hiệu chú dẫn trích dẫn [^1]
  citations?: CitationItem[] | null // Danh sách các căn cứ điều luật do AI trích dẫn
  createdAt: string // ISO 8601 DateTimeOffset
}

export interface Conversation {
  id: string // Guid
  userId: string // Guid
  title: string // Tiêu đề cuộc hội thoại
  createdAt: string // ISO 8601 DateTimeOffset
  updatedAt?: string | null
}
```

## 2. Danh Sách Endpoint

Tất cả các endpoint dưới đây đều yêu cầu xác thực (`[Authorize]`) qua Cookie hoặc Header `Authorization: Bearer <jwt_token>`.

---

### A. Khởi Tạo Cuộc Hội Thoại Mới (`POST /api/conversations`)

- **Request Body (Tùy chọn):**
  ```json
  {
    "title": "Tư vấn tranh chấp hợp đồng mua bán"
  }
  ```
  _(Nếu không truyền `title`, Backend sẽ tự động gán tiêu đề mặc định)._
- **Response (201 Created):**
  ```json
  {
    "id": "30000000-0000-0000-0000-000000000001",
    "userId": "20000000-0000-0000-0000-000000000001",
    "title": "Tư vấn tranh chấp hợp đồng mua bán",
    "createdAt": "2026-10-26T14:00:00Z",
    "updatedAt": null
  }
  ```

---

### B. Gửi Câu Hỏi & Nhận Phản Hồi AI (`POST /api/conversations/{id}/messages`)

Backend sẽ gửi câu hỏi kèm lịch sử trao đổi đến Python AI Service và lưu đồng thời cả 2 tin nhắn (câu hỏi của người dùng và câu trả lời kèm trích dẫn của trợ lý AI).

- **URL Params:** `id` (Guid của cuộc hội thoại)
- **Request Body:**
  ```json
  {
    "content": "Tôi muốn biết thủ tục sang tên sổ đỏ khi nhận thừa kế cần những giấy tờ gì?"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "userMessage": {
      "id": "40000000-0000-0000-0000-000000000001",
      "conversationId": "30000000-0000-0000-0000-000000000001",
      "role": "user",
      "content": "Tôi muốn biết thủ tục sang tên sổ đỏ khi nhận thừa kế cần những giấy tờ gì?",
      "citations": null,
      "createdAt": "2026-10-26T14:01:00Z"
    },
    "assistantMessage": {
      "id": "40000000-0000-0000-0000-000000000002",
      "conversationId": "30000000-0000-0000-0000-000000000001",
      "role": "assistant",
      "content": "### 1. Cơ sở pháp lý\nCăn cứ quy định tại Luật Đất đai[^1]...",
      "citations": [
        {
          "id": "cit-001",
          "index": 1,
          "documentTitle": "Luật Đất đai 2024",
          "documentNumber": "31/2024/QH15",
          "articleReference": "Điều 45, Khoản 1",
          "sourceUrl": "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Luat-Dat-dai-2024-523642.aspx",
          "citedText": "Điều kiện thực hiện các quyền chuyển đổi, chuyển nhượng, cho thuê, thừa kế..."
        }
      ],
      "createdAt": "2026-10-26T14:01:05Z"
    }
  }
  ```

---

### C. Lấy Danh Sách Tin Nhắn Trong Cuộc Hội Thoại (`GET /api/conversations/{id}/messages`)

- **URL Params:** `id` (Guid của cuộc hội thoại)
- **Response (200 OK):** Danh sách mảng các tin nhắn đã sắp xếp theo thứ tự thời gian:
  ```json
  [
    {
      "id": "40000000-0000-0000-0000-000000000001",
      "conversationId": "30000000-0000-0000-0000-000000000001",
      "role": "user",
      "content": "Câu hỏi của người dùng",
      "citations": null,
      "createdAt": "2026-10-26T14:01:00Z"
    },
    {
      "id": "40000000-0000-0000-0000-000000000002",
      "conversationId": "30000000-0000-0000-0000-000000000001",
      "role": "assistant",
      "content": "Nội dung trả lời của AI kèm chú dẫn",
      "citations": [ ... ],
      "createdAt": "2026-10-26T14:01:05Z"
    }
  ]
  ```
