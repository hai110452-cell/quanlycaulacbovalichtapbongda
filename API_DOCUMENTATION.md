# 📖 TÀI LIỆU CHI TIẾT HỆ THỐNG RESTFUL API - CLB SÂN BÓNG C1

Hệ thống Backend được xây dựng bằng **NestJS Framework**, kết nối cơ sở dữ liệu **PostgreSQL (Neon Cloud & Local)**, hỗ trợ đầy đủ các cơ chế bảo mật xác thực **JWT**, phân quyền vai trò **Role-Based Access Control (RBAC)**, bảo vệ endpoint qua **API Key Guard**, và kiểm soát tên miền qua **CORS Whitelisting**.

---

## 🌐 1. Thông Tin Máy Chủ & Cấu Hình

| Thông tin | Môi trường Localhost | Môi trường Cloud / Production |
| :--- | :--- | :--- |
| **Base URL** | `http://localhost:5000/api` | `https://haiandbao.wispybyte.app/api` |
| **Cổng dịch vụ** | `5000` | Port `11569` |
| **Frontend kết nối** | `http://localhost:3000` | `https://wispybyte.app/nguyenminhhai/doan` |
| **API Key mặc định** | `football-c1-secret-api-key-2026` | Cấu hình qua biến môi trường `API_KEY` |

---

## 🔒 2. Cơ Chế Bảo Mật & Xác Thực (Guards & Security)

### 2.1. Xác thực người dùng (JWT Bearer Token)
- Các endpoint yêu cầu xác thực cần gửi kèm Header:
  ```http
  Authorization: Bearer <access_token>
  ```
- Token được cấp tự động sau khi gọi thành công endpoint `POST /api/auth/login`.

### 2.2. Bảo vệ dịch vụ bằng API Key (ApiKeyGuard)
- Cho phép tích hợp hệ thống bên ngoài hoặc xác thực ứng dụng Frontend tin cậy:
  ```http
  x-api-key: football-c1-secret-api-key-2026
  ```

### 2.3. Phân quyền vai trò (RolesGuard - RBAC)
- **Admin (Toàn quyền):** Truy cập, thêm/sửa/xóa mọi bảng trong hệ thống.
- **Coach (Huấn luyện viên):** Quản lý lịch tập (`/schedules`), điểm danh (`/attendances`), kết quả trận đấu (`/matches`).
- **Player (Cầu thủ / Khách hàng):** Tra cứu thông tin cá nhân, xem lịch thi đấu và đặt sân trực tuyến (`/field-bookings`).

### 2.4. Giới hạn tên miền truy cập (CORS Whitelisting)
Hệ thống chặn các yêu cầu không rõ nguồn gốc thông qua Whitelist cấu hình tại `main.ts`:
- `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`
- Domain hệ thống: `https://wispybyte.app`, `https://haiandbao.wispybyte.app`

---

## 📋 3. Danh Mục Các Endpoints Chi Tiết

### 🔑 Module 1: Xác Thực (Auth)
#### `POST /api/auth/login` - Đăng nhập hệ thống
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response 200 (Thành công):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Chủ Sân C1 (Toàn Quyền)",
      "role": "Admin",
      "phone": "0983830955"
    }
  }
  ```

#### `POST /api/auth/register` - Đăng ký tài khoản mới
- **Request Body:**
  ```json
  {
    "username": "cauthu01",
    "password": "password123",
    "fullName": "Nguyễn Văn A",
    "phone": "0912345678",
    "role": "Player"
  }
  ```

---

### 🏃 Module 2: Quản Lý Cầu Thủ (Players)
- `GET /api/players` : Lấy danh sách toàn bộ cầu thủ trong các đội.
- `GET /api/players/:id` : Lấy thông tin chi tiết của 1 cầu thủ theo ID.
- `POST /api/players` : Thêm mới cầu thủ (Yêu cầu `Authorization` & `Roles: Admin, Coach`).
  ```json
  {
    "name": "Đoàn Văn Hậu",
    "jerseyNumber": 5,
    "position": "Hậu vệ",
    "teamId": "team-1",
    "phone": "0923456789",
    "dateOfBirth": "1999-04-19",
    "height": "1m86",
    "weight": "80kg",
    "preferredFoot": "Chân trái"
  }
  ```
- `PUT /api/players/:id` : Cập nhật thông tin cầu thủ.
- `DELETE /api/players/:id` : Xóa cầu thủ khỏi danh sách.

---

### 📅 Module 3: Lịch Tập Luyện & Thi Đấu (Schedules)
- `GET /api/schedules` : Tra cứu thời gian biểu lịch tập của các đội bóng.
- `POST /api/schedules` : Tạo mới lịch huấn luyện (Tự động kiểm tra xung đột trùng giờ, trùng sân).
  ```json
  {
    "date": "2026-11-08",
    "time": "17:30 - 19:30",
    "field": "Sân bóng C1 (Sân 1)",
    "type": "Tập chiến thuật",
    "teamId": "team-1",
    "coach": "HLV. Nguyễn Văn Huấn"
  }
  ```
- `PUT /api/schedules/:id` : Thay đổi khung giờ, sân tập hoặc nội dung buổi tập.
- `DELETE /api/schedules/:id` : Hủy lịch tập (Tự động phát thông báo tới các thành viên).

---

### 📝 Module 4: Điểm Danh & Chuyên Cần (Attendances)
- `GET /api/attendances` : Lấy lịch sử điểm danh theo buổi tập hoặc theo cầu thủ.
- `POST /api/attendances` : Lưu kết quả điểm danh buổi tập.
  ```json
  {
    "playerId": 3,
    "scheduleId": 1,
    "status": "Có mặt",
    "note": "Khởi động tích cực"
  }
  ```

---

### 🏟️ Module 5: Sân Bóng & Đặt Sân Online (Fields & Field Bookings)
- `GET /api/fields` : Danh sách sân bóng, cơ sở vật chất, bảng giá niêm yết.
- `GET /api/field-bookings` : Danh sách các ca đã được giữ chỗ / đặt cọc online.
- `POST /api/field-bookings` : Khách hàng đặt chỗ trực tuyến nhận mã biên lai tức thì.
  ```json
  {
    "customerName": "Nguyễn Minh Hải",
    "customerPhone": "0983830955",
    "fieldId": "field-c1",
    "bookingDate": "2026-11-05",
    "slotTime": "19:00 - 20:30",
    "totalAmount": 450000,
    "deposit": 150000,
    "services": ["Bóng thi đấu FIFA", "Áo bib phân đội"],
    "status": "Đã duyệt"
  }
  ```
- `PATCH /api/field-bookings/:id/status` : Ban quản lý sân duyệt / hủy hoặc hoàn cọc cho ca đặt.

---

### 🏆 Module 6: Quản Lý Trận Đấu (Matches)
- `GET /api/matches` : Lấy lịch sử kết quả các trận giao hữu và giải đấu.
- `POST /api/matches` : Lưu tỷ số, danh sách cầu thủ ghi bàn, danh hiệu MVP trận đấu.

---

## 🛠️ 4. Hướng Dẫn Kiểm Thử Bằng Postman
1. Mở phần mềm **Postman**.
2. Nhấn nút **Import** ở góc trên bên trái.
3. Chọn file **`CLB_BongDa_API.postman_collection.json`** trong thư mục dự án.
4. Chọn Collection và chạy thử nghiệm các API:
   - Bước 1: Chạy `POST /auth/login` để lấy `access_token`.
   - Bước 2: Token sẽ được dùng để gọi các API CRUD có bảo mật.

