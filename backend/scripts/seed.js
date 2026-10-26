const { neon } = require('@neondatabase/serverless');

const databaseUrl = 'postgresql://neondb_owner:npg_3blXDnJKd8uU@ep-fancy-resonance-b4hzp3ac-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function main() {
  console.log('🚀 Đang kết nối tới Neon PostgreSQL...');

  // 1. Tạo bảng
  await sql.query(`
    CREATE TABLE IF NOT EXISTS clubs (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'default-club',
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      established_year INT,
      coach VARCHAR(255),
      captain VARCHAR(255),
      home_stadium VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS fields (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      field_type VARCHAR(100),
      surface_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Khả dụng',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS players (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      jersey_number INT NOT NULL,
      position VARCHAR(100) NOT NULL,
      date_of_birth VARCHAR(50),
      phone VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Đang thi đấu',
      joined_date VARCHAR(50),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      date VARCHAR(50) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      field_id VARCHAR(50),
      field_name VARCHAR(255),
      coach VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Sắp diễn ra',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS attendances (
      id VARCHAR(100) PRIMARY KEY,
      schedule_id VARCHAR(50) NOT NULL,
      player_id VARCHAR(50) NOT NULL,
      player_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Có mặt',
      check_in_time VARCHAR(20),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Đã tạo các bảng trên Neon thành công!');

  // 2. Chèn dữ liệu mẫu nếu chưa có
  const existingClubs = await sql.query('SELECT COUNT(*) FROM clubs');
  if (Number(existingClubs[0].count) === 0) {
    await sql.query(`
      INSERT INTO clubs (id, name, short_name, established_year, coach, captain, home_stadium, description)
      VALUES (
        'default-club',
        'Câu Lạc Bộ Bóng Đá Sao Vàng FC',
        'Sao Vàng FC',
        2020,
        'HLV. Nguyễn Văn Huấn',
        'Nguyễn Quang Hải (Số 19)',
        'Sân vận động Mỹ Đình Mini',
        'Câu lạc bộ bóng đá phong trào chuyên nghiệp, rèn luyện thể lực và kỹ chiến thuật đỉnh cao.'
      );
    `);
    console.log('✅ Đã nạp thông tin CLB mẫu vào Neon!');
  }

  const existingPlayers = await sql.query('SELECT COUNT(*) FROM players');
  if (Number(existingPlayers[0].count) === 0) {
    await sql.query(`
      INSERT INTO players (id, name, jersey_number, position, date_of_birth, phone, status, joined_date)
      VALUES
        ('player-1', 'Đặng Văn Lâm', 1, 'Thủ môn', '1993-08-13', '0901234567', 'Đang thi đấu', '2022-01-10'),
        ('player-2', 'Đỗ Duy Mạnh', 4, 'Hậu vệ', '1996-09-29', '0912345678', 'Đang thi đấu', '2021-05-15'),
        ('player-3', 'Đoàn Văn Hậu', 5, 'Hậu vệ', '1999-04-19', '0923456789', 'Chấn thương', '2021-08-20'),
        ('player-4', 'Nguyễn Quang Hải', 19, 'Tiền vệ', '1997-04-12', '0934567890', 'Đang thi đấu', '2020-03-01'),
        ('player-5', 'Nguyễn Hoàng Đức', 14, 'Tiền vệ', '1998-01-11', '0945678901', 'Đang thi đấu', '2021-02-14'),
        ('player-6', 'Nguyễn Tiến Linh', 22, 'Tiền đạo', '1997-10-20', '0956789012', 'Đang thi đấu', '2020-06-18');
    `);
    console.log('✅ Đã nạp 6 cầu thủ mẫu vào Neon!');
  }

  const existingFields = await sql.query('SELECT COUNT(*) FROM fields');
  if (Number(existingFields[0].count) === 0) {
    await sql.query(`
      INSERT INTO fields (id, name, location, field_type, surface_type, status)
      VALUES
        ('field-1', 'Sân bóng Sao Vàng A (Sân 7)', 'Số 12 Đường Cầu Diễn, Bắc Từ Liêm, Hà Nội', 'Sân 7 người', 'Cỏ nhân tạo', 'Khả dụng'),
        ('field-2', 'Sân bóng Sao Vàng B (Sân 11)', 'Khu liên hợp thể thao Quốc Gia, Mỹ Đình', 'Sân 11 người', 'Cỏ tự nhiên', 'Khả dụng'),
        ('field-3', 'Sân trong nhà Futsal Center', 'Quận Nam Từ Liêm, Hà Nội', 'Sân futsal', 'Sàn gỗ', 'Bảo trì');
    `);
    console.log('✅ Đã nạp danh sách sân bóng mẫu vào Neon!');
  }

  const existingSchedules = await sql.query('SELECT COUNT(*) FROM schedules');
  if (Number(existingSchedules[0].count) === 0) {
    await sql.query(`
      INSERT INTO schedules (id, title, type, date, start_time, end_time, field_id, field_name, coach, status, notes)
      VALUES
        ('sched-1', 'Rèn luyện thể lực và sức bền đầu tuần', 'Tập thể lực', '2026-10-27', '17:30', '19:30', 'field-1', 'Sân bóng Sao Vàng A (Sân 7)', 'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra', 'Khởi động kỹ, mang giày đinh dăm AG, tập chạy biến tốc.'),
        ('sched-2', 'Tập phối hợp bóng ngắn và sút phạt góc', 'Tập chiến thuật', '2026-10-29', '18:00', '20:00', 'field-1', 'Sân bóng Sao Vàng A (Sân 7)', 'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra', 'Chia đội 7v7 tập phản công nhanh.'),
        ('sched-3', 'Giao hữu thử nghiệm đội hình với Hà Nội Star FC', 'Thi đấu giao hữu', '2026-10-31', '16:00', '18:30', 'field-2', 'Sân bóng Sao Vàng B (Sân 11)', 'HLV. Nguyễn Văn Huấn', 'Sắp diễn ra', 'Mặc đồng phục thi đấu màu Đỏ, có mặt trước 45 phút.');
    `);
    console.log('✅ Đã nạp lịch tập luyện mẫu vào Neon!');
  }

  console.log('🎉 TOÀN BỘ CƠ SỞ DỮ LIỆU ĐÃ ĐƯỢC THIẾT LẬP THÀNH CÔNG TRÊN NEON!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
