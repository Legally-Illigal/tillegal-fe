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
  parentMessageId?: string | null // Guid? - Khóa ngoại tự tham chiếu tin nhắn cha (cho phép phân nhánh cây)
  role: 'user' | 'assistant'
  content: string // Nội dung Markdown, có chứa ký hiệu chú dẫn trích dẫn [^1]
  citations?: CitationItem[] | null // Danh sách các căn cứ điều luật do AI trích dẫn
  createdAt: string // ISO 8601 DateTimeOffset
  updatedAt?: string | null
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

Backend tự động phân luồng xử lý AI theo vai trò người dùng (Role-Based AI Consultation):
- **Người dùng phổ thông (`User`):** Kích hoạt luồng tư vấn đơn tác tử tiêu chuẩn (`workflow_mode: "single_agent"`).
- **Luật sư (`Lawyer` / `Lawer`):** Kích hoạt luồng tư vấn đa tác tử chuyên sâu (`workflow_mode: "multi_agent"`), phối hợp nhiều Agent chuyên trách để bóc tách rủi ro, phân tích đa chiều và tổng hợp câu trả lời chuyên sâu cùng trích dẫn pháp lý minh bạch.

Khi nhận câu hỏi với `role = "user"`, Backend tự động lưu câu hỏi của người dùng vào DB, điều phối tới AI Service theo workflow mode tương ứng, lưu câu trả lời của trợ lý AI (với `parentMessageId` trỏ đến ID của tin nhắn người dùng vừa tạo) và trả về `201 Created`.

- **URL Params:** `id` (Guid của cuộc hội thoại)
- **Request Body:**
  ```json
  {
    "role": "user",
    "content": "Tôi muốn biết thủ tục sang tên sổ đỏ khi nhận thừa kế cần những giấy tờ gì?",
    "parentMessageId": "40000000-0000-0000-0000-000000000000"
  }
  ```
  _(Trường `role` mặc định là "user"; `parentMessageId` là tùy chọn; truyền null hoặc bỏ trống đối với tin nhắn khởi đầu, hoặc truyền ID của tin nhắn cha để tạo chuỗi nối tiếp / phân nhánh câu hỏi)._
- **Response (201 Created / 200 OK):**
  Backend trả về `MessageApiResponse` của tin nhắn trợ lý AI đã tạo:
  ```json
  {
    "id": "40000000-0000-0000-0000-000000000002",
    "conversationId": "30000000-0000-0000-0000-000000000001",
    "parentMessageId": "40000000-0000-0000-0000-000000000001",
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
    "createdAt": "2026-10-26T14:01:05Z",
    "updatedAt": null
  }
  ```
  *(Frontend tự động liên kết `userMessage` với ID từ `parentMessageId` của `assistantMessage` và đồng bộ đầy đủ cả 2 tin nhắn vào chuỗi hội thoại mà không cần gửi thêm request trùng lặp. Định dạng trả về `{ userMessage, assistantMessage }` cũng được hỗ trợ tương thích ngược).*

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

---

### D. Tài Liệu Đính Kèm Trong Cuộc Hội Thoại (`/api/Conversations/{conversationId}/attachments`)

- **`POST /api/Conversations/{conversationId}/attachments`** (`multipart/form-data` với trường `file`): Tải tài liệu lên cuộc hội thoại. Trả về `201 Created` với `AttachmentApiResponse` (hệ thống tự động trả về `fileName`, `fileSize`, `contentType`, `processingStatus`, `tokenCount`, `fileHash`, `createdAt`, `updatedAt`).
- **`GET /api/Conversations/{conversationId}/attachments`**: Lấy danh sách tài liệu đính kèm trong cuộc hội thoại (`200 OK` -> `AttachmentApiResponse[]`).
- **`GET /api/Conversations/{conversationId}/attachments/{attachmentId}`**: Lấy chi tiết metadata một tài liệu đính kèm (`200 OK` -> `AttachmentApiResponse`).
- **`DELETE /api/Conversations/{conversationId}/attachments/{attachmentId}`**: Xóa tài liệu đính kèm (`204 No Content`).
- **`GET /api/Conversations/{conversationId}/attachments/{attachmentId}/download`**: Tải xuống nội dung tệp nhị phân (`200 OK` -> binary stream).

---

### E. Cập Nhật Tiêu Đề Cuộc Hội Thoại (`PUT /api/conversations/{id}`)

- **URL Params:** `id` (Guid của cuộc hội thoại)
- **Request Body:**
  ```json
  {
    "title": "Tư vấn tranh chấp thừa kế đất đai"
  }
  ```
