# REST API MVP

Base URL: http://localhost:3001

Có thể import postman_collection.json cùng thư mục vào Postman. Điền collection variable adminPassword từ .env, rồi chạy Login admin / Register customer / Login customer. Request đăng nhập tự lưu token; Create product/order/shipment tự lưu ID. Không chia sẻ bản export có token hoặc mật khẩu thật.

Header cho route bảo vệ:
```text
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Token lấy từ POST /api/auth/login; hết hạn sau JWT_EXPIRES_IN. Không có refresh token trong MVP.

## Endpoint

| Method | URL | Quyền | Body/chức năng |
|---|---|---|---|
| GET | /health | Public | Kiểm tra database |
| GET | /health/live | Public | Kiểm tra HTTP |
| POST | /api/auth/register | Public | username, fullname, password |
| POST | /api/auth/login | Public | username, password |
| GET | /api/users/me | Đăng nhập | Hồ sơ không có password |
| PATCH | /api/users/me | Đăng nhập | fullname |
| GET | /api/users | ADMIN | Danh sách user |
| PATCH | /api/users/:uid | ADMIN | roleid và/hoặc mid |
| GET | /api/roles | ADMIN | Các quyền hệ thống |
| GET | /api/memberships | Đăng nhập | Danh sách hạng |
| POST | /api/memberships | ADMIN | mname, score |
| PUT | /api/memberships/:mid | ADMIN | mname, score |
| DELETE | /api/memberships/:mid | ADMIN | Xóa hạng chưa dùng, trừ BASIC |
| GET | /api/products | Public | Danh mục |
| GET | /api/products/:pid | Public | Chi tiết |
| POST | /api/products | ADMIN | pname, price, quantity |
| PUT | /api/products/:pid | ADMIN | pname, price, quantity |
| DELETE | /api/products/:pid | ADMIN | Chưa có trong đơn |
| POST | /api/orders | Đăng nhập | items: [{pid,qty}] |
| GET | /api/orders | Đăng nhập | Khách: đơn của mình; admin: tất cả |
| GET | /api/orders/:oid | Chủ đơn/ADMIN | Chi tiết và tổng tiền |
| GET | /api/orders/:oid/shipments | Chủ đơn/ADMIN | Các shipment của đơn |
| POST | /api/orders/:oid/shipments | Chủ đơn/ADMIN | {} tạo PENDING |
| PATCH | /api/shipments/:shipid | ADMIN | status |

Danh sách user/membership/product/order nhận ?page=1&limit=20, limit tối đa 100.
Body strict: thuộc tính ngoài quy định bị từ chối.
Các ID là số nguyên dương do database sinh.
price và unit_price là chuỗi decimal; price tối đa 99999999.99.
qty phải lớn hơn 0; quantity và score không âm.
username: 3–50 ký tự chữ/số/gạch dưới, phân biệt hoa thường.
Password đăng ký: ít nhất 12 ký tự, tối đa 72 byte.
Auth endpoint giới hạn 30 request/15 phút/IP cho MVP.

## Ví dụ thực hành bằng Postman hoặc REST client

1. POST http://localhost:3001/api/auth/register:
```json
{"username":"khach01","fullname":"Nguyễn Văn A","password":"MatKhauDemo123!"}
```

2. POST /api/auth/login với tài khoản vừa đăng ký; lưu accessToken của khách.
3. Đăng nhập admin bằng ADMIN_USERNAME / ADMIN_PASSWORD trong .env, lưu token admin riêng.
4. POST /api/products bằng token admin:
```json
{"pname":"Bàn phím","price":"350000.00","quantity":10}
```

5. Lấy pid từ response. POST /api/orders bằng token khách:
```json
{"items":[{"pid":1,"qty":2}]}
```

Thay 1 bằng pid thực tế. Không gửi uid, unit_price hoặc total; backend tự xác định.
6. GET /api/orders/:oid bằng token khách: đơn có total "700000.00", Product còn 8.
7. POST /api/orders/:oid/shipments bằng token admin, body {}.
8. PATCH /api/shipments/:shipid lần lượt {"status":"SHIPPED"} rồi {"status":"DELIVERED"}.

Lỗi chuẩn: {"error":"..."}; validation kèm details.
- 400: đầu vào sai.
- 401: thiếu/sai/hết hạn JWT hoặc đăng nhập sai.
- 403: không đủ quyền.
- 404: dữ liệu không tồn tại hoặc đơn thuộc người khác.
- 409: trùng unique, thiếu tồn, tranh chấp transaction, khóa ngoại, chuyển trạng thái sai.
- 429: vượt giới hạn đăng ký/đăng nhập.
- 503: database chưa sẵn sàng hoặc chưa seed dữ liệu nền.

Không dùng xóa đơn để demo DELETE; hãy tạo Product chưa được đặt rồi xóa.
