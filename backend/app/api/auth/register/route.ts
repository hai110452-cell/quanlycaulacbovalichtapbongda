import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, username, role = 'player', phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu!' },
        { status: 400 }
      );
    }

    // Tạo username mặc định nếu không truyền
    const cleanUsername = (username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || `user${Date.now().toString().slice(-4)}`).toLowerCase();

    // Kiểm tra email hoặc username đã tồn tại chưa
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} OR username = ${cleanUsername} LIMIT 1;
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email hoặc Tài khoản này đã tồn tại trên hệ thống!' },
        { status: 409 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;

    // Lưu vào Neon PostgreSQL
    const rows = await sql`
      INSERT INTO users (id, name, email, username, password, role, phone)
      VALUES (
        ${userId},
        ${name.trim()},
        ${email.toLowerCase().trim()},
        ${cleanUsername},
        ${hashedPassword},
        ${role},
        ${phone || ''}
      )
      RETURNING id, name, email, username, role, phone, created_at as "createdAt";
    `;

    const user = rows[0];
    const token = `token_${Buffer.from(JSON.stringify({ id: user.id, username: user.username, email: user.email })).toString('base64')}`;

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        user,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi trong quá trình đăng ký' },
      { status: 500 }
    );
  }
}
