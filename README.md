# QUẢN LÝ CÂU LẠC BỘ VÀ LỊCH TẬP BÓNG ĐÁ

Hệ thống quản lý thông tin câu lạc bộ, cầu thủ, sân bóng, lịch tập luyện - thi đấu và điểm danh buổi tập. Dự án được xây dựng với cấu trúc **tách biệt hoàn toàn và rõ ràng giữa HTML và CSS**, đồng thời vận hành trên nền tảng **Next.js Fullstack (Frontend & Backend)**.

---

## 🌟 Các Tính Năng Cốt Lõi & Tính Năng Nâng Cao

### 🎯 Bảng Phân Bổ Mức Ưu Tiên & Tính Năng Nâng Cao
| Mức ưu tiên | Tính năng cốt lõi | Trạng thái |
| :---: | :--- | :---: |
| **1** | **Kiểm tra lịch tập và sân bị trùng** (Phát hiện trùng giờ, trùng sân, khóa lưu lịch vi phạm) | ✅ Hoàn thành |
| **2** | **Thống kê chuyên cần** (Tỷ lệ %, xếp loại xuất sắc/khá/cần cải thiện, lọc tuần/tháng/toàn mùa) | ✅ Hoàn thành |
| **3** | **Dashboard có biểu đồ** (Biểu đồ cột chuyên cần 6 tháng, thanh phân bổ đội hình, KPI tổng thể) | ✅ Hoàn thành |
| **4** | **Phân quyền tài khoản** (Admin, Coach, Player kèm thanh Demo Switcher chuyển quyền 1 chạm) | ✅ Hoàn thành |

---

### 🚀 4 Tính Năng Nâng Cao Mới Bổ Sung

#### 1. 🔔 Thông báo lịch tập (Schedule Notifications & Alerts)
- **Chuông thông báo thời gian thực:** Tích hợp chuông thông báo trên thanh Navbar kèm badge hiển thị số lượng thông báo chưa đọc.
- **Tự động kích hoạt khi có lịch mới hoặc thay đổi:** Khi HLV/Admin tạo lịch tập mới, sửa giờ hoặc hủy lịch, hệ thống tự động ghi nhận thông báo chi tiết (Thời gian, sân tập, loại buổi tập) và hiển thị thông báo nổi (Toast alert).
- **Hộp thoại thông báo thông minh:** Cho phép xem danh sách lịch sử thông báo, đánh dấu từng thông báo đã đọc, "Đánh dấu tất cả đã đọc" hoặc xóa sạch lịch sử.

#### 2. 📥 Xuất báo cáo Excel & In / Xuất PDF (Export to Excel & PDF)
- **Xuất danh sách cầu thủ:** Hỗ trợ xuất file Excel (CSV chuẩn UTF-8 BOM, hiển thị tiếng Việt có dấu chuẩn xác 100% trên Microsoft Excel) và xuất bản in/PDF đẹp mắt có tiêu đề CLB, ngày xuất, bảng dữ liệu và phần ký duyệt của Ban Huấn Luyện.
- **Xuất lịch tập luyện:** Xuất toàn bộ hoặc theo bộ lọc thời gian biểu huấn luyện ra file Excel và PDF/In ấn.
- **Xuất thống kê chuyên cần & điểm danh:** Xuất bảng điểm danh buổi tập hôm nay hoặc báo cáo tỷ lệ chuyên cần theo chu kỳ (Tuần, Tháng, Toàn mùa giải).

#### 3. ⚽ Quản lý kết quả trận đấu (Match Results Management)
- **Quản lý tỷ số & đối thủ:** Lưu trữ lịch sử các trận giao hữu, giải đấu chính thức và cúp mở rộng với tỷ số trực quan giữa Sao Vàng FC và đội bạn.
- **Chi tiết bàn thắng & thời gian:** Ghi nhận danh sách cầu thủ ghi bàn kèm phút lập công (ví dụ: *Nguyễn Tiến Linh 18'*, *Nguyễn Quang Hải 55'*).
- **Cầu thủ xuất sắc nhất trận (MVP) & nhận định HLV:** Tôn vinh danh hiệu MVP của trận đấu, ghi nhận thẻ phạt (vàng/đỏ) và ghi chú chiến thuật của HLV.
- **Thống kê phong độ & KPI:** Tự động tính toán tổng số trận, tỷ lệ thắng (%), tổng bàn thắng, bàn thua và hiệu số bàn thắng (+/-).

