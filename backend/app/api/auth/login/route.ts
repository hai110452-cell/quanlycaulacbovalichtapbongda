import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = (body.txtID || body.username || body.email || '').trim();
    const password = (body.txtPass || body.password || '').trim();

    // Regex kiểm tra: Min length=6, max length=15, không chứa ký tự đặc biệt
    const validRegex = /^[a-zA-Z0-9]{6,15}$/;

    if (!validRegex.test(accountId) || !validRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tài khoản hoặc mật khẩu không đúng!!!',
        },
        { status: 400 }
      );
    }

    // Tìm kiếm user theo username hoặc email
    const rows = await sql`
      SELECT id, name, email, username, password, role, is_locked as "isLocked",
             phone, avatar_url as "avatarUrl", created_at as "createdAt"
      FROM users
      WHERE username = ${accountId} OR email = ${accountId}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tài khoản hoặc mật khẩu không đúng!!!',
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Kiểm tra tài khoản có bị khóa không
    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          isLocked: true,
          message: 'Tài khoản đã bị khóa!!!',
        },
        { status: 403 }
      );
    }

    // So sánh mật khẩu bằng bcrypt
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tài khoản hoặc mật khẩu không đúng!!!',
        },
        { status: 401 }
      );
    }

    // Đăng nhập thành công -> tạo token
    const token = `token_${Buffer.from(
      JSON.stringify({ id: user.id, username: user.username, email: user.email, role: user.role })
    ).toString('base64')}`;

    delete user.password;

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user,
      token,
    });
  } catch (error) {
    console.error('Lỗi API Login:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Tài khoản hoặc mật khẩu không đúng!!!',
      },
      { status: 500 }
    );
  }
}
