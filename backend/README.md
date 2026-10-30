# NestJS Backend - Quản Lý Câu Lạc Bộ Bóng Đá

## Mô tả

Backend NestJS cho hệ thống Quản Lý Câu Lạc Bộ và Lịch Tập Bóng Đá, sử dụng PostgreSQL (Neon) kết nối qua connection string.

## Cấu trúc Module

- **Auth** - Đăng ký / Đăng nhập với JWT
- **Users** - Quản lý người dùng hệ thống
- **Players** - Quản lý cầu thủ
- **Fields** - Quản lý sân bóng
- **Schedules** - Lịch tập & thi đấu
- **Attendances** - Điểm danh buổi tập
- **Matches** - Kết quả trận đấu
- **Clubs** - Thông tin câu lạc bộ
- **Notifications** - Thông báo

## Cài đặt

```bash
npm install
```

## Cấu hình

Sao chép file `.env.example` → `.env` và điền connection string PostgreSQL:

```bash
cp .env.example .env
```

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /api/auth/register | Đăng ký tài khoản |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/clubs | Lấy thông tin CLB |
| PUT | /api/clubs | Cập nhật thông tin CLB |
| GET | /api/players | Lấy danh sách cầu thủ |
| POST | /api/players | Thêm cầu thủ |
| GET | /api/players/:id | Chi tiết cầu thủ |
| PUT | /api/players/:id | Cập nhật cầu thủ |
| DELETE | /api/players/:id | Xóa cầu thủ |
| GET | /api/fields | Lấy danh sách sân |
| POST | /api/fields | Thêm sân |
| PUT | /api/fields/:id | Cập nhật sân |
| DELETE | /api/fields/:id | Xóa sân |
| GET | /api/schedules | Danh sách lịch tập |
| POST | /api/schedules | Tạo lịch tập |
| GET | /api/schedules/:id | Chi tiết lịch tập |
| PUT | /api/schedules/:id | Cập nhật lịch tập |
| DELETE | /api/schedules/:id | Xóa lịch tập |
| GET | /api/attendances | Danh sách điểm danh |
| POST | /api/attendances | Lưu điểm danh |
| GET | /api/matches | Danh sách trận đấu |
| POST | /api/matches | Thêm kết quả trận |
| DELETE | /api/matches/:id | Xóa trận đấu |
| GET | /api/notifications | Lấy thông báo |
| POST | /api/notifications | Tạo thông báo |
| PATCH | /api/notifications | Đánh dấu đã đọc |
| DELETE | /api/notifications | Xóa tất cả thông báo |
| GET | /api/users | Danh sách người dùng |
| POST | /api/users | Tạo người dùng |

