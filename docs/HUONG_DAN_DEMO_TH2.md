# 📘 HƯỚNG DẪN DEMO VẤN ĐÁP THỰC HÀNH 2 (8/8 ĐIỂM)
**Học phần:** Lập trình hướng dịch vụ (LTHDV / MSA)  
**Kiến trúc:** Monolithic Architecture (Node.js Express + Prisma ORM + PostgreSQL + Docker Compose)  
**Dự án:** `ecommerce-monolith`  
**Tài liệu tham chiếu:** [PHIEU_CHAM.pdf](./PHIEU_CHAM.pdf) — Bảng chấm thực hành 2 (8 mục / 8.0 Điểm tối đa)  
**Môi trường thực hiện:** Windows Command Prompt (`cmd.exe`) hoặc VS Code Terminal (CMD)

---

## ⚡ KỊCH BẢN THỰC HIỆN TUẦN TỰ 8 CÂU (CHUẨN TỪNG BƯỚC THỰC HÀNH)

> **Chuẩn bị trước khi vào chấm:**
> 1. Mở sẵn 3 cửa sổ trên màn hình:
>    - Nửa bên trái: **VS Code** (mở sẵn file `prisma/schema.prisma` và mở Terminal CMD bên dưới).
>    - Góc trên bên phải: **Trình duyệt Web** (mở sẵn GitHub repository ở file `.gitignore`).
>    - Góc dưới bên phải: **Postman** (mở sẵn thư mục request `Bài 2 Ecommerce Monolith`).
> 2. Hệ thống Docker đã bật sẵn: `docker compose up -d`.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [00s - 08s] BƯỚC 1, 2, 3: GIẢI THÍCH MÃ NGUỒN & THIẾT KẾ                                         │
│  - Câu 1: Chỉ cây thư mục src/ (routes, controllers, middlewares) trong VS Code:                 │
│    "Dự án Monolith phân tầng rõ ràng, toàn bộ module gom trong 1 process Express & 1 DB Postgres."│
│  - Câu 2: Chỉ GitHub repo:                                                                       │
│    "File .gitignore chặn toàn bộ .env, trên GitHub em chỉ commit file mẫu .env.example."         │
│  - Câu 3: Mở schema.prisma và hàm createOrder trong order.controller.js:                         │
│    "Prisma định nghĩa đủ 7 bảng, bảng OrderDetail dùng khóa kép @@id([oid, pid]),                │
│     luồng đặt hàng dùng Serializable transaction để đảm bảo toàn vẹn ACID."                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [08s - 18s] BƯỚC 4, 5: THAO TÁC TERMINAL CMD & POSTGRESQL                                        │
│  - Câu 4: Trong CMD gõ lần lượt 2 lệnh riêng biệt:                                               │
│    1. docker compose ps                                                                          │
│    2. curl http://localhost:3001/health                                                          │
│    -> (Thấy 2 container Up healthy và JSON database: connected).                                 │
│  - Câu 5: Truy cập container PostgreSQL tạo SP X, Y:                                             │
│    1. docker exec -it ecommerce-postgres psql -U ecommerce -d ecommerce                         │
│    2. \dt                                                                                        │
│    3. INSERT INTO "Product" (pname, price, quantity) VALUES ('X', 100, 50), ('Y', 200, 50);     │
│    4. SELECT * FROM "Product";                                                                   │
│    -> (Thấy đủ 7 bảng \dt và bảng Product có 2 sản phẩm X: 50, Y: 50!).                          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [18s - 24s] BƯỚC 6, 7: THAO TÁC TRÊN POSTMAN                                                     │
│  - Câu 6:                                                                                        │
│    + Bấm Send 'Register Customer' -> Thấy role: normal, score: 10.                               │
│    + Bấm Send 'Login Customer' -> Nhận về chuỗi accessToken.                                     │
│  - Câu 7:                                                                                        │
│    + Bấm Send 'Order Without Token' -> Thấy lỗi 401 Unauthorized (chứng minh bảo mật).           │
│    + Bấm Send 'Order With Token' (mua X: 2, Y: 5) -> Nhận 201 Created, tự sinh Shipment PENDING. │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [24s - 30s] BƯỚC 8: KIỂM TRA ĐỐI CHIẾU DỮ LIỆU CUỐI CÙNG                                         │
│  - Câu 8: Trong cửa sổ psql gõ lần lượt 4 lệnh:                                                  │
│    1. SELECT * FROM "Product";                                                                   │
│    2. SELECT * FROM "Order";                                                                     │
│    3. SELECT * FROM "OrderDetail";                                                               │
│    4. SELECT * FROM "Shipment";                                                                  │
│    5. \q                                                                                         │
│    -> (Thấy Product: X giảm còn 48, Y giảm còn 45; Order, OrderDetail và Shipment đầy đủ!).      │
│    "Thưa thầy, dữ liệu đã cập nhật chuẩn xác: kho trừ đúng, đơn hàng và giao hàng đã lưu."       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 HƯỚNG DẪN CHI TIẾT LẦN LƯỢT TỪ CÂU 1 ĐẾN CÂU 8

