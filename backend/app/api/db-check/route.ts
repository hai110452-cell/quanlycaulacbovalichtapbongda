import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    // 1. Kiểm tra kết nối
    const testResult = await sql`SELECT NOW() as current_time, current_database() as db_name, version() as pg_version;`;
    
    // 2. Khởi tạo bảng nếu chưa có
    await initDatabase();

    return NextResponse.json({
      success: true,
      message: 'Kết nối Neon PostgreSQL thành công rực rỡ!',
      database: testResult[0].db_name,
      serverTime: testResult[0].current_time,
      version: testResult[0].pg_version,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi kết nối tới Neon PostgreSQL',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
