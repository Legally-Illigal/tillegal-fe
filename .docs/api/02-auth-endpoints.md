# Hợp Đồng API: Xác Thực & Quản Lý Tài Khoản (Auth Endpoints)

Hợp đồng được đối chiếu trực tiếp từ `Tillegal.Api.Controllers.AuthController` và các hợp đồng trong `Tillegal.Api.Contracts.Auth`.

## 1. Mô Hình Người Dùng & Vai Trò (Roles)

```ts
export type UserRole = 'Admin' | 'User' | 'Lawyer' | string

export interface LoginUserInfo {
  id: string // Guid
  email: string
  fullName: string
  phoneNumber?: string | null
  role?: UserRole | null // "User" (Người dân), "Lawyer" (Luật sư), "Admin"
}
```

## 2. Danh Sách Endpoint

### A. Đăng Nhập Mật Khẩu (`POST /api/auth/login`)

- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "20000000-0000-0000-0000-000000000001",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0912345678",
      "role": "User"
    },
    "message": "Login successful."
  }
  ```
- **Cookie đi kèm:** Tự động set cookie `access_token` (`HttpOnly`, `SameSite=Lax`, `Path=/api`).

---

### B. Đăng Ký Tài Khoản (`POST /api/auth/register`)

Quy trình đăng ký áp dụng cơ chế xác thực mã OTP gửi về Email.

- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0912345678" // Tùy chọn
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Mã xác thực OTP đã được gửi đến email của bạn.",
    "expirationMinutes": 10
  }
  ```

---

### C. Xác Thực Đăng Ký Bằng OTP (`POST /api/auth/verify-registration`)

- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "userId": "20000000-0000-0000-0000-000000000001",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "message": "Xác thực tài khoản thành công."
  }
  ```

---

### D. Gửi Lại Mã OTP (`POST /api/auth/resend-otp`)

- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Mã OTP mới đã được gửi.",
    "expirationMinutes": 10
  }
  ```

---

### E. Đăng Ký & Đăng Nhập Bằng Google (`POST /api/auth/login/google` & `POST /api/auth/register/google`)

Endpoint `POST /api/auth/login/google` áp dụng cơ chế **Unified Single Sign-On (JIT Auto-provisioning & Account Linking)**:

- Người dùng đã có tài khoản Google: Đăng nhập ngay.
- Người dùng đã đăng ký trước đó bằng email/mật khẩu: Tự động liên kết `GoogleSubject` và đăng nhập.
- Người dùng hoàn toàn mới: Tự động tạo tài khoản người dùng (`User` role) và đăng nhập trong cùng 1 request.

- **Request Body:**
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "userId": "20000000-0000-0000-0000-000000000001",
    "email": "user@gmail.com",
    "fullName": "Nguyễn Văn A",
    "message": "Google login completed successfully."
  }
  ```
- **Cookie đi kèm:** Tự động set cookie `access_token` cho phiên làm việc (`Path=/api`).

---

### F. Đăng Xuất (`POST /api/auth/logout`)

Hủy phiên làm việc phía máy chủ bằng cách xóa cookie `access_token` (đặt `Expires` về quá khứ và khớp `Path=/api`).

- **Yêu cầu:** Gửi kèm cookie hoặc Bearer Token hiện tại.
- **Request Body:** Không có.
- **Response (200 OK):**
  ```json
  {
    "message": "Logged out successfully."
  }
  ```
- **Cookie Response:** `Set-Cookie: access_token=; Expires=...; Path=/api; HttpOnly; SameSite=Lax`

---

### G. Lấy Thông Tin Người Dùng Hiện Tại (`GET /api/auth/me`)

Xác thực phiên làm việc đang hoạt động và trả về thông tin người dùng được định danh từ token/cookie, đồng thời kiểm tra tài khoản còn đang hoạt động (`user.IsActive == true`).

- **Yêu cầu xác thực:** `[Authorize]`
- **Response (200 OK):**
  ```json
  {
    "id": "20000000-0000-0000-0000-000000000001",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "phoneNumber": "0912345678",
    "role": "User",
    "isActive": true
  }
  ```
- **Response Lỗi:**
  - `401 Unauthorized`: Token không hợp lệ, phiên hết hạn hoặc tài khoản đã bị khóa/vô hiệu hóa (`IsActive == false`).
  - `404 NotFound`: Không tìm thấy tài khoản tương ứng trong hệ thống.
