# Hướng dẫn tuần tự — Bài 2

## Bước 1: Đọc sơ đồ và xác định monolith

Một backend Express chứa toàn bộ chức năng; tất cả module truy cập cùng PostgreSQL qua Prisma.

| Bảng | Khóa chính | Quan hệ |
|---|---|---|
| Role | roleid | Một Role có nhiều User |
| MemberShip | mid | Một hạng có nhiều User |
| User | uid | Có một Role, một MemberShip; có nhiều Order |
| Product | pid | Có nhiều OrderDetail |
| Order | oid | Thuộc User; có nhiều chi tiết và Shipment |
| OrderDetail | oid + pid | Nối Order và Product, giữ qty và unit_price |
| Shipment | shipid | Thuộc Order; trạng thái giao hàng |

Kiểm tra: đọc prisma/schema.prisma, đối chiếu 7 bảng và khóa kép. Đạt khi mỗi khóa ngoại có quan hệ đúng như hình. Ràng buộc bổ sung và giả định được ghi trong README.

## Bước 2: Môi trường và .env

Cần Node 24, Docker Desktop đang chạy Linux containers.

```bash
node --version
docker version
npm ci
npm run db:generate
```

.env tách cấu hình khỏi source. DATABASE_URL dùng localhost:5433 khi Node chạy trên Windows; Compose tự chuyển sang postgres:5432 khi API chạy trong Docker. Không dùng localhost để truy cập PostgreSQL từ container API.

Kiểm tra: không có lỗi generate; không đưa .env vào Git. Nếu JWT_SECRET ngắn hơn 32 ký tự, app sẽ từ chối khởi động.

## Bước 3: PostgreSQL, migration và seed

```bash
docker compose up -d postgres
npm run db:deploy
npm run db:seed
```

Migration tạo bảng, unique index, khóa ngoại và CHECK. Seed tạo quyền ADMIN/CUSTOMER, hạng BASIC, admin từ .env.

Kiểm tra:
```bash
docker compose ps
npx prisma migrate status
```

Đạt khi PostgreSQL healthy và database schema up to date. Seed lần hai không tạo user admin trùng hoặc thay mật khẩu admin cũ.

## Bước 4: JWT và phân quyền

POST /api/auth/register tạo CUSTOMER. POST /api/auth/login trả accessToken. Dùng header Authorization: Bearer <token> khi gọi API cần đăng nhập.

Kiểm tra sau hướng dẫn:
- Không token khi GET /api/users/me → 401.
- Mật khẩu sai → 401.
- CUSTOMER tạo Product → 403.
- ADMIN tạo Product → 201.
- Response User không chứa password.
- Trường roleid trong register → 400; client không tự nâng quyền.

Đọc ví dụ trong API.md để thực hành.

## Bước 5: CRUD Product

Admin tạo, sửa, xóa Product; mọi người có thể đọc danh mục. price dùng chuỗi thập phân, quantity số nguyên không âm.

Kiểm tra: tạo 201, đọc/sửa 200, xóa 204, đọc lại 404. Giá âm, quá hai số thập phân hoặc quantity lẻ → 400. Xóa sản phẩm đã có trong đơn → 409.

## Bước 6: Order và OrderDetail

Khách gửi items [{pid,qty}]. Backend lấy user từ JWT, giá từ DB, kiểm tra tồn, trừ kho và lưu đơn cùng transaction.

Kiểm tra: tổng đúng theo unit_price; sửa Product sau đó không đổi đơn cũ. Thiếu một mặt hàng khiến toàn bộ transaction rollback. User khác đọc đơn → 404. Hai đơn tranh sản phẩm cuối cùng chỉ một đơn thành công.

## Bước 7: MemberShip và Shipment

Admin CRUD hạng thành viên và gán mid cho User; BASIC được bảo vệ. Role cố định để giữ luật phân quyền. Admin tạo vận chuyển từ đơn rồi cập nhật theo trình tự PENDING → SHIPPED → DELIVERED.

Kiểm tra: nhảy thẳng PENDING → DELIVERED trả 409. CUSTOMER không cập nhật shipment. Hạng đang có User không được xóa.

## Bước 8: Docker Compose

```bash
docker compose up -d --build --wait --wait-timeout 180
docker compose ps -a
```

Compose tự chạy postgres rồi migrate, seed và api. Hai job migrate/seed kết thúc Exit 0 là kết quả đúng. Đây là job khởi tạo của monolith, không phải microservices.

Đạt khi postgres/api healthy, migrate/seed Exit 0. Không cần mở database ra Internet; cổng chỉ bind loopback.

## Bước 9: Healthcheck

```bash
curl -i http://localhost:3001/health
curl -i http://localhost:3001/health/live
```

/health chạy SELECT 1 thật, trả 200 khi database kết nối được và 503 nếu không.
/health/live chỉ xác nhận tiến trình HTTP còn hoạt động.

Kiểm tra sự cố (chỉ khi bạn chủ động muốn thử):
```bash
docker compose stop postgres
curl --max-time 10 -i http://localhost:3001/health
docker compose start postgres
```

Mong đợi 503 khi database dừng; khi start trở lại, /health phục hồi 200. Docker đánh dấu unhealthy không tự restart chỉ vì unhealthy; restart policy xử lý tiến trình thoát.

## Bước 10: Chạy test và ghi nhận

```bash
npm test
```

Đạt khi fail 0. Test tự cô lập schema và dọn dữ liệu sau chạy. Đọc KIEM_TRA.md để phân biệt kiểm tra thật với giới hạn chưa triển khai.

Có thể chụp 4 ảnh để báo cáo: migrate status; test summary; compose ps -a; /health 200. Thêm demo đăng nhập/CRUD/đặt hàng khi trình bày.

