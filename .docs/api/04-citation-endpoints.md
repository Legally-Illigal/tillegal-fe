# Hợp Đồng API: Kiểm Chứng Trích Dẫn & Tra Cứu (Citation Endpoints)

## 1. Cấu Trúc Dữ Liệu Kiểm Chứng (Verification Models)
```ts
export interface VerifyCitationRequest {
  claim: string            // Nhận định hoặc quan điểm pháp lý cần kiểm tra
  citedArticle?: string    // Điều khoản hoặc văn bản được viện dẫn (nếu có)
  context?: string         // Tình huống hoặc bối cảnh áp dụng
}

export interface VerificationIssue {
  type: 'invalid_source' | 'wrong_article' | 'expired_law' | 'unsupported_claim'
  severity: 'high' | 'medium' | 'low'
  description: string      // Diễn giải chi tiết lý do sai/thiếu
}

export interface VerifyCitationResult {
  isSupported: boolean     // Căn cứ có thực sự hỗ trợ nhận định không?
  confidenceScore: number  // Điểm tin cậy (0.0 đến 1.0)
  verdict: 'verified' | 'refuted' | 'inconclusive'
  summaryAnalysis: string  // Giải thích logic pháp lý
  primaryCitation?: CitationItem
  issues: VerificationIssue[]
}
```

## 2. Danh Sách Endpoint

### A. Kiểm Chứng Trích Dẫn Độc Lập (`POST /citations/verify`)
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

### B. Tra Cứu Nhanh Văn Bản Căn Cứ (`GET /citations/search`)
- **Query:** `?keyword=dat+coc&limit=5`
- **Response Data (200 OK):** Mảng các `CitationItem` khớp với từ khóa tìm kiếm để gợi ý cho người dùng.
