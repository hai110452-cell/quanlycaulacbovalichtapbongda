import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/user.entity';
import { Player } from './players/player.entity';
import { Field } from './fields/field.entity';
import { Schedule } from './schedules/schedule.entity';
import { Attendance } from './attendances/attendance.entity';
import { Match } from './matches/match.entity';
import { Club } from './clubs/club.entity';
import { Notification } from './notifications/notification.entity';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL chưa được cấu hình trong file .env');
  }

  console.log('🔄 Đang kết nối tới Neon PostgreSQL...');
  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
    entities: [User, Player, Field, Schedule, Attendance, Match, Club, Notification],
    synchronize: true, // Tự động đồng bộ cấu trúc bảng
    logging: false,
  });

  await dataSource.initialize();
  console.log('✅ Đã đồng bộ cấu trúc bảng (schema) thành công!');

  const seedFilePath = path.join(__dirname, '../seed.sql');
  if (fs.existsSync(seedFilePath)) {
    console.log('🌱 Đang nạp dữ liệu mẫu từ seed.sql...');
    const sql = fs.readFileSync(seedFilePath, 'utf8');
    
    await dataSource.query(sql);
    console.log('✅ Nạp dữ liệu seed.sql thành công!');
  } else {
    console.warn('⚠️ Không tìm thấy file seed.sql');
  }

  // Kiểm tra số lượng bản ghi
  const tables = ['clubs', 'users', 'fields', 'players', 'schedules', 'attendances', 'matches', 'notifications'];
  console.log('\n📊 THỐNG KÊ DỮ LIỆU HIỆN CÓ TRÊN NEON DB:');
  for (const table of tables) {
    try {
      const res = await dataSource.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(` - ${table.padEnd(15)}: ${res[0].count} bản ghi`);
    } catch (e) {
      console.log(` - ${table.padEnd(15)}: (chưa có hoặc lỗi)`);
    }
  }

  await dataSource.destroy();
  console.log('\n🎉 Kết nối và nạp dữ liệu Neon DB hoàn tất mỹ mãn!');
}

runSeed().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
