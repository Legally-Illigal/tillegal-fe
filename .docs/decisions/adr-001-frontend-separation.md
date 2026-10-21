# ADR-001: Phân Tách Frontend Thành Ứng Dụng Độc Lập

## Trạng Thái
Accepted (Kế thừa từ ADR-001 trong System Architecture Description - Document 7)

## Bối Cảnh
Hệ thống Tillegal bao gồm giao diện Web, xử lý nghiệp vụ .NET, suy luận Multi-Agent Python và Data Pipeline. Các thành phần này có tốc độ thay đổi và yêu cầu môi trường khác nhau. Giao diện người dùng cần phản hồi nhanh, tối ưu trải nghiệm tương tác hỏi đáp và cập nhật thường xuyên về mặt UX/UI mà không làm gián đoạn các dịch vụ backend.

## Quyết Định
- Frontend được xây dựng thành một ứng dụng Single Page Application (SPA) hoàn toàn độc lập với Backend.
- Mã nguồn Frontend đặt tại repository riêng (`tillegal-fe`), build ra các static assets và có thể deploy độc lập (qua Nginx, Cloudflare Pages, S3 hoặc Docker container).
- Toàn bộ giao tiếp với Backend thực hiện qua HTTPS REST API có hợp đồng dữ liệu chuẩn hóa.

## Hệ Quả
- **Ưu điểm:**
  - Chu kỳ phát triển và deploy Frontend hoàn toàn độc lập, tăng tốc độ thử nghiệm giao diện.
  - Tách bạch rõ ràng ranh giới giữa giao diện (UI) và xử lý nghiệp vụ/dữ liệu (Backend).
  - Tận dụng tối đa hệ sinh thái phong phú của React và tooling hiện đại (Vite, Tailwind).
- **Hạn chế & Thách thức:**
  - Cần duy trì hợp đồng API (API contract) chặt chẽ giữa Frontend và Backend.
  - Phải xử lý vấn đề CORS (Cross-Origin Resource Sharing) trong môi trường phát triển và triển khai.
  - Cần cơ chế xử lý lỗi mạng và mất kết nối bất đồng bộ ở phía client.