- **Response (200 OK):** `ConversationApiResponse`
  ```json
  {
    "id": "30000000-0000-0000-0000-000000000001",
    "userId": "20000000-0000-0000-0000-000000000001",
    "title": "Tư vấn tranh chấp thừa kế đất đai",
    "createdAt": "2026-10-26T14:00:00Z",
    "updatedAt": "2026-10-26T14:15:00Z"
  }
  ```

---

### F. Xóa Cuộc Hội Thoại (`DELETE /api/conversations/{id}`)

- **URL Params:** `id` (Guid của cuộc hội thoại)
- **Response (204 No Content):** Xóa toàn bộ đoạn hội thoại và các tài liệu đính kèm liên quan.

---

### G. Cập Nhật Tin Nhắn Tại Chỗ (`PUT /api/conversations/{conversationId}/messages/{messageId}`)

- **URL Params:** `conversationId` (Guid), `messageId` (Guid)
- **Request Body:**
  ```json
  {
    "content": "Tôi muốn biết thủ tục tặng cho đất đai thay vì thừa kế cần giấy tờ gì?",
    "citations": null
  }
  ```
- **Response (200 OK):** `MessageApiResponse`
  ```json
  {
    "id": "40000000-0000-0000-0000-000000000001",
    "conversationId": "30000000-0000-0000-0000-000000000001",
    "role": "user",
    "content": "Tôi muốn biết thủ tục tặng cho đất đai thay vì thừa kế cần giấy tờ gì?",
    "citations": null,
    "createdAt": "2026-10-26T14:01:00Z",
    "updatedAt": "2026-10-26T14:20:00Z"
  }
  ```
- **Mô tả hành vi trên Frontend:**
  - Khi người dùng chỉnh sửa câu hỏi của mình, Backend nhận yêu cầu cập nhật qua `PUT /api/conversations/{conversationId}/messages/{messageId}`.
  - Trên Frontend, hệ thống quản lý rẽ nhánh dạng cây (tree branching) trực quan: phiên bản câu hỏi cũ cùng các phản hồi sau đó được lưu thành nhánh (`< 1/2 >`), câu hỏi mới tạo ra nhánh mới (`< 2/2 >`) kèm phản hồi mới tương ứng từ AI.
  - Người dùng có thể dễ dàng chuyển qua lại giữa các phiên bản/nhánh bằng các nút điều hướng `<` và `>` ngay trên tin nhắn. Trạng thái phân nhánh được lưu trữ bền vững tại Client (`localStorage`).

---

### H. Xóa Tin Nhắn Trong Cuộc Hội Thoại (`DELETE /api/conversations/{conversationId}/messages/{messageId}`)

- **URL Params:** `conversationId` (Guid), `messageId` (Guid)
- **Response (204 No Content):** Đánh dấu xóa mềm tin nhắn trong cơ sở dữ liệu. Client đã tích hợp sẵn phương thức `chatApi.deleteMessage(conversationId, messageId)`.

---

### I. Tách Nhánh Hội Thoại Thành Cuộc Trò Chuyện Mới (`POST /api/conversations/{id}/fork`)

- **URL Params:** `id` (Guid của cuộc hội thoại nguồn)
- **Request Body:**
  ```json
  {
    "fromMessageId": "40000000-0000-0000-0000-000000000001",
    "newTitle": "Tư vấn thừa kế đất đai (Nhánh mới)",
    "newPrompt": "Nếu người thừa kế từ chối nhận di sản thì xử lý thế nào?"
  }
  ```
  _(Cả `fromMessageId`, `newTitle`, `newPrompt` đều là tùy chọn)._
- **Response (200 OK / 201 Created):** `ConversationApiResponse`
  ```json
  {
    "id": "30000000-0000-0000-0000-000000000002",
    "userId": "20000000-0000-0000-0000-000000000001",
    "title": "Tư vấn thừa kế đất đai (Nhánh mới)",
    "createdAt": "2026-10-26T14:25:00Z",
    "updatedAt": null
  }
  ```
- **Mô tả hành vi trên Frontend:**
  - Thay vì lưu các nhánh trong cùng một cuộc trò chuyện (tree branching phức tạp), hệ thống fork tạo ra một cuộc trò chuyện độc lập mới.
  - Sao chép toàn bộ ngữ cảnh và các tin nhắn từ đầu tới vị trí `fromMessageId` (nếu có).
  - Nếu cung cấp `newPrompt`, thêm câu hỏi mới vào cuộc trò chuyện mới và kích hoạt AI phản hồi.
  - Người dùng có thể thực hiện tách nhánh qua nút "Tách nhánh từ tin nhắn này" trên thanh công cụ tin nhắn, hoặc chọn "Lưu & Rẽ nhánh mới" khi đang chỉnh sửa nội dung tin nhắn.