#### 4. 🔍 Tìm kiếm & Lọc nâng cao (Advanced Search & Filter)
- **Tìm kiếm đa năng:** Tìm nhanh cầu thủ qua Họ tên, Số áo thi đấu hoặc Số điện thoại.
- **Bộ lọc đa chiều:** Kết hợp đồng thời lọc theo Vị trí (Thủ môn, Hậu vệ, Tiền vệ, Tiền đạo), Trạng thái thi đấu (Đang thi đấu, Chấn thương, Nghỉ phép), và Chân thuận (Chân phải, Chân trái, Cả hai chân).
- **Sắp xếp linh hoạt:** Sắp xếp danh sách theo Số áo (Tăng dần/Giảm dần), Tên cầu thủ (A-Z, Z-A).
- **Chỉ số kết quả:** Hiển thị số lượng cầu thủ tìm thấy và nút *"🔄 Đặt lại"* để khôi phục bộ lọc chỉ bằng 1 thao tác.

---

## 🏗️ Cấu Trúc Thư Mục Dự Án

```
QUẢN LÝ CÂU LẠC BỘ VÀ LỊCH TẬP BÓNG ĐÁ/
├── backend/                       # BACKEND NESTJS (Port 5000)
│   ├── src/                      # Mã nguồn NestJS RESTful API
│   │   ├── auth/                 # Đăng ký, Đăng nhập (JWT, Guard)
│   │   ├── clubs/                # Thông tin câu lạc bộ
│   │   ├── players/              # Quản lý hồ sơ cầu thủ (CRUD)
│   │   ├── fields/               # Quản lý sân tập (CRUD)
│   │   ├── schedules/            # Quản lý lịch tập & thi đấu (CRUD)
│   │   ├── attendances/          # Điểm danh buổi tập (CRUD)
│   │   ├── matches/              # Quản lý kết quả trận đấu
│   │   ├── notifications/        # Thông báo lịch tập & hệ thống
│   │   └── users/                # Quản lý người dùng & phân quyền RBAC
│   ├── schema.sql                # Định nghĩa bảng PostgreSQL (Neon)
│   ├── seed.sql                  # Dữ liệu mẫu khởi tạo
│   └── package.json
│
├── frontend/                      # FRONTEND NEXT.JS (Port 3000)
│   ├── app/                      # Next.js App Router (Giao diện người dùng)
│   │   ├── page.tsx              # Dashboard thống kê KPI, biểu đồ tháng, đội hình
│   │   ├── login/page.tsx        # Trang đăng nhập chuẩn đặc tả txtID, txtPass, btnDangnhap
│   │   ├── register/page.tsx     # Trang đăng ký thành viên
│   │   ├── players/page.tsx      # Quản lý cầu thủ & Modal hồ sơ chi tiết
│   │   ├── schedules/page.tsx    # Quản lý lịch tập & Tự động chống trùng lịch
│   │   ├── attendance/page.tsx   # Điểm danh & Thống kê chuyên cần đa chu kỳ
│   │   └── fields/page.tsx       # Quản lý sân bãi & cơ sở vật chất
│   ├── components/Navbar.tsx     # Menu điều hướng & Demo Role Switcher
│   ├── context/AuthContext.tsx   # Quản lý phiên đăng nhập và phân quyền RBAC
│   ├── public/                   # Toàn bộ CSS tách biệt và bản HTML tĩnh
│   │   ├── css/                  # File stylesheet riêng biệt cho từng trang
│   │   └── js/                   # Scripts JavaScript độc lập
│   └── package.json
│
├── package.json                   # Script khởi chạy toàn bộ hệ thống
└── README.md
```

---

## 🚀 Hướng Dẫn Khởi Chạy

### Khởi chạy đồng thời cả Backend (NestJS) và Frontend (Next.js):
Tại thư mục gốc dự án:
```bash
npm run dev
```

Hoặc chạy riêng:
- **Backend:** `npm run dev:backend`
- **Frontend:** `npm run dev:frontend`

Truy cập trên trình duyệt:
- **Frontend (Giao diện người dùng):** [http://localhost:3000](http://localhost:3000)
- **Backend (NestJS API Server):** [http://localhost:5000/api](http://localhost:5000/api)
