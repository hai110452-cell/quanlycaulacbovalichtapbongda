const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const databaseUrl = 'postgresql://neondb_owner:npg_3blXDnJKd8uU@ep-fancy-resonance-b4hzp3ac-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function main() {
  console.log('🚀 Đang tạo bảng users trên Neon...');

  await sql.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'player',
      phone VARCHAR(50),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Bảng users đã được tạo thành công!');

  // Thêm tài khoản Admin và Cầu thủ mẫu
  const adminHash = await bcrypt.hash('123456', 10);
  const coachHash = await bcrypt.hash('123456', 10);

  await sql.query(`
    INSERT INTO users (id, name, email, password, role, phone)
    VALUES
      ('user-admin', 'Ban Quản Trị CLB', 'admin@saovangfc.com', '${adminHash}', 'admin', '0901234567'),
      ('user-coach', 'HLV. Nguyễn Văn Huấn', 'coach@saovangfc.com', '${coachHash}', 'coach', '0912345678')
    ON CONFLICT (email) DO NOTHING;
  `);

  console.log('✅ Đã tạo tài khoản mẫu:');
  console.log('   1. Quản trị: admin@saovangfc.com / Mật khẩu: 123456');
  console.log('   2. Huấn luyện viên: coach@saovangfc.com / Mật khẩu: 123456');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
