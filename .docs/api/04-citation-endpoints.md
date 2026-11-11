# Hợp Đồng API: Kiểm Chứng Trích Dẫn & Tra Cứu (Citation Endpoints)

> [!NOTE]
> **Trạng thái triển khai Backend:**
>
> - Hiện tại trong `tillegal-be`, các trích dẫn pháp lý (`CitationItem`) được sinh tự động bởi AI và nhúng trực tiếp vào payload phản hồi của tin nhắn trợ lý AI (`POST /api/conversations/{id}/messages`).
> - Cấu trúc trích dẫn thực tế tuân theo format chuẩn:
>   `{ id, index, documentTitle, documentNumber, articleReference, sourceUrl, citedText }`.
> - Các endpoint kiểm chứng trích dẫn độc lập dưới đây nằm trong backlog tương lai (BE-F06 & BE-F07) khi mở rộng phân hệ chuyên sâu cho Luật sư.

---

## 1. Cấu Trúc Dữ Liệu Trích Dẫn Thực Tế Trong Tin Nhắn

```ts
export interface CitationItem {
  id: string // Ví dụ: "cit-001"
  index: number // Số thứ tự chú thích trong bài [^1], [^2]
  documentTitle: string // Tên văn bản luật (Ví dụ: "Luật Doanh nghiệp 2020")
  documentNumber: string // Số hiệu văn bản (Ví dụ: "59/2020/QH14")
  articleReference: string // Căn cứ điều khoản (Ví dụ: "Điều 23, Khoản 1")
  sourceUrl: string // Link tra cứu chính thức (Thư Viện Pháp Luật, Cổng TTĐT)
  citedText: string // Trích đoạn nội dung điều luật làm căn cứ
}
```

---

## 2. Kế Hoạch Endpoint Kiểm Chứng Độc Lập (Tương Lai)

### A. Kiểm Chứng Trích Dẫn Độc Lập (`POST /api/citations/verify`)

- **Mục đích:** Dành cho luật sư hoặc người dùng muốn kiểm tra một nhận định pháp luật hoặc trích dẫn có sẵn.
- **Request Body:**
  ```json
  {
    "claim": "Hợp đồng đặt cọc mua bán nhà bắt buộc phải công chứng mới có hiệu lực pháp luật.",
    "citedArticle": "Luật Công chứng 2014"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "isSupported": false,
    "confidenceScore": 0.95,
    "verdict": "refuted",
    "summaryAnalysis": "Bộ luật Dân sự 2015 và Luật Nhà ở không quy định bắt buộc hợp đồng đặt cọc phải công chứng. Việc công chứng chỉ mang tính khuyến khích.",
    "issues": [
      {
        "type": "unsupported_claim",
        "severity": "high",
        "description": "Căn cứ viện dẫn không quy định điều kiện bắt buộc công chứng đối với đặt cọc."
      }
    ]
  }
  ```