---

### 1️⃣ CÂU 1: Giải thích cấu trúc project đạt chuẩn Monolithic (1.0 Điểm)
* **Thao tác:** Trên VS Code, mở rộng cây thư mục `src/`.
* **Nội dung giải thích:**
  - Cấu trúc mã nguồn phân tầng rõ ràng:
    + `routes/`: Định tuyến các endpoint theo từng phân hệ (`auth`, `user`, `product`, `order`, `shipment`, `membership`, `health`).
    + `controllers/`: Xử lý logic nghiệp vụ và truy vấn dữ liệu.
    + `middlewares/`: Kiểm tra xác thực Bearer token JWT (`auth.middleware.js`) và bắt lỗi tập trung (`error.middleware.js`).
    + `validators/`: Chuẩn hóa dữ liệu đầu vào bằng thư viện Zod.
  - Toàn bộ các phân hệ nằm chung trong **1 ứng dụng Express duy nhất** ([src/app.js](file:///c:/Users/admin/OneDrive/Minecraft/Microsoft%20%28P,W,X%29/SEM%201%20-%20YEAR%204/LTHDV/ecommerce-monolith/src/app.js)), giao tiếp qua hàm nội bộ (in-process call), không tách mạng, và chia sẻ chung **1 cơ sở dữ liệu PostgreSQL** (`ecommerce`).
* **Mẫu câu trả lời:**
  > *"Dạ thưa thầy, dự án xây dựng chuẩn mô hình Monolithic theo cấu trúc phân tầng rõ ràng: thư mục `routes/` định tuyến API, `controllers/` xử lý nghiệp vụ, `middlewares/` đảm nhiệm xác thực bảo mật và `validators/` kiểm soát schema. Toàn bộ các phân hệ Auth, User, Product, Order và Shipment đều chạy chung trong một tiến trình Express duy nhất và chia sẻ chung một cơ sở dữ liệu PostgreSQL."*

---

### 2️⃣ CÂU 2: Giải thích `.gitignore` và `.env` trên GitHub (1.0 Điểm)
* **Thao tác:** Mở trình duyệt web xem GitHub repository của dự án.
* **Nội dung giải thích:**
  - File `.gitignore` chặn các file `.env`, `.env.*` để tránh lộ mật khẩu PostgreSQL và `JWT_SECRET`.
  - Ngoại lệ `!.env.example` cho phép đẩy file mẫu lên làm chuẩn cấu hình.
* **Lệnh kiểm tra tại máy local qua CMD (nếu thầy yêu cầu):**
  ```cmd
  type .gitignore
  ```
* **Mẫu câu trả lời:**
  > *"Dạ thưa thầy, trên repository GitHub em đã cấu hình `.gitignore` chặn toàn bộ file `.env` chứa mật khẩu kết nối database PostgreSQL và JWT_SECRET. Em chỉ commit file `.env.example` làm mẫu cấu hình để bảo đảm an toàn bảo mật."*

---

### 3️⃣ CÂU 3: Giải thích mã nguồn Prisma ORM (1.0 Điểm)
* **Thao tác:** Trên VS Code, mở file `prisma/schema.prisma` và đoạn transaction trong `src/controllers/order.controller.js` (hàm `createOrder`).
* **Nội dung giải thích:**
  - Định nghĩa đủ **7 model quan hệ**: `Role`, `MemberShip`, `User`, `Product`, `Order`, `OrderDetail`, `Shipment`.
  - Bảng trung gian `OrderDetail` dùng **khóa chính kép**: `@@id([oid, pid])`.
  - Luồng tạo đơn dùng `prisma.$transaction(..., { isolationLevel: 'Serializable' })` đảm bảo toàn vẹn ACID, trừ tồn kho an toàn và không bị mua âm khi nhiều người đặt cùng lúc.
* **Mẫu câu trả lời:**
  > *"Prisma ORM định nghĩa đầy đủ 7 bảng quan hệ chuẩn theo thiết kế. Bảng chi tiết đơn OrderDetail sử dụng khóa chính kết hợp @@id([oid, pid]). Khi tạo đơn hàng trong order.controller.js, hệ thống sử dụng prisma.$transaction ở mức cô lập Serializable để đảm bảo toàn vẹn dữ liệu và tránh tranh chấp kho."*

---

### 4️⃣ CÂU 4: CLI: Compose hệ thống, system health check và liệt kê container (1.0 Điểm)
* **Lệnh 1 — Xem danh sách container đang chạy:**
  ```cmd
  docker compose ps
  ```
  *(Kết quả: Thấy 2 container `ecommerce-api` và `ecommerce-postgres` đều ở trạng thái **`Up (healthy)`**)*.

* **Lệnh 2 — Kiểm tra trạng thái sức khỏe (Healthcheck):**
  ```cmd
  curl http://localhost:3001/health
  ```
  *(Kết quả: Trả về JSON `{"status":"healthy","database":"connected"}`)*.

* **💡 Liên kết kiến thức với Bài 1 & Bài 3:**
  - **Với Bài 1 (Product API):** Bài 1 chỉ là 1 container/service đơn lẻ kết nối MongoDB.
  - **Với Bài 3 (Microservices):** Bài 2 Monolith chỉ có **2 container** (1 API + 1 PostgreSQL chung). Khi sang Bài 3, hệ thống sẽ mở rộng thành **13 container** (gồm 6 microservices, 5 database riêng theo mô hình Database-per-Service, Kafka, Zookeeper, Redis).

* **Mẫu câu trả lời:**
  > *"Lệnh `docker compose ps` hiển thị đầy đủ 2 container `ecommerce-api` và `ecommerce-postgres` đều đạt trạng thái Healthy. Endpoint `/health` thực hiện truy vấn `SELECT 1` thật tới PostgreSQL và trả về HTTP 200 `database: connected`."*

---

### 5️⃣ CÂU 5: PostgreSQL CLI: Kiểm tra các bảng dữ liệu & Tạo mới 2 SP X, Y (1.0 Điểm)
* **Yêu cầu phiếu chấm:** *"Truy cập container PostgreSQL kiểm tra các bảng dữ liệu đầy đủ theo thiết kế. Tạo mới 2 sản phẩm X, Y bằng CLI"*.

* **Bước 1 — Mở Terminal CMD, truy cập vào PostgreSQL container:**
  ```cmd
  docker exec -it ecommerce-postgres psql -U ecommerce -d ecommerce
  ```

* **Bước 2 — Liệt kê 7 bảng theo thiết kế:**
  ```sql
  \dt
  ```
  *(Màn hình in ra đủ 7 bảng: Role, MemberShip, User, Product, Order, OrderDetail, Shipment)*.

* **Bước 3 — Tạo mới 2 sản phẩm X (SL: 50, giá: 100) và Y (SL: 50, giá: 200):**
  ```sql
  INSERT INTO "Product" (pname, price, quantity) VALUES ('X', 100, 50), ('Y', 200, 50);
  ```
  *(⚠️ Chú ý: Bắt buộc để `"Product"` trong dấu ngoặc kép vì Prisma viết hoa chữ P)*.

* **Bước 4 — Kiểm tra lại 2 sản phẩm vừa tạo:**
  ```sql
  SELECT * FROM "Product";
  ```
  *(Thấy rõ X và Y có số lượng ban đầu là 50)*.
  *(💡 Mẹo: Giữ nguyên cửa sổ psql này để làm tiếp Câu 8, không cần thoát ra)*.

* **💡 Liên kết kiến thức với Bài 1 & Bài 3:**
  - **Với Bài 1:** Bài 1 lưu Product vào MongoDB (NoSQL) qua API REST (`POST /products`). Ở Bài 2 Monolith, Product nằm trong bảng quan hệ PostgreSQL và liên kết trực tiếp với `OrderDetail`.
  - **Với Bài 3:** Ở Bài 3, Product được tách thành `product-service` độc lập với database riêng (dùng MongoDB giống Bài 1), còn Order dùng PostgreSQL và gọi sang Product qua gRPC.

* **Mẫu câu trả lời:**
  > *"Em truy cập vào container PostgreSQL bằng psql, dùng lệnh `\dt` kiểm tra đủ 7 bảng theo thiết kế và chạy lệnh `INSERT` tạo mới 2 sản phẩm X và Y với số lượng ban đầu mỗi loại là 50."*

---

### 6️⃣ CÂU 6: POSTMAN: Thực hiện luồng Đăng ký (Role normal, Score 10) &rarr; Đăng nhập &rarr; Hiển thị token (1.0 Điểm)
* **Màn hình:** Ứng dụng Postman (Mở thư mục `Bài 2 Ecommerce Monolith`).
* **Thao tác:**
  1. **Đăng ký tài khoản:** Mở request `Register Customer` &rarr; Bấm **Send**.
     - URL: `POST http://localhost:3001/api/auth/register`
     - Body: `{"username":"khach01","fullname":"Nguyen Van A","password":"MatKhauDemo123!"}`
     - Kết quả nhận về mã `201 Created` &rarr; Chỉ vào màn hình: `"rolename": "normal"` và `"score": 10`.
  2. **Đăng nhập tài khoản:** Mở request `Login Customer` &rarr; Bấm **Send**.
     - URL: `POST http://localhost:3001/api/auth/login`
     - Body: `{"username":"khach01","password":"MatKhauDemo123!"}`
     - Kết quả nhận về chuỗi `accessToken` (JWT Bearer Token). Postman đã tự động lưu token này vào biến `{{token}}`.
* **Mẫu câu trả lời:**
  > *"Em gửi request đăng ký tài khoản mới; hệ thống tự động gán vai trò `normal` và hạng thành viên có `score: 10`. Khi đăng nhập bằng tài khoản vừa tạo, API xác thực mật khẩu qua bcrypt và trả về chuỗi JWT accessToken."*

---

### 7️⃣ CÂU 7: POSTMAN: Thực hiện luồng Đặt hàng (X: 2, Y: 5) &rarr; Detail &rarr; Shipment (1.0 Điểm)
* **Màn hình:** Ứng dụng Postman.
* **Thao tác:**
  1. **Thử đặt hàng không Token:** Mở request `Order Without Token` &rarr; Bấm **Send**.
     - Kết quả: Báo lỗi **`401 Unauthorized`** (chứng minh chặn bảo mật khi thiếu token).
  2. **Đặt hàng có Token:** Mở request `Order With Token` (mua X: 2, Y: 5) &rarr; Bấm **Send**.
     - Header: Đã có sẵn `Authorization: Bearer {{token}}`.
     - Body: `{"items":[{"pid":1,"qty":2},{"pid":2,"qty":5}]}`.
     - **Kết quả trả về mã `201 Created`:**
       + Thời gian tạo đơn lấy thời gian hiện hành (`createat`).
       + Chi tiết đơn: Mua 2 sản phẩm X và 5 sản phẩm Y.
       + Tự động sinh vận chuyển: Trả về mảng `shipments: [{"status":"PENDING"}]`.
  3. **Xem chi tiết đơn:** Mở request `View Order Detail` &rarr; Bấm **Send** &rarr; Xem thông tin chi tiết đơn và tổng tiền.
* **Mẫu câu trả lời:**
  > *"Khi đặt hàng không có token, API từ chối với mã 401 Unauthorized. Khi có token hợp lệ, hệ thống tiến hành trừ kho mua 2 sản phẩm X và 5 sản phẩm Y, lưu thời gian tạo đơn hiện hành và tự động khởi tạo bản ghi Shipment trạng thái PENDING."*

---

### 8️⃣ CÂU 8: CLI: Truy cập Postgres Container kiểm tra dữ liệu 4 bảng đã cập nhật đúng (1.0 Điểm)
* **Yêu cầu phiếu chấm:** *"CLI: Truy cập Postgres Container kiểm tra dữ liệu bảng Order, OrderDetail và Product (quantity), Shipment đã được cập nhật dữ liệu đúng"*.

* **Thao tác:** Trong cửa sổ `psql` (nếu đã lỡ thoát thì gõ `docker exec -it ecommerce-postgres psql -U ecommerce -d ecommerce`), bạn gõ lần lượt 4 câu lệnh SELECT:

  - **Lệnh 1 — Xem kho hàng (Product) đã trừ đúng:**
    ```sql
    SELECT * FROM "Product";
    ```
    *(Chỉ vào màn hình: Sản phẩm X ban đầu 50 giảm 2 **còn 48**; sản phẩm Y ban đầu 50 giảm 5 **còn 45**)*.

  - **Lệnh 2 — Xem đơn hàng vừa tạo (Order):**
    ```sql
    SELECT * FROM "Order";
    ```
    *(Ghi nhận đơn hàng mới `oid: 1` với thời gian tạo `createat` chuẩn xác)*.

  - **Lệnh 3 — Xem chi tiết đơn hàng (OrderDetail):**
    ```sql
    SELECT * FROM "OrderDetail";
    ```
    *(Có 2 bản ghi mua X số lượng 2 và Y số lượng 5, giá lưu snapshot)*.

  - **Lệnh 4 — Xem bản ghi vận chuyển (Shipment):**
    ```sql
    SELECT * FROM "Shipment";
    ```
    *(Có bản ghi giao hàng tự động sinh với trạng thái `PENDING`)*.

  - **Thoát psql:**
    ```sql
    \q
    ```

* **💡 Liên kết kiến thức với Bài 1 & Bài 3:**
  - **Với Bài 1:** Bài 1 chỉ có API quản lý Product độc lập, chưa có quy trình xử lý đơn hàng hay vận chuyển.
  - **Với Bài 3:** Ở Bài 2 Monolith, toàn bộ quá trình trừ kho Product, tạo Order và tạo Shipment nằm chung trong 1 transaction PostgreSQL (ACID). Còn ở Bài 3 Microservices, Order Service trừ kho Product Service qua gRPC và phát sự kiện Kafka `order-created` sang Shipment Service xử lý bất đồng bộ.

* **Mẫu câu trả lời:**
  > *"Em dùng CLI truy vấn trực tiếp 4 bảng trong PostgreSQL: Bảng Order và OrderDetail ghi nhận đúng thông tin đơn hàng, kho sản phẩm đã được trừ chính xác (X còn 48, Y còn 45), và bảng Shipment đã sinh bản ghi giao hàng PENDING tương ứng."*

---

## 🧹 DỌN DẸP & RESET DỮ LIỆU SAU KHI TEST ĐỂ LUYỆN TẬP LẠI (PRACTICE LOOP)

Sau khi demo xong, để có thể luyện tập lại từ đầu mà không bị lỗi trùng username hay tồn kho bị lệch:

1. **Cách 1 (Nhanh nhất):** Nhấp đúp chuột vào file **`reset_test_data.bat`** (hoặc trong CMD gõ `reset_test_data`).
2. **Cách 2 (Lệnh SQL trực tiếp):**
   ```cmd
   docker exec -it ecommerce-postgres psql -U ecommerce -d ecommerce -c "DELETE FROM \"Shipment\"; DELETE FROM \"OrderDetail\"; DELETE FROM \"Order\"; DELETE FROM \"Product\" WHERE pname IN ('X', 'Y'); DELETE FROM \"User\" WHERE username IN ('khach01', 'demo_user');"
   ```
3. **Cách 3 (Reset xuất xưởng toàn bộ container & volume):**
   ```cmd
   docker compose down -v
   docker compose up -d
   ```

---

## 🔄 BẢNG TỔNG HỢP CÂU LỆNH RÕ RÀNG CHO CẢ 8 CÂU (KHÔNG GHI TẮT)

| Bước | Lệnh Terminal / Thao tác | Kết quả mong đợi |
| :---: | :--- | :--- |
| **Câu 1** | VS Code mở cây thư mục `src/` | Giới thiệu `routes/`, `controllers/`, `middlewares/`, `validators/` chạy chung 1 tiến trình Express & 1 DB |
| **Câu 2** | Trình duyệt GitHub &bull; CMD: `type .gitignore` | Chứng minh chặn `.env`, chỉ đẩy `.env.example` |
| **Câu 3** | VS Code mở `prisma/schema.prisma` và `src/controllers/order.controller.js` | Giải thích 7 bảng, khóa kép `@@id([oid,pid])` và transaction Serializable |
| **Câu 4** | Lệnh 1: `docker compose ps`<br>Lệnh 2: `curl http://localhost:3001/health` | 2 container Up Healthy & HTTP 200 `database: connected` *(So với Bài 3: Bài 3 có đủ 13 container)* |
| **Câu 5** | 1. `docker exec -it ecommerce-postgres psql -U ecommerce -d ecommerce`<br>2. `\dt`<br>3. `INSERT INTO "Product" (pname, price, quantity) VALUES ('X', 100, 50), ('Y', 200, 50);`<br>4. `SELECT * FROM "Product";` | Thấy đủ 7 bảng quan hệ và chèn 2 SP X, Y có SL ban đầu 50 *(So với Bài 1: Bài 1 dùng MongoDB)* |
| **Câu 6** | Postman: Bấm Send `Register Customer` rồi Send `Login Customer` | Role: `normal`, Score: `10` & Lấy JWT `accessToken` |
| **Câu 7** | Postman: Bấm Send `Order Without Token` rồi Send `Order With Token` | Không token lỗi `401`; có token tạo đơn (mua X: 2, Y: 5) & tự sinh `Shipment PENDING` |
| **Câu 8** | Trong `psql` gõ lần lượt:<br>1. `SELECT * FROM "Product";`<br>2. `SELECT * FROM "Order";`<br>3. `SELECT * FROM "OrderDetail";`<br>4. `SELECT * FROM "Shipment";`<br>5. `\q` | Đối chiếu kho đã trừ: **X còn 48, Y còn 45**; Order, OrderDetail và Shipment đầy đủ *(So với Bài 3: Bài 3 dùng Kafka)* |
| **Reset** | Chạy `reset_test_data.bat` | Dọn sạch đơn hàng và user test để luyện tập lại từ đầu |
