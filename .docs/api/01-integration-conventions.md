# Quy Ước Tích Hợp API (API Conventions)

## 1. Cấu Hình Endpoint & Base URL
- Base URL của Backend được cấu hình qua biến môi trường `VITE_API_BASE_URL` trong file `.env`.
- Được đóng gói tập trung tại `src/config/env.ts`:
  ```ts
  export const env = {
    // ...
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  }
  ```

## 2. Tiêu Chuẩn Request Headers
Mọi request gửi từ Frontend lên Backend (.NET) phải tuân theo định dạng:
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>   # Nếu là endpoint yêu cầu xác thực
X-Correlation-ID: <uuid>               # Để trace log qua các tầng (tùy chọn)
```

## 3. Cấu Trúc Dữ Liệu Phản Hồi Chuẩn (Response Envelope)
Tất cả response REST API từ Backend trả về đều tuân theo cấu trúc thống nhất:

### Phản hồi thành công (HTTP 200 / 201):
```json
{
  "success": true,
  "data": { ... },
  "message": "Thành công"
}
```

### Phản hồi lỗi (HTTP 4xx / 5xx):
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Thông tin đầu vào không hợp lệ.",
    "details": [ ... ]
  }
}
```

## 4. Xử Lý Mã Trạng Thái HTTP (Status Codes)
- `200 OK / 201 Created`: Xử lý thành công, trả dữ liệu vào UI.
- `400 Bad Request`: Lỗi validation phía client hoặc dữ liệu gửi sai định dạng.
- `401 Unauthorized`: Token hết hạn hoặc chưa đăng nhập. Frontend tự động điều hướng sang trang Login hoặc gọi endpoint Refresh Token.
- `403 Forbidden`: Người dùng không đủ quyền hạn (ví dụ: Người dân truy cập chức năng Admin).
- `500 Internal Server Error`: Lỗi máy chủ Backend / AI Service. Hiển thị thông báo xin lỗi người dùng.
- `503 Service Unavailable`: Hệ thống AI hoặc Data Pipeline đang bảo trì / quá tải. Hiển thị thông báo trạng thái.
