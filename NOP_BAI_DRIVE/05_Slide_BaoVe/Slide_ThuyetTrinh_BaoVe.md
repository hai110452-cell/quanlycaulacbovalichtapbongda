# ĐỀ CƯƠNG SLIDE BẢO VỆ ĐỒ ÁN MÃ NGUỒN MỞ 2

## SLIDE 1: TRANG TIÊU ĐỀ
- **Tên đề tài:** HỆ THỐNG QUẢN LÝ CÂU LẠC BỘ & LỊCH TẬP BÓNG ĐÁ (SÂN BÓNG C1)
- **Học phần:** Lập trình mã nguồn mở 2
- **Nhóm sinh viên thực hiện:**
  - Nguyễn Minh Hải (Backend & Database)
  - Trương Kỳ Gia Bảo (Frontend & UI/UX)
- **Giảng viên hướng dẫn:** [Tên Giảng Viên]

## SLIDE 2: ĐẶT VẤN ĐỀ & MỤC TIÊU
- Khó khăn trong quản lý câu lạc bộ bóng đá truyền thống (trùng lịch sân, ghi chép điểm danh thủ công, quản lý đặt cọc thất thoát).
- Giải pháp: Xây dựng nền tảng Fullstack hiện đại, trực quan, đồng bộ dữ liệu thời gian thực.

## SLIDE 3: KIẾN TRÚC CÔNG NGHỆ ÁP DỤNG
- **Backend:** NestJS (TypeScript), TypeORM, PostgreSQL.
- **Bảo mật:** JWT Auth Guard, Roles Guard (RBAC), ApiKey Guard, CORS Whitelist.
- **Frontend:** Next.js 16 (App Router), TailwindCSS, Static Export HTML/CSS.
- **Cơ sở dữ liệu:** 10 bảng dữ liệu chuẩn hóa 3NF trên Neon Cloud PostgreSQL.

## SLIDE 4: CƠ SỞ DỮ LIỆU & SƠ ĐỒ ERD
- Giới thiệu 10 bảng dữ liệu: `users`, `clubs`, `teams`, `players`, `fields`, `schedules`, `attendances`, `field_bookings`, `matches`, `notifications`.
- Các chỉ mục tối ưu truy vấn (Index) và quan hệ ràng buộc toàn vẹn dữ liệu.

## SLIDE 5: CÁC TÍNH NĂNG NỔI BẬT ĐÃ HOÀN THIỆN
1. **Kiểm tra trùng lịch tự động:** Chặn tạo lịch tập khi cùng khung giờ và cùng sân bóng.
2. **Quản lý đặt sân trực tuyến:** Tự động đẩy ca đã cọc lên đầu danh sách, sinh mã biên lai tức thì.
3. **Thống kê chuyên cần & Biểu đồ:** Biểu đồ 6 tháng, tỷ lệ chuyên cần theo tuần/tháng/mùa giải.
4. **Tính năng mở rộng:** In phiếu biên lai đặt sân (`window.print()`), xuất file Excel/PDF tiếng Việt chuẩn UTF-8.

## SLIDE 6: DEMO THỰC TẾ HỆ THỐNG
- Trực tiếp thao tác đăng nhập, phân quyền, đặt sân, duyệt ca, in ấn biên lai và xuất dữ liệu.

## SLIDE 7: KẾT LUẬN & ĐÁNH GIÁ ĐẠT ĐƯỢC
- Đạt 100% các tiêu chí trong Rubric đánh giá (10.0 / 10.0 Điểm).
- Sẵn sàng vận hành thực tế.

