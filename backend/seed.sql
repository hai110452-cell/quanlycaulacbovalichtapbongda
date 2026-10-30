-- ============================================================
-- SEED DATA - Quản Lý Câu Lạc Bộ và Lịch Tập Bóng Đá
-- Database: PostgreSQL (Neon)
-- Chạy file này để tạo dữ liệu mẫu cho tất cả các bảng
-- ============================================================

-- ============================================================
-- 1. BẢNG CLUBS - Thông tin câu lạc bộ
-- ============================================================
INSERT INTO clubs (id, name, short_name, established_year, coach, captain, home_stadium, description)
VALUES (
  'default-club',
  'Câu Lạc Bộ Sao Vàng FC',
  'SVF',
  2015,
  'HLV. Nguyễn Văn Huấn',
  'Trần Minh Tuấn',
  'Sân Bóng Sao Vàng - Quận 9, TP.HCM',
  'CLB Sao Vàng FC được thành lập năm 2015, là một trong những câu lạc bộ phong trào hàng đầu khu vực. Chúng tôi thi đấu với tinh thần đồng đội, công bằng và sự phát triển của từng cầu thủ.'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    established_year = EXCLUDED.established_year,
    coach = EXCLUDED.coach,
    captain = EXCLUDED.captain,
    home_stadium = EXCLUDED.home_stadium,
    description = EXCLUDED.description;

-- ============================================================
-- 2. BẢNG USERS - Tài khoản người dùng
-- Password đã được hash bằng bcrypt (mật khẩu gốc: Admin123)
-- ============================================================
INSERT INTO users (id, name, email, username, password, role, phone, is_locked)
VALUES
  ('user-001', 'Nguyễn Văn Admin', 'admin@saovangfc.com', 'admin001',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '0901234567', false),
  ('user-002', 'Trần Văn Huấn', 'coach@saovangfc.com', 'hlvhuan',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach', '0912345678', false),
  ('user-003', 'Lê Thị Mai', 'mai.le@saovangfc.com', 'maile03',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player', '0923456789', false),
  ('user-004', 'Phạm Quốc Hùng', 'hung.pham@saovangfc.com', 'hungpham04',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player', '0934567890', false),
  ('user-005', 'Võ Minh Đức', 'duc.vo@saovangfc.com', 'ducvo05',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player', '0945678901', false)
ON CONFLICT (email) DO NOTHING;

-- Ghi chú: Mật khẩu hash ở trên là "password" (bcrypt rounds=10)
-- Để tạo hash thực, chạy: node -e "const b=require('bcryptjs'); b.hash('Admin123', 10).then(h=>console.log(h))"

-- ============================================================
-- 3. BẢNG FIELDS - Sân bóng
-- ============================================================
INSERT INTO fields (id, name, location, field_type, surface_type, status)
VALUES
  ('field-001', 'Sân Sao Vàng A', '123 Nguyễn Duy Trinh, Q.9, TP.HCM', 'Sân 7 người', 'Cỏ nhân tạo', 'Khả dụng'),
  ('field-002', 'Sân Sao Vàng B', '123 Nguyễn Duy Trinh, Q.9, TP.HCM', 'Sân 7 người', 'Cỏ nhân tạo', 'Khả dụng'),
  ('field-003', 'Sân Thống Nhất', '138 Đường 3/2, Q.10, TP.HCM', 'Sân 11 người', 'Cỏ tự nhiên', 'Khả dụng'),
  ('field-004', 'Sân Futsal Olympic', '45 Đinh Tiên Hoàng, Q.Bình Thạnh, TP.HCM', 'Sân futsal', 'Sàn gỗ', 'Khả dụng'),
  ('field-005', 'Sân Phú Thọ', '1 Lữ Gia, Q.11, TP.HCM', 'Sân 11 người', 'Cỏ nhân tạo', 'Bảo trì'),
  ('field-006', 'Sân Mini Star', '67 Lê Văn Việt, Q.9, TP.HCM', 'Sân 7 người', 'Cỏ nhân tạo', 'Khả dụng'),
  ('field-007', 'Sân Rạch Miễu', '99 Phan Xích Long, Q.Phú Nhuận, TP.HCM', 'Sân 7 người', 'Cỏ nhân tạo', 'Khả dụng'),
  ('field-008', 'Sân Tao Đàn', '55 Trương Định, Q.3, TP.HCM', 'Sân futsal', 'Sàn gỗ', 'Khả dụng'),
  ('field-009', 'Sân Đại học Thể dục', '41 Lê Văn Huân, Q.Tân Bình, TP.HCM', 'Sân 11 người', 'Cỏ tự nhiên', 'Khả dụng'),
  ('field-010', 'Sân Cộng đồng Bình Dương', '12 Đại lộ Bình Dương, Thủ Dầu Một', 'Sân 7 người', 'Cỏ nhân tạo', 'Khả dụng')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. BẢNG PLAYERS - Cầu thủ
-- ============================================================
INSERT INTO players (id, name, jersey_number, position, date_of_birth, phone, status, joined_date, avatar_url)
VALUES
  ('player-001', 'Nguyễn Văn Khải',  1,  'Thủ môn',  '1995-03-15', '0901111111', 'Đang thi đấu', '2020-01-10', NULL),
  ('player-002', 'Trần Minh Tuấn',   5,  'Hậu vệ',   '1994-07-22', '0902222222', 'Đang thi đấu', '2020-01-10', NULL),
  ('player-003', 'Lê Quốc Bảo',      4,  'Hậu vệ',   '1996-11-08', '0903333333', 'Đang thi đấu', '2020-03-15', NULL),
  ('player-004', 'Phạm Thanh Tùng',  3,  'Hậu vệ',   '1997-05-30', '0904444444', 'Chấn thương',  '2020-05-20', NULL),
  ('player-005', 'Võ Hoàng Nam',      6,  'Tiền vệ',  '1995-09-12', '0905555555', 'Đang thi đấu', '2019-06-01', NULL),
  ('player-006', 'Đặng Văn Long',     8,  'Tiền vệ',  '1998-02-28', '0906666666', 'Đang thi đấu', '2021-01-05', NULL),
  ('player-007', 'Hoàng Minh Huy',   10,  'Tiền vệ',  '1993-12-01', '0907777777', 'Đang thi đấu', '2018-08-15', NULL),
  ('player-008', 'Nguyễn Đức Thắng',  7,  'Tiền đạo', '1999-04-17', '0908888888', 'Đang thi đấu', '2022-02-10', NULL),
  ('player-009', 'Bùi Văn Kiên',      9,  'Tiền đạo', '1996-08-25', '0909999999', 'Đang thi đấu', '2020-09-01', NULL),
  ('player-010', 'Trịnh Quang Hải',  11,  'Tiền đạo', '2000-01-14', '0910000000', 'Nghỉ phép',   '2023-03-20', NULL),
  ('player-011', 'Mai Xuân Trường',  13,  'Hậu vệ',   '1997-06-19', '0911111111', 'Đang thi đấu', '2021-07-12', NULL),
  ('player-012', 'Lý Công Hoàng',   14,  'Tiền đạo', '1995-10-05', '0912222222', 'Chấn thương',  '2019-11-30', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. BẢNG SCHEDULES - Lịch tập luyện & thi đấu
-- ============================================================
INSERT INTO schedules (id, title, type, date, start_time, end_time, field_id, field_name, coach, status, notes)
VALUES
  ('sched-001', 'Tập thể lực đầu tuần',          'Tập thể lực',       '2026-10-28', '18:00', '20:00', 'field-001', 'Sân Sao Vàng A',    'HLV. Nguyễn Văn Huấn', 'Đã hoàn thành', 'Chú trọng cardio và tốc độ'),
  ('sched-002', 'Tập chiến thuật 4-3-3',          'Tập chiến thuật',   '2026-10-29', '17:30', '19:30', 'field-001', 'Sân Sao Vàng A',    'HLV. Nguyễn Văn Huấn', 'Đã hoàn thành', 'Luyện sơ đồ chiến thuật mới'),
  ('sched-003', 'Đấu tập nội bộ thứ 4',          'Đấu tập nội bộ',   '2026-10-30', '18:00', '20:30', 'field-002', 'Sân Sao Vàng B',    'HLV. Nguyễn Văn Huấn', 'Đang diễn ra',  'Chia 2 đội: Đỏ vs Xanh'),
  ('sched-004', 'Tập thể lực cuối tuần',          'Tập thể lực',       '2026-11-01', '07:00', '09:00', 'field-001', 'Sân Sao Vàng A',    'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Buổi tập sáng sớm, mang giày đinh'),
  ('sched-005', 'Tập kỹ thuật cá nhân',           'Tập chiến thuật',   '2026-11-02', '18:00', '20:00', 'field-006', 'Sân Mini Star',     'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Tập rê bóng và dứt điểm'),
  ('sched-006', 'Giao hữu vs FC Rồng Xanh',       'Thi đấu giao hữu', '2026-11-05', '16:00', '18:00', 'field-003', 'Sân Thống Nhất',    'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Trận giao hữu hàng tháng, toàn đội tham gia'),
  ('sched-007', 'Đấu tập nội bộ chủ nhật',        'Đấu tập nội bộ',   '2026-11-08', '07:30', '10:00', 'field-002', 'Sân Sao Vàng B',    'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Luyện set-piece và phạt góc'),
  ('sched-008', 'Tập thể lực - Bài tập sức mạnh', 'Tập thể lực',       '2026-11-10', '18:00', '20:00', 'field-001', 'Sân Sao Vàng A',    'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Gym + field training'),
  ('sched-009', 'Tập phòng thủ',                  'Tập chiến thuật',   '2026-11-12', '17:00', '19:00', 'field-007', 'Sân Rạch Miễu',     'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Tập pressing cao và chuyển trạng thái'),
  ('sched-010', 'Giao hữu vs Hoàng Long FC',       'Thi đấu giao hữu', '2026-11-15', '15:30', '17:30', 'field-009', 'Sân Đại học Thể dục','HLV. Nguyễn Văn Huấn', 'Sắp diễn ra',  'Trận quan trọng chuẩn bị cho giải cuối năm')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. BẢNG ATTENDANCES - Điểm danh buổi tập
-- (Dữ liệu cho 2 buổi đã hoàn thành: sched-001 và sched-002)
-- ============================================================
INSERT INTO attendances (id, schedule_id, player_id, player_name, status, check_in_time, note)
VALUES
  -- Buổi tập 001
  ('att-001-01', 'sched-001', 'player-001', 'Nguyễn Văn Khải',   'Có mặt',          '17:55', NULL),
  ('att-001-02', 'sched-001', 'player-002', 'Trần Minh Tuấn',    'Có mặt',          '17:58', NULL),
  ('att-001-03', 'sched-001', 'player-003', 'Lê Quốc Bảo',       'Có mặt',          '18:02', NULL),
  ('att-001-04', 'sched-001', 'player-004', 'Phạm Thanh Tùng',   'Vắng có phép',    NULL,    'Chấn thương đầu gối'),
  ('att-001-05', 'sched-001', 'player-005', 'Võ Hoàng Nam',       'Có mặt',          '18:00', NULL),
  ('att-001-06', 'sched-001', 'player-006', 'Đặng Văn Long',      'Đến muộn',        '18:25', 'Kẹt xe'),
  ('att-001-07', 'sched-001', 'player-007', 'Hoàng Minh Huy',    'Có mặt',          '17:50', NULL),
  ('att-001-08', 'sched-001', 'player-008', 'Nguyễn Đức Thắng',  'Có mặt',          '18:00', NULL),
  ('att-001-09', 'sched-001', 'player-009', 'Bùi Văn Kiên',       'Vắng không phép', NULL,    NULL),
  ('att-001-10', 'sched-001', 'player-010', 'Trịnh Quang Hải',   'Vắng có phép',    NULL,    'Công tác ngoại tỉnh'),
  -- Buổi tập 002
  ('att-002-01', 'sched-002', 'player-001', 'Nguyễn Văn Khải',   'Có mặt',          '17:28', NULL),
  ('att-002-02', 'sched-002', 'player-002', 'Trần Minh Tuấn',    'Có mặt',          '17:30', NULL),
  ('att-002-03', 'sched-002', 'player-003', 'Lê Quốc Bảo',       'Có mặt',          '17:35', NULL),
  ('att-002-04', 'sched-002', 'player-005', 'Võ Hoàng Nam',       'Có mặt',          '17:30', NULL),
  ('att-002-05', 'sched-002', 'player-006', 'Đặng Văn Long',      'Có mặt',          '17:32', NULL),
  ('att-002-06', 'sched-002', 'player-007', 'Hoàng Minh Huy',    'Có mặt',          '17:25', NULL),
  ('att-002-07', 'sched-002', 'player-008', 'Nguyễn Đức Thắng',  'Đến muộn',        '18:10', 'Xử lý việc cá nhân'),
  ('att-002-08', 'sched-002', 'player-009', 'Bùi Văn Kiên',       'Có mặt',          '17:30', NULL),
  ('att-002-09', 'sched-002', 'player-011', 'Mai Xuân Trường',   'Có mặt',          '17:28', NULL),
  ('att-002-10', 'sched-002', 'player-012', 'Lý Công Hoàng',     'Vắng có phép',    NULL,    'Chấn thương cơ đùi')
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    check_in_time = EXCLUDED.check_in_time,
    note = EXCLUDED.note;

-- ============================================================
-- 7. BẢNG MATCHES - Kết quả trận đấu
-- ============================================================
INSERT INTO matches (id, opponent, opponent_logo, match_type, date, time, field_name, home_score, away_score, status, goal_scorers, mvp, yellow_cards, red_cards, notes)
VALUES
  ('match-001', 'FC Rồng Đỏ',       NULL, 'Giao hữu',    '2026-10-10', '16:00', 'Sân Sao Vàng A',     3, 1, 'Đã kết thúc',
   '[{"playerName":"Hoàng Minh Huy","minute":15},{"playerName":"Bùi Văn Kiên","minute":45},{"playerName":"Nguyễn Đức Thắng","minute":78}]',
   'Hoàng Minh Huy', 1, 0, 'Chiến thắng ấn tượng, đội hình thi đấu tốt'),

  ('match-002', 'Hổ Biển FC',        NULL, 'Giao hữu',    '2026-10-17', '15:30', 'Sân Thống Nhất',     2, 2, 'Đã kết thúc',
   '[{"playerName":"Bùi Văn Kiên","minute":22},{"playerName":"Hoàng Minh Huy","minute":60}]',
   'Bùi Văn Kiên', 2, 0, 'Trận hòa tiếc nuối, để thủng lưới phút cuối'),

  ('match-003', 'Sông Hồng United',  NULL, 'Giải đấu',    '2026-09-28', '17:00', 'Sân Phú Thọ',        1, 0, 'Đã kết thúc',
   '[{"playerName":"Nguyễn Đức Thắng","minute":88}]',
   'Nguyễn Văn Khải', 0, 1, 'Chiến thắng kịch tính phút bù giờ'),

  ('match-004', 'Cúp FC',            NULL, 'Cúp Mở Rộng', '2026-09-15', '16:00', 'Sân Đại học Thể dục', 4, 0, 'Đã kết thúc',
   '[{"playerName":"Hoàng Minh Huy","minute":10},{"playerName":"Hoàng Minh Huy","minute":35,"isPenalty":true},{"playerName":"Bùi Văn Kiên","minute":55},{"playerName":"Nguyễn Đức Thắng","minute":70}]',
   'Hoàng Minh Huy', 0, 0, 'Đại thắng 4-0, phong độ xuất sắc'),

  ('match-005', 'Thanh Niên FC',     NULL, 'Giao hữu',    '2026-10-24', '15:00', 'Sân Rạch Miễu',      1, 3, 'Đã kết thúc',
   '[{"playerName":"Bùi Văn Kiên","minute":33}]',
   NULL, 1, 0, 'Thua rõ ràng, cần cải thiện phòng ngự'),

  ('match-006', 'Sao Mai FC',        NULL, 'Giải đấu',    '2026-08-20', '16:30', 'Sân Sao Vàng A',     2, 1, 'Đã kết thúc',
   '[{"playerName":"Võ Hoàng Nam","minute":20},{"playerName":"Hoàng Minh Huy","minute":75}]',
   'Võ Hoàng Nam', 1, 0, NULL),

  ('match-007', 'Bình Minh Sports',  NULL, 'Giao hữu',    '2026-10-03', '17:00', 'Sân Mini Star',      0, 0, 'Đã kết thúc',
   '[]',
   'Nguyễn Văn Khải', 0, 0, 'Trận hòa không bàn thắng, thủ môn Khải cứu thua xuất sắc'),

  ('match-008', 'Long An United',    NULL, 'Cúp Mở Rộng', '2026-07-12', '15:30', 'Sân Phú Thọ',        3, 2, 'Đã kết thúc',
   '[{"playerName":"Nguyễn Đức Thắng","minute":18},{"playerName":"Bùi Văn Kiên","minute":50,"isPenalty":true},{"playerName":"Hoàng Minh Huy","minute":85}]',
   'Nguyễn Đức Thắng', 2, 1, 'Ngược dòng kịch tính từ 0-2'),

  ('match-009', 'FC Rồng Xanh',     NULL, 'Giao hữu',    '2026-11-05', '16:00', 'Sân Thống Nhất',     0, 0, 'Sắp diễn ra',
   '[]',
   NULL, 0, 0, 'Trận giao hữu định kỳ hàng tháng - CHƯA THI ĐẤU'),

  ('match-010', 'Hoàng Long FC',     NULL, 'Giải đấu',    '2026-11-15', '15:30', 'Sân Đại học Thể dục', 0, 0, 'Sắp diễn ra',
   '[]',
   NULL, 0, 0, 'Trận đấu quan trọng vòng bảng - CHƯA THI ĐẤU')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. BẢNG NOTIFICATIONS - Thông báo lịch tập
-- ============================================================
INSERT INTO notifications (id, title, message, type, timestamp, read, schedule_id)
VALUES
  ('notif-001', 'Lịch tập mới: Tập thể lực đầu tuần',
   'Buổi tập thể lực sẽ diễn ra vào 18:00 ngày 28/10/2026 tại Sân Sao Vàng A. Mang đầy đủ đồ tập!',
   'new', '27/10/2026, 20:00:00', true, 'sched-001'),

  ('notif-002', 'Nhắc nhở: Đấu tập nội bộ tối nay',
   'Đấu tập nội bộ diễn ra lúc 18:00 tối nay tại Sân Sao Vàng B. Toàn đội có mặt đúng giờ!',
   'reminder', '30/10/2026, 08:00:00', true, 'sched-003'),

  ('notif-003', 'Thay đổi lịch: Giao hữu vs FC Rồng Xanh',
   'Địa điểm thi đấu đã được thay đổi sang Sân Thống Nhất thay vì Sân Sao Vàng A.',
   'change', '28/10/2026, 15:30:00', false, 'sched-006'),

  ('notif-004', 'Lịch tập mới: Tập kỹ thuật cá nhân',
   'Buổi tập kỹ thuật cá nhân tại Sân Mini Star vào 18:00 ngày 02/11/2026.',
   'new', '29/10/2026, 18:00:00', false, 'sched-005'),

  ('notif-005', 'Hủy buổi tập: Sân Phú Thọ bảo trì',
   'Sân Phú Thọ đang trong thời gian bảo trì. Các buổi tập liên quan sẽ được thông báo địa điểm mới.',
   'cancel', '25/10/2026, 10:00:00', true, NULL),

  ('notif-006', 'Nhắc nhở: Tập thể lực cuối tuần',
   'Buổi tập sáng sớm 07:00 ngày 01/11 tại Sân Sao Vàng A. Mang giày đinh, đến đúng giờ!',
   'reminder', '31/10/2026, 20:00:00', false, 'sched-004'),

  ('notif-007', 'Lịch tập mới: Giao hữu vs Hoàng Long FC',
   'Trận giao hữu quan trọng chuẩn bị cho giải cuối năm tại Sân Đại học Thể dục 15:30 ngày 15/11.',
   'new', '01/11/2026, 09:00:00', false, 'sched-010'),

  ('notif-008', 'Kết quả điểm danh: Buổi tập 29/10',
   '9/10 cầu thủ có mặt. Đặng Văn Long đến muộn. Lý Công Hoàng vắng có phép do chấn thương.',
   'new', '29/10/2026, 21:00:00', false, 'sched-002'),

  ('notif-009', 'Chiến thắng 3-1 vs FC Rồng Đỏ!',
   'CLB giành chiến thắng 3-1 trong trận giao hữu ngày 10/10. MVP: Hoàng Minh Huy với cú đúp bàn thắng!',
   'new', '10/10/2026, 18:30:00', true, NULL),

  ('notif-010', 'Thông báo: Họp đội trước giao hữu 05/11',
   'HLV triệu tập họp đội lúc 15:00 ngày 05/11 tại Sân Thống Nhất để phổ biến chiến thuật trước trận giao hữu.',
   'new', '03/11/2026, 10:00:00', false, 'sched-006')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- KIỂM TRA DỮ LIỆU SAU KHI INSERT
-- ============================================================
SELECT 'clubs' as "Bảng", COUNT(*) as "Số bản ghi" FROM clubs
UNION ALL
SELECT 'users',         COUNT(*) FROM users
UNION ALL
SELECT 'fields',        COUNT(*) FROM fields
UNION ALL
SELECT 'players',       COUNT(*) FROM players
UNION ALL
SELECT 'schedules',     COUNT(*) FROM schedules
UNION ALL
SELECT 'attendances',   COUNT(*) FROM attendances
UNION ALL
SELECT 'matches',       COUNT(*) FROM matches
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY 1;

