# Quy Ước Tích Hợp API (API Conventions)

Tài liệu này chuẩn hóa quy chuẩn giao tiếp giữa Frontend (`tillegal-fe`) và Backend ASP.NET Core (`tillegal-be`).

## 1. Cấu Hình Endpoint & Base URL

- Base URL của Backend được cấu hình qua biến môi trường `VITE_API_BASE_URL` trong file `.env`.
- Route mặc định của Backend tuân theo mẫu: `/api/[controller]` (không có tiền tố version `/v1`).
- Đóng gói tập trung tại `src/config/env.ts`:
  ```ts
  export const env = {
    appName: import.meta.env.VITE_APP_NAME ?? 'Tillegal',
    defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'vi',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5063/api',
  }
  ```

## 2. Tiêu Chuẩn Request Headers & Cookies

Mọi request gửi từ Frontend lên Backend (.NET) tuân theo:

```http
Content-Type: application/json
Accept: application/json
X-Correlation-ID: <uuid>               # Định danh truy vết phân tán (tùy chọn)
Authorization: Bearer <jwt_token>      # Bearer token (tùy chọn nếu đã có cookie)
Cookie: access_token=<jwt_token>       # Tự động gửi nếu bật credentials: 'include'
```

### Cơ chế xác thực Cookie & CORS:

- Backend đã kích hoạt CORS chính sách `DefaultCorsPolicy` với `AllowCredentials()`, hỗ trợ origin `http://localhost:5173`.
- `POST /api/auth/login` và các endpoint Google Auth tự động đính kèm cookie `access_token` (`HttpOnly`, `SameSite=Lax`).
- Frontend kích hoạt `credentials: 'include'` trên mọi request `fetch` để trình duyệt tự động gửi cookie này.

## 3. Cấu Trúc Dữ Liệu Phản Hồi (Payload Formatting)

### A. Phản hồi thành công (HTTP 200 OK / 201 Created):

Backend trả dữ liệu trực tiếp dạng JSON (không bọc vỏ bọc custom `{ success, data }`):

```json
{
  "id": "30000000-0000-0000-0000-000000000001",
  "title": "Tư vấn thủ tục pháp lý",
  "createdAt": "2026-10-26T14:00:00Z"
}
```

Hoặc mã **`204 NoContent`** cho các lệnh thực thi không cần trả về payload.

### B. Phản hồi lỗi chuẩn RFC 7807 (ProblemDetails):

Mọi lỗi `4xx` và `5xx` trả về tiêu đề `Content-Type: application/problem+json` theo chuẩn **ProblemDetails**:

```json
{
  "status": 400,
  "title": "One or more validation errors occurred.",
  "detail": "Review the errors and try again.",
  "instance": "/api/auth/login",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "errors": {
    "Email": ["'Email' must not be empty."],
    "Password": ["'Password' must be at least 8 characters."]
  }
}
```

## 4. Xử Lý Mã Trạng Thái HTTP (Status Codes)

- **`200 OK`**: Truy vấn hoặc cập nhật thành công, trả về dữ liệu.
- **`201 Created`**: Tạo mới tài nguyên thành công (ví dụ: tạo cuộc hội thoại mới).
- **`204 NoContent`**: Thực hiện lệnh thành công, không có nội dung trả về.
- **`400 BadRequest`**: Lỗi validation dữ liệu đầu vào hoặc vi phạm quy tắc nghiệp vụ. Kiểm tra trường `errors` trong `ProblemDetails`.
- **`401 Unauthorized`**: Chưa xác thực hoặc token hết hạn.
- **`403 Forbidden`**: Đã đăng nhập nhưng không có quyền hạn truy cập tài nguyên.
- **`404 NotFound`**: Không tìm thấy tài nguyên chỉ định (ví dụ: conversation không tồn tại).
- **`429 TooManyRequests`**: Vượt quá hạn mức yêu cầu (Rate limit: 100 req/phút/IP).
- **`500 InternalServerError`**: Lỗi máy chủ chưa được xử lý.
