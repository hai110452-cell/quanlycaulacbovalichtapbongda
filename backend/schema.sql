-- ============================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU: QUẢN LÝ CÂU LẠC BỘ & SÂN BÓNG C1
-- NỀN TẢNG: PostgreSQL (Neon Cloud / Localhost)
-- ============================================================

-- 1. BẢNG NGƯỜI DÙNG & TÀI KHOẢN (USERS)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'Player', -- 'Admin', 'Coach', 'Player', 'Staff'
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG CÂU LẠC BỘ (CLUBS)
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    logo VARCHAR(500),
    established_year INT DEFAULT 2021,
    description TEXT,
    stadium_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG ĐỘI BÓNG TRỰC THUỘC (TEAMS)
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(100),
    head_coach VARCHAR(255),
    captain VARCHAR(255),
    member_count INT DEFAULT 0,
    home_pitch VARCHAR(255),
    established_year INT DEFAULT 2021,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Hoạt động',
    club_id INT REFERENCES clubs(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG CẦU THỦ & THÀNH VIÊN (PLAYERS)
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    jersey_number INT NOT NULL,
    position VARCHAR(50) NOT NULL, -- 'Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'
    phone VARCHAR(20),
    date_of_birth DATE,
    height VARCHAR(20),
    weight VARCHAR(20),
    preferred_foot VARCHAR(30) DEFAULT 'Chân phải',
    status VARCHAR(50) DEFAULT 'Đang tập luyện', -- 'Đang tập luyện', 'Chấn thương', 'Nghỉ phép'
    monthly_fee VARCHAR(50) DEFAULT 'Đã đóng',
    avatar VARCHAR(500),
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG SÂN BÓNG BÃI & TIỆN ÍCH (FIELDS)
CREATE TABLE IF NOT EXISTS fields (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 'Sân cỏ nhân tạo 7 người', 'Sân 11 người', 'Sân Futsal'
    hourly_rate NUMERIC(12, 2) NOT NULL,
    location VARCHAR(255),
    lighting_system VARCHAR(100) DEFAULT 'Đèn LED cao áp 400W',
    grass_quality VARCHAR(100) DEFAULT 'Cỏ nhân tạo chuẩn FIFA',
    status VARCHAR(50) DEFAULT 'Hoạt động',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG LỊCH TẬP & THI ĐẤU (SCHEDULES)
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(100) DEFAULT 'Tập chiến thuật',
    location VARCHAR(255),
    coach VARCHAR(255),
    notes TEXT,
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
    field_id VARCHAR(50) REFERENCES fields(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG ĐIỂM DANH BUỔI TẬP (ATTENDANCES)
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    schedule_id INT REFERENCES schedules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Có mặt', -- 'Có mặt', 'Đi muộn', 'Vắng có phép', 'Vắng không phép'
    note TEXT,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG ĐẶT SÂN TRỰC TUYẾN (FIELD_BOOKINGS)
CREATE TABLE IF NOT EXISTS field_bookings (
    id SERIAL PRIMARY KEY,
    receipt_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    field_id VARCHAR(50) REFERENCES fields(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    deposit NUMERIC(12, 2) DEFAULT 0,
    services JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'Đã duyệt', -- 'Chờ duyệt', 'Đã duyệt', 'Đã hủy', 'Đã hoàn thành'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. BẢNG KẾT QUẢ TRẬN ĐẤU (MATCHES)
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    opponent_name VARCHAR(255) NOT NULL,
    opponent_logo VARCHAR(500),
    match_date DATE NOT NULL,
    match_time VARCHAR(50),
    venue VARCHAR(255),
    score_home INT DEFAULT 0,
    score_away INT DEFAULT 0,
    competition VARCHAR(100) DEFAULT 'Giao hữu',
    mvp VARCHAR(255),
    goals JSONB DEFAULT '[]',
    cards JSONB DEFAULT '[]',
    coach_review TEXT,
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. BẢNG THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'schedule', -- 'schedule', 'fee', 'general'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TẠO CÁC CHỈ MỤC (INDEXES) TỐI ƯU HÓA TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_schedules_team_date ON schedules(team_id, date);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_field_bookings_date ON field_bookings(booking_date, field_id);

