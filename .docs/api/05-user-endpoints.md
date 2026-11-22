# Hợp Đồng API: Quản Lý Hồ Sơ & Tài Khoản Cá Nhân (User Endpoints)

Hợp đồng được đối chiếu trực tiếp từ `Tillegal.Api.Controllers.UsersController` và các hợp đồng trong `Tillegal.Api.Contracts.Users`. Toàn bộ các endpoint đều yêu cầu xác thực (`[Authorize]`).

## 1. Mô Hình Dữ Liệu (Contracts)

```ts
export interface UserProfileApiResponse {
  id: string // Guid
  fullName: string
  email: string | null
  phoneNumber: string | null
  role: 'Admin' | 'User' | 'Lawyer' | string | null
  isActive: boolean
  createdAt: string // ISO 8601 DateTimeOffset
  lastActiveAt: string | null // ISO 8601 DateTimeOffset
}

export interface UpdateUserProfileApiRequest {
  fullName: string // Bắt buộc, tối đa 150 ký tự
  phoneNumber?: string | null // Tùy chọn, tối đa 20 ký tự, regex: ^\+?[0-9\s\-()]{7,20}$
}

export interface ChangePasswordApiRequest {
  newPassword: string // Bắt buộc, tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số
}

export interface ChangePasswordApiResponse {
  message: string // Mặc định: "Password has been successfully updated."
}
```

---

## 2. Danh Sách Endpoint

### A. Lấy Thông Tin Hồ Sơ Người Dùng Hiện Tại (`GET /api/users/me`)

Xác thực phiên làm việc đang hoạt động và trả về thông tin chi tiết của người dùng đăng nhập hiện tại từ cookie `access_token` hoặc `Authorization: Bearer <token>`.

- **Phương thức:** `GET`
- **Đường dẫn:** `/api/users/me`
- **Yêu cầu xác thực:** `[Authorize]`
- **Response (200 OK):**
  ```json
  {
    "id": "20000000-0000-0000-0000-000000000001",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "phoneNumber": "0912345678",
    "role": "User",
    "isActive": true,
    "createdAt": "2026-11-10T08:00:00+07:00",
    "lastActiveAt": "2026-11-18T22:30:00+07:00"
  }
  ```
- **Response Lỗi:**
  - `401 Unauthorized`: Token không hợp lệ, phiên hết hạn hoặc tài khoản đã bị vô hiệu hóa (`isActive == false`).
  - `404 NotFound`: Không tìm thấy tài khoản tương ứng trong cơ sở dữ liệu.

---

### B. Cập Nhật Thông Tin Hồ Sơ (`PUT /api/users/me`)

Cho phép người dùng chỉnh sửa họ và tên cũng như số điện thoại liên hệ cá nhân. Địa chỉ email đăng ký là định danh cố định không thay đổi qua endpoint này.

- **Phương thức:** `PUT`
- **Đường dẫn:** `/api/users/me`
- **Yêu cầu xác thực:** `[Authorize]`
- **Request Body:**
  ```json
  {
    "fullName": "Nguyễn Văn B",
    "phoneNumber": "0987654321"
  }
  ```
- **Quy tắc kiểm tra (Validation Rules):**
  - `fullName`: Không được để trống, tối đa 150 ký tự.
  - `phoneNumber`: Tùy chọn, tối đa 20 ký tự, định dạng regex `^\+?[0-9\s\-()]{7,20}$`.
- **Response (200 OK):** Trả về đối tượng `UserProfileApiResponse` với các thông tin đã cập nhật.
- **Response Lỗi:**
  - `400 Bad Request`: Dữ liệu không thỏa mãn validation (ProblemDetails).
  - `401 Unauthorized`: Chưa đăng nhập hoặc tài khoản không còn hiệu lực.
  - `404 NotFound`: Không tìm thấy người dùng.

---

### C. Đổi Mật Khẩu (`PUT /api/users/me/password`)

Cho phép người dùng đang đăng nhập đổi sang mật khẩu mới. Mật khẩu mới được băm bảo mật phía máy chủ qua `IPasswordHashingService`.

- **Phương thức:** `PUT`
- **Đường dẫn:** `/api/users/me/password`
- **Yêu cầu xác thực:** `[Authorize]`
- **Request Body:**
  ```json
  {
    "newPassword": "NewSecurePassword123!"
  }
  ```
- **Quy tắc kiểm tra (Validation Rules):**
  - `newPassword`: Bắt buộc, độ dài tối thiểu 8 ký tự, có ít nhất 1 chữ in hoa (A-Z), ít nhất 1 chữ thường (a-z), và ít nhất 1 chữ số (0-9).
- **Response (200 OK):**
  ```json
  {
    "message": "Password has been successfully updated."
  }
  ```
- **Response Lỗi:**
  - `400 Bad Request`: Mật khẩu mới không đáp ứng tiêu chuẩn độ phức tạp.
  - `401 Unauthorized`: Người dùng chưa xác thực hoặc tài khoản bị khóa.
  - `404 NotFound`: Không tìm thấy tài khoản người dùng.

---

### D. Vô Hiệu Hóa Tài Khoản Cá Nhân (`DELETE /api/users/me`)

Thực hiện soft-delete (đặt `IsActive = false`) cho tài khoản người dùng và tự động xóa bỏ cookie `access_token` khỏi trình duyệt (`HttpOnly`, `Path=/api`).

- **Phương thức:** `DELETE`
- **Đường dẫn:** `/api/users/me`
- **Yêu cầu xác thực:** `[Authorize]`
- **Quy tắc an toàn (Security Guard):**
  - Quản trị viên (Admin) **không thể** tự vô hiệu hóa tài khoản của chính mình. Máy chủ sẽ trả về lỗi `400 Bad Request` kèm thông điệp `"Administrators cannot lock or deactivate their own account."`.
- **Response (204 No Content):** Thành công. Trình duyệt tự động xóa cookie `access_token`.
- **Response Lỗi:**
  - `400 Bad Request`: Khi quản trị viên cố tình vô hiệu hóa tài khoản của bản thân.
  - `401 Unauthorized`: Phiên xác thực không hợp lệ.
  - `404 NotFound`: Không tìm thấy người dùng.
