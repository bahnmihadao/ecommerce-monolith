# Bài 2 — Ecommerce Monolithic MVP

RESTful API dùng Node.js 24, Express 5, Prisma 7.10 và PostgreSQL 17. Toàn bộ chức năng nằm trong một ứng dụng backend, dùng một database. PostgreSQL là container database riêng; điều này không biến hệ thống thành microservices.

## Chạy ngay

Mở terminal trong thư mục **ecommerce-monolith**:

```bash
docker compose up -d --build --wait --wait-timeout 180
docker compose ps -a
curl -i http://localhost:3001/health
```

Lần đầu cần thời gian tải image và cài thư viện. PostgreSQL và API phải healthy; migrate và seed kết thúc với Exit 0 là bình thường.

- API: http://localhost:3001
- PostgreSQL trên máy: localhost:5433
- Tài khoản quản trị: đọc ADMIN_USERNAME và ADMIN_PASSWORD trong .env.
- File .env đã được tạo với mật khẩu và JWT secret ngẫu nhiên cho máy hiện tại. Không đưa .env lên Git.
- Không cần cài PostgreSQL trực tiếp lên Windows.
- Cổng 3001/5433 tách khỏi product-api của bài 1.

Nếu sao chép bài sang máy khác: sao chép .env.example thành .env và thay các giá trị mẫu trước khi chạy. Mật khẩu PostgreSQL dùng ký tự hex hoặc URL-encode khi đưa vào DATABASE_URL. JWT_SECRET cần ít nhất 32 ký tự. ADMIN_PASSWORD cần từ 12 ký tự và tối đa 72 byte.

Cẩm nang Demo Vấn đáp 8/8 điểm: [docs/HUONG_DAN_DEMO_TH2.md](docs/HUONG_DAN_DEMO_TH2.md).
Hướng dẫn tuần tự và đánh giá từng bước: [docs/HUONG_DAN.md](docs/HUONG_DAN.md).
Danh sách API và cách dùng: [docs/API.md](docs/API.md).
Kết quả kiểm tra thực tế: [docs/KIEM_TRA.md](docs/KIEM_TRA.md).

## Cấu trúc

- prisma/schema.prisma: 7 bảng và quan hệ từ sơ đồ.
- prisma/migrations/: SQL có version, dùng migrate deploy để tạo bảng.
- prisma/seed.js: tạo ADMIN, CUSTOMER, BASIC và admin lần đầu; không reset mật khẩu khi chạy lại.
- src/app.js: cấu hình Express, gắn global middleware, mount routes và error handler.
- src/routes/: định tuyến RESTful API theo từng phân hệ (auth, user, product, order, shipment, membership, health).
- src/controllers/: xử lý logic nghiệp vụ và truy vấn dữ liệu theo từng phân hệ.
- src/middlewares/: middleware xác thực JWT (authenticate), phân quyền (admin), rateLimit và xử lý lỗi tập trung.
- src/validators/: schema kiểm tra và chuẩn hóa dữ liệu đầu vào bằng Zod.
- src/security.js: tương thích ngược, re-export auth middleware.
- src/db.js: Prisma Client qua PostgreSQL adapter.
- src/config.js: đọc và kiểm tra .env.
- src/server.js: khởi động và đóng kết nối khi dừng.
- src/healthcheck.js: probe cho Docker.
- test/api.test.js: integration test trên PostgreSQL trong schema tạm.
- compose.yaml: PostgreSQL → migration → seed → API.

## Phạm vi và quyết định nghiệp vụ

Giữ đúng 7 bảng: Role, User, MemberShip, Product, Order, OrderDetail, Shipment. Giữ trường createat như ảnh. OrderDetail có khóa chính kép (oid, pid); một Order có thể có nhiều Shipment.

Bổ sung ràng buộc kỹ thuật: ID tự tăng; username, rolename, mname duy nhất; mật khẩu được băm bcrypt; kiểm tra không âm ở database; khóa ngoại RESTRICT giữ lịch sử. Không trả password trong response.

Hai quyền cố định ADMIN và CUSTOMER được seed; API chỉ cho đọc danh sách Role, không đổi tên/xóa quyền hệ thống. Đăng ký luôn nhận CUSTOMER và BASIC. Admin quản lý sản phẩm, hạng thành viên, quyền/hạng của user và vận chuyển. Khách hàng xem danh mục, cập nhật tên của mình, đặt/xem đơn của mình.

MemberShip.score được hiểu là ngưỡng điểm của hạng. Sơ đồ không chứa điểm cá nhân nên MVP chưa tự tích điểm/nâng hạng; admin gán hạng thủ công. Đây là giả định cần xác nhận nếu mở rộng đề bài.

Order tạo từ items; uid lấy từ JWT. unit_price lấy từ Product tại lúc đặt, không nhận giá từ client. Giá API là chuỗi Decimal ("19.99") tránh làm tròn nhị phân. total được tính từ OrderDetail, không thêm cột vào sơ đồ. Đơn cần ít nhất một chi tiết dù ERD cho phép 0..*. Trừ tồn kho và tạo đơn trong cùng transaction SERIALIZABLE. Khi tranh chấp, trả 409 để khách tải lại và thử lại; không bán âm kho.

MVP giữ đơn đã đặt để tra cứu, không hỗ trợ sửa/xóa/hủy đơn. Sơ đồ thiếu trạng thái đơn và hoàn tiền, nên chưa tự dựng quy trình hủy đơn. Product đã được đặt không được xóa do khóa ngoại.

Shipment: PENDING → SHIPPED → DELIVERED, hoặc PENDING → CANCELLED. Hủy Shipment chỉ hủy chuyến giao, không hủy Order và không hoàn tồn kho; admin có thể tạo chuyến giao khác. Sơ đồ không có chi tiết phân bổ hàng theo chuyến, địa chỉ hay đơn vị vận chuyển nên MVP chưa theo dõi giao từng phần.

Ngoài phạm vi: thanh toán, giỏ hàng lưu server, quên mật khẩu, refresh token, upload ảnh, địa chỉ giao hàng, giao diện web, CD. JWT hết hạn thì đăng nhập lại.

## Chạy code trực tiếp để học

```bash
npm ci
npm run db:generate
docker compose up -d postgres
npm run db:deploy
npm run db:seed
npm run dev
```

Nếu container api đang chạy, dùng docker compose stop api trước để giải phóng cổng 3001.

Prisma 7 dùng prisma.config.ts và @prisma/adapter-pg. Bài dùng prisma-client-js để giữ mã ứng dụng JavaScript; generator này đã được Prisma đánh dấu deprecated, vẫn hoạt động ở bản 7.10 đã khóa. Khi nâng cấp lớn, cần đổi generator theo hướng dẫn của Prisma.

## Test

```bash
npm ci
npm run db:generate
docker compose up -d postgres
npm test
```

Test tạo schema test_<UUID>, chạy migration/seed, gọi API qua HTTP rồi drop đúng schema test đó. Không xóa public hoặc database chính. Tài khoản PostgreSQL cần quyền tạo schema. Test lỗi readiness có mock riêng; kiểm tra dừng database thực được ghi ở báo cáo.

## Dừng và chạy lại

```bash
docker compose stop
docker compose start
docker compose logs --tail=100 api
docker compose down
```

down giữ volume dữ liệu. down -v sẽ xóa dữ liệu; không dùng khi cần giữ bài.
Sau khi sửa code: docker compose up -d --build --wait --wait-timeout 180.

Tài liệu tham chiếu:
- https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- https://docs.docker.com/compose/how-tos/startup-order/

