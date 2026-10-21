# Hợp Đồng API: Xác Thực & Phân Quyền (Auth Endpoints)

## 1. Mô Hình Người Dùng & Vai Trò (Roles)
```ts
export type UserRole = 'citizen' | 'lawyer' | 'admin'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  lawyerLicenseNumber?: string // Chỉ có nếu là luật sư
  createdAt: string
}
```

## 2. Danh Sách Endpoint

### A. Đăng Nhập (`POST /auth/login`)
- **Request Body:**
  ```json
  {
    "email": "lawyer@example.com",
    "password": "SecretPassword123!"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "d8e3b2...",
    "expiresIn": 3600,
    "user": { "id": "u-123", "email": "lawyer@example.com", "role": "lawyer", "fullName": "Nguyễn Văn A" }
  }
  ```

### B. Đăng Ký Tài Khoản (`POST /auth/register`)
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecretPassword123!",
    "fullName": "Trần Thị B",
    "role": "lawyer",
    "lawyerLicenseNumber": "HN-1234/TP"
  }
  ```

### C. Lấy Thông Tin Người Dùng Hiện Tại (`GET /auth/me`)
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response Data (200 OK):** Trả về đối tượng `UserProfile`.

### D. Làm Mới Token (`POST /auth/refresh`)
- **Request Body:** `{ "refreshToken": "d8e3b2..." }`
- **Response Data (200 OK):** `{ "accessToken": "...", "refreshToken": "..." }`

### E. Đăng Xuất (`POST /auth/logout`)
- Hủy token phía server. Phía Frontend xóa token khỏi bộ nhớ / storage và chuyển về trang Login.
