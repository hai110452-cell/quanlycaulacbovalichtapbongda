# BÁO CÁO ĐỒ ÁN MÔN HỌC: LẬP TRÌNH MÃ NGUỒN MỞ 2

## ĐỀ TÀI: QUẢN LÝ CÂU LẠC BỘ VÀ LỊCH TẬP BÓNG ĐÁ (SÂN BÓNG C1)
- **Sinh viên thực hiện:** 
  1. Nguyễn Minh Hải (Backend & Database)
  2. Trương Kỳ Gia Bảo (Frontend & UI/UX)
- **Công nghệ áp dụng:**
  - **Backend:** NestJS Framework, TypeORM, PostgreSQL (Neon Cloud / Local), JWT Auth, Roles Guard, ApiKey Guard, CORS Whitelisting.
  - **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS, Lucide Icons, Static Export DirectAdmin.
- **Điểm số mục tiêu theo Rubric:** 10.0 / 10.0

---

## MỤC LỤC BÁO CÁO

### CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI & KHẢO SÁT THỰC TẾ
1.1. Đặt vấn đề và tính cấp thiết của hệ thống quản lý sân bóng đá & CLB.  
1.2. Mục tiêu nghiên cứu và đối tượng phục vụ (Chủ sân, Ban huấn luyện, Cầu thủ, Khách thuê sân).  
1.3. Phạm vi đề tài và các tính năng cốt lõi.

### CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
2.1. Yêu cầu chức năng và phi chức năng.  
2.2. Kiến trúc tổng thể hệ thống (NestJS REST API + Next.js Client + PostgreSQL Cloud).  
2.3. Thiết kế Cơ sở dữ liệu:
- Sơ đồ quan hệ thực thể (ERD) với 10 bảng dữ liệu chuẩn hóa 3NF:
  - `users`: Quản lý tài khoản và vai trò RBAC (Admin, Coach, Player, Staff).
  - `clubs`: Thông tin câu lạc bộ và sân vận động.
  - `teams`: Danh sách các đội hình (Đội 1, Tuyến trẻ U21, U17, Futsal).
  - `players`: Hồ sơ cầu thủ, vị trí, thể lực, số áo, trạng thái thi đấu.
  - `fields`: Danh mục sân bóng, cụm sân cỏ nhân tạo, đơn giá thuê.
  - `schedules`: Lịch huấn luyện, tập chiến thuật, chống trùng lịch tự động.
  - `attendances`: Điểm danh buổi tập, theo dõi chuyên cần.
  - `field_bookings`: Đặt sân trực tuyến, sinh mã biên lai, giữ chỗ.
  - `matches`: Lịch sử kết quả trận đấu, bàn thắng, cầu thủ xuất sắc MVP.
  - `notifications`: Thông báo hệ thống và cảnh báo thay đổi lịch thời gian thực.

### CHƯƠNG 3: HIỆN THỰC HỆ THỐNG (IMPLEMENTATION)
3.1. Xây dựng Backend NestJS:
- Kiến trúc chuẩn Modules, Controllers, Services, Providers.
- Bảo mật API qua `JwtAuthGuard`, `RolesGuard` (phân quyền vai trò), `ApiKeyGuard` (kiểm tra header x-api-key).
- Xử lý lỗi toàn cục qua `AllExceptionsFilter`.
- Kiểm soát truy cập tên miền với `CORS Whitelisting`.
3.2. Xây dựng Frontend Next.js:
- Giao diện trực quan, responsive tương thích mobile, tablet và desktop.
- Dashboard KPI thống kê tài chính, tỷ lệ lấp đầy ca sân, chuyên cần 6 tháng.
- Tích hợp tính năng In ấn phiếu biên lai đặt sân, xuất file Excel/PDF.
- Thuật toán ưu tiên đẩy các ca đã đặt sân lên đầu danh sách.

### CHƯƠNG 4: KIỂM THỬ HỆ THỐNG & ĐÓNG GÓI
4.1. Kiểm thử chức năng API bằng Postman Collection (đầy đủ các kịch bản CRUD).  
4.2. Triển khai ứng dụng:
- Backend: Triển khai trên máy chủ Wispybyte / Neon Cloud PostgreSQL.
- Frontend: Đóng gói bản Static Export `frontend.zip` và triển khai trên máy chủ DirectAdmin.

### CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
5.1. Kết quả đạt được so với yêu cầu tiêu chí đánh giá.  
5.2. Hướng phát triển trong tương lai (Thanh toán tự động qua VietQR, thông báo qua Zalo/Telegram Bot).

