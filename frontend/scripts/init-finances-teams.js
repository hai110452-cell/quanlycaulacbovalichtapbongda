const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V0sxefCk4SKP@ep-lingering-paper-b7l71r95-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  console.log('--- Bắt đầu khởi tạo dữ liệu quản lý đội và chi phí trên Neon DB ---');

  // 1. Tạo bảng finances (quản lý chi phí & quỹ)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finances (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount NUMERIC(15,2) NOT NULL DEFAULT 0,
      person_in_charge VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Bảng finances đã sẵn sàng trên Neon PostgreSQL!');

  // 2. Chèn dữ liệu mẫu cho chi phí / quỹ CLB
  const initialFinances = [
    ['fin-1', '2026-10-01', 'Thu phí sinh hoạt tháng 10 của các thành viên', 'Thu', 6600000, 'Thủ quỹ CLB', '22 thành viên x 300.000 VNĐ'],
    ['fin-2', '2026-10-03', 'Thanh toán tiền thuê sân tập tháng 10 (Sân Sao Vàng A)', 'Chi', 3500000, 'HLV Huấn', '8 buổi tập x 437.500 VNĐ'],
    ['fin-3', '2026-10-10', 'Tiền tài trợ từ Công ty Thể thao Động Lực', 'Thu', 10000000, 'Ban Lãnh Đạo', 'Tài trợ trang phục & bóng thi đấu'],
    ['fin-4', '2026-10-15', 'Mua 10 quả bóng thi đấu tiêu chuẩn FIFA Quality Pro', 'Chi', 2400000, 'Ban Hậu Cần', 'Mua sắm trang bị tập luyện'],
    ['fin-5', '2026-10-24', 'Chi phí nước uống, y tế trận giao hữu với Hà Nội Star FC', 'Chi', 800000, 'Bác sĩ CLB', 'Nước khoáng, điện giải và băng gạc y tế'],
    ['fin-6', '2026-10-28', 'Thuê sân Thống Nhất thi đấu giao hữu', 'Chi', 2000000, 'Ban quản lý', 'Trận gặp FC Rồng Đỏ'],
    ['fin-7', '2026-11-01', 'Thu phí sinh hoạt tháng 11 của các thành viên', 'Thu', 5400000, 'Thủ quỹ CLB', '18 thành viên hoàn thành đóng sớm']
  ];

  for (const f of initialFinances) {
    await pool.query(`
      INSERT INTO finances (id, date, title, category, amount, person_in_charge, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          category = EXCLUDED.category,
          amount = EXCLUDED.amount,
          person_in_charge = EXCLUDED.person_in_charge,
          notes = EXCLUDED.notes;
    `, f);
  }
  console.log('✅ Đã nạp đầy đủ dữ liệu mẫu cho bảng finances!');

  // 3. Đảm bảo bảng teams có đầy đủ 4 đội bóng
  const initialTeams = [
    ['team-1', 'Sao Vàng FC - Đội 1 (Tuyển Chính)', 'Đội hình 1 Chuyên nghiệp', 'HLV. Nguyễn Văn Huấn', 'Nguyễn Quang Hải (#19)', 22, 'Sân bóng Sao Vàng B (Sân 11)', 2021, 'Đội tuyển hạt nhân thi đấu các giải phong trào ngoại hạng và cúp khu vực miền Bắc.', 'Hoạt động'],
    ['team-2', 'Sao Vàng FC - Tuyển Trẻ U21', 'Lứa tuổi U21 Đào tạo', 'HLV. Trần Đình Trọng', 'Lê Văn Đô (#7)', 18, 'Sân bóng Sao Vàng A (Sân 7)', 2023, 'Nòng cốt kế cận, rèn luyện kỹ thuật cơ bản và tích lũy kinh nghiệm thực chiến.', 'Hoạt động'],
    ['team-3', 'Sao Vàng FC - Đội Trẻ U17', 'Lứa tuổi U17 Học viện', 'HLV. Phạm Đức Huy', 'Trần Minh Quân (#10)', 16, 'Sân bóng Sao Vàng A (Sân 7)', 2024, 'Đào tạo thể chất và tư duy chơi bóng hiện đại cho các tài năng trẻ.', 'Hoạt động'],
    ['team-4', 'Sao Vàng FC - Futsal Team', 'Bóng đá trong nhà 5 người', 'HLV. Vũ Trọng Khôi', 'Đỗ Hùng Dũng (#8)', 12, 'Sân trong nhà Futsal Arena', 2023, 'Chuyên thi đấu giao lưu sân sàn gỗ trong nhà, rèn kỹ thuật xoay sở phạm vi hẹp.', 'Hoạt động']
  ];

  for (const t of initialTeams) {
    await pool.query(`
      INSERT INTO teams (id, name, level, head_coach, captain, member_count, home_pitch, established_year, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          level = EXCLUDED.level,
          head_coach = EXCLUDED.head_coach,
          captain = EXCLUDED.captain,
          member_count = EXCLUDED.member_count,
          home_pitch = EXCLUDED.home_pitch,
          established_year = EXCLUDED.established_year,
          description = EXCLUDED.description,
          status = EXCLUDED.status;
    `, t);
  }
  console.log('✅ Đã nạp đầy đủ 4 đội bóng vào bảng teams!');

  const countFin = await pool.query('SELECT COUNT(*) FROM finances');
  const countTeams = await pool.query('SELECT COUNT(*) FROM teams');
  console.log('👉 Tổng số bản ghi finances trên Neon:', countFin.rows[0].count);
  console.log('👉 Tổng số bản ghi teams trên Neon:', countTeams.rows[0].count);

  await pool.end();
}

run().catch(err => {
  console.error('Lỗi khởi tạo:', err);
  pool.end();
});
