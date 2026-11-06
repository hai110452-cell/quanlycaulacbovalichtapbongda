# KỊCH BẢN QUAY VIDEO DEMO ĐỒ ÁN (THỜI LƯỢNG 5 - 7 PHÚT)

## 1. Giới thiệu tổng quan (1 phút)
- Giới thiệu tên đề tài, nhóm thực hiện và công nghệ cốt lõi: NestJS Backend + Next.js Frontend + PostgreSQL.
- Giới thiệu 2 môi trường: Localhost và trang web chạy thực tế trên tên miền DirectAdmin.

## 2. Demo Khách hàng & Cầu thủ (2 phút)
- Xem danh sách ca đặt sân theo ngày: Minh họa ca đã có người đặt cọc sẽ luôn hiển thị lên đầu.
- Thao tác chọn ca trống, chọn dịch vụ đi kèm (Bóng FIFA, Áo bib).
- Nhấn "ĐẶT SÂN NGAY", kiểm tra biên lai xác nhận và bấm nút **"🖨️ In Phiếu Này"**.

## 3. Demo Ban Quản Trị (Admin & Coach) (2 phút)
- Đăng nhập bằng tài khoản Quản trị viên (Admin).
- Trải nghiệm chuyển đổi vai trò (Chủ sân, Quản lý, HLV, Cầu thủ).
- Quản lý cầu thủ: Thêm mới, cập nhật chấn thương, xóa thành viên.
- Quản lý lịch tập: Tạo lịch mới và minh họa tính năng cảnh báo khi trùng lịch sân.
- Điểm danh buổi tập và xem biểu đồ thống kê chuyên cần.
- Xuất file Excel / PDF danh sách cầu thủ và lịch thi đấu.

## 4. Demo NestJS Backend & Postman (1.5 phút)
- Mở Postman, import collection `CLB_BongDa_API.postman_collection.json`.
- Chạy request `POST /api/auth/login`, lấy Token.
- Gọi API `GET /api/players` kèm header `x-api-key` để minh họa tính năng `ApiKeyGuard`.
- Gọi API với token không đúng quyền để minh họa `RolesGuard` chặn truy cập 403 Forbidden.

## 5. Kết thúc (30 giây)
- Tóm tắt kết quả đạt được và lời cảm ơn đến Hội đồng chấm thi.

