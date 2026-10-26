import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3blXDnJKd8uU@ep-fancy-resonance-b4hzp3ac-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const sql = neon(databaseUrl);

/**
 * Tự động khởi tạo schema bảng trên Neon PostgreSQL nếu chưa có
 */
export async function initDatabase() {
  try {
    // 1. Bảng Câu Lạc Bộ
    await sql`
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
    `;

    // 2. Bảng Sân Bóng
    await sql`
      CREATE TABLE IF NOT EXISTS fields (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        field_type VARCHAR(100),
        surface_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Khả dụng',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Bảng Cầu Thủ
    await sql`
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
    `;

    // 4. Bảng Lịch Tập Luyện & Thi Đấu
    await sql`
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
    `;

    // 5. Bảng Điểm Danh Buổi Tập
    await sql`
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
    `;

    return { success: true, message: 'Khởi tạo bảng Neon PostgreSQL thành công!' };
  } catch (error) {
    console.error('Lỗi khởi tạo DB:', error);
    throw error;
  }
}
