# HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI HỆ THỐNG TỪ A - Z

## PHẦN A: CHẠY HỆ THỐNG TRÊN MÁY TÍNH CÁ NHÂN (LOCALHOST)

### 1. Yêu cầu môi trường
- Node.js phiên bản >= 18.x
- NPM hoặc Yarn / PNPM
- PostgreSQL hoặc sử dụng trực tiếp kết nối Cloud có sẵn trong `.env`

### 2. Cài đặt và khởi chạy Backend (NestJS - Port 5000)
```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Tạo dữ liệu mẫu khởi tạo (Seed Data)
npm run seed

# 4. Khởi chạy Backend ở chế độ phát triển
npm run start:dev
```
Máy chủ API NestJS sẽ chạy tại: **http://localhost:5000/api**

### 3. Cài đặt và khởi chạy Frontend (Next.js - Port 3000)
```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install

# 3. Khởi chạy Frontend
npm run dev
```
Trang web người dùng sẽ chạy tại: **http://localhost:3000**

---

## PHẦN B: TRIỂN KHAI LÊN HOSTING DIRECTADMIN

### 1. Đóng gói mã nguồn Frontend
Dự án đã có sẵn script PowerShell tự động build và đóng gói file zip chuẩn cấu trúc:
```bash
powershell -ExecutionPolicy Bypass -File scripts\pack-for-directadmin.ps1
```
Kết quả tạo ra file `frontend.zip` (dung lượng ~ 1.7 MB).

### 2. Tải lên và giải nén trên DirectAdmin
1. Đăng nhập vào bảng điều khiển **DirectAdmin**.
2. Mở **File Manager** -> truy cập vào thư mục `public_html/nguyenminhhai/doan/` (hoặc domain của bạn).
3. Tải file `frontend.zip` lên và chọn **Extract (Giải nén)**.
4. Mọi tài nguyên trang chủ, giao diện và chức năng sẽ lập tức hoạt động trên tên miền trực tuyến!

