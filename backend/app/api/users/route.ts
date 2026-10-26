import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, username, email, role, is_locked as "isLocked",
             phone, avatar_url as "avatarUrl", created_at as "createdAt"
      FROM users
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách users:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn danh sách người dùng' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, username, password, role = 'player', phone, isLocked = false } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu!' },
        { status: 400 }
      );
    }

    const cleanUsername = (username || email.split('@')[0]).toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;

    const rows = await sql`
      INSERT INTO users (id, name, email, username, password, role, phone, is_locked)
      VALUES (
        ${userId},
        ${name.trim()},
        ${email.toLowerCase().trim()},
        ${cleanUsername},
        ${hashedPassword},
        ${role},
        ${phone || ''},
        ${Boolean(isLocked)}
      )
      RETURNING id, name, username, email, role, is_locked as "isLocked", phone, created_at as "createdAt";
    `;

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo người dùng thành công trên Neon PostgreSQL!',
        data: rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi tạo user:', error);
    return NextResponse.json(
      { success: false, message: 'Email hoặc Tài khoản đã tồn tại' },
      { status: 400 }
    );
  }
}
