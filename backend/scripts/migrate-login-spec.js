const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const databaseUrl = 'postgresql://neondb_owner:npg_3blXDnJKd8uU@ep-fancy-resonance-b4hzp3ac-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function main() {
  console.log('🔄 Đang cập nhật bảng users theo yêu cầu đặc tả đề bài...');

  // 1. Thêm cột username và is_locked
  await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;`);
  await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;`);

  // 2. Cập nhật tài khoản Admin & Coach có username
  const hash = await bcrypt.hash('123456', 10);

  await sql.query(`
    UPDATE users SET username = 'admin123' WHERE email = 'admin@saovangfc.com';
  `);
  await sql.query(`
    UPDATE users SET username = 'coach123' WHERE email = 'coach@saovangfc.com';
  `);

  // 3. Thêm tài khoản bị khóa để test thông báo "Tài khoản đã bị khóa!!!"
  await sql.query(`
    INSERT INTO users (id, name, email, username, password, role, is_locked)
    VALUES ('user-locked', 'Tài Khoản Bị Khóa', 'locked@saovangfc.com', 'userlocked', '${hash}', 'player', TRUE)
    ON CONFLICT (email) DO UPDATE SET username = 'userlocked', is_locked = TRUE;
  `);

  console.log('✅ Đã cập nhật thành công!');
  console.log('📋 Danh sách tài khoản thử nghiệm:');
  console.log('   1. Tài khoản thường: ID=admin123, Mật khẩu=123456');
  console.log('   2. Huấn luyện viên: ID=coach123, Mật khẩu=123456');
  console.log('   3. Tài khoản BỊ KHÓA (để test thông báo bị khóa): ID=userlocked, Mật khẩu=123456');
}

main().catch(console.error);
