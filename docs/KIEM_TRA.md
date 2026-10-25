# Kết quả kiểm tra — Bài 2

Ngày thực hiện: 28/09/2026. Môi trường Windows, Node.js 24.19.0, Docker Engine 29.7.2.

| Nội dung | Kết quả thực tế | Đánh giá |
|---|---|---|
| Schema theo hình | 7 model; OrderDetail khóa kép; đầy đủ khóa ngoại | Đạt phạm vi sơ đồ |
| Migration | migrate deploy thành công; migrate status: up to date | Đạt |
| Seed | ADMIN/CUSTOMER/BASIC và admin từ .env; chạy lại trong Docker thành công | Đạt |
| JWT, quyền, ownership | Test thiếu/sai/hết hạn token, role injection, quyền cập nhật và truy cập đơn người khác | Đạt các trường hợp được test |
| Product CRUD | Test integration và gọi HTTP vào API container | Đạt |
| Order transaction | Giá snapshot, rollback thiếu tồn, hai người mua món cuối | Đạt |
| Membership/Shipment | Khóa ngoại, chuyển trạng thái, quyền truy cập | Đạt |
| npm test | 14 tests, 14 pass, 0 fail | Đạt |
| Docker build | Image ecommerce-monolith:local build thành công | Đạt |
| Compose | postgres và api healthy; migrate/seed Exit 0 | Đạt |
| GET /health trực tiếp | HTTP 200; database connected | Đạt |
| /health khi query lỗi | Test mô phỏng query failure trả 503 | Đạt nhánh xử lý lỗi |
| Chủ động dừng PostgreSQL | Chưa thực hiện: công cụ chặn lệnh stop theo chính sách kiểm duyệt | Chưa xác nhận outage thực |
| npm audit --omit=dev | 0 vulnerabilities tại thời điểm kiểm tra | Đạt lần quét hiện tại |
| .env | git check-ignore xác nhận bị loại khỏi Git | Đạt |

## Phân biệt test và dữ liệu demo

14 test dùng database thật, mỗi lần tạo schema test_UUID rồi dọn đúng schema đó. Test readiness 503 mô phỏng lỗi query; không phải kết quả thử ngắt PostgreSQL thật.

Smoke test HTTP vào container thực hiện đăng nhập admin, tạo/sửa/đọc/xóa Product và xác nhận 404 sau xóa. Product thử nghiệm đã được xóa. Không in token hoặc mật khẩu ra log.

## Cấu hình dependency

Prisma và adapter/client khóa 7.10.0. Đã thêm overrides deepmerge-ts 8.0.2 và mysql2 3.24.4 để xử lý cảnh báo audit ở dependency gián tiếp của Prisma CLI; đã xác nhận generate, migrate, seed, tests và Docker build chạy được với overrides.

Ứng dụng dùng PostgreSQL; không mở kết nối MySQL.

## Giới hạn đánh giá

Đây là MVP theo đề, chưa có load test, kiểm thử bảo mật chuyên sâu hoặc triển khai công khai. Không kết luận đây là hệ thống production hoàn chỉnh chỉ từ test pass.

Các nghiệp vụ chưa có dữ liệu trong hình (điểm cá nhân, địa chỉ giao, thanh toán, hủy đơn/hoàn tiền, phân bổ mặt hàng theo Shipment) chưa được giả lập thành chức năng hoàn chỉnh. Chi tiết ở README.

