import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

// GET /api/users
export async function GET() {
  const users = await query<any>(`SELECT id, name, email, username, role, phone, avatar_url, is_locked, created_at FROM users ORDER BY created_at DESC`);
  return NextResponse.json({ success: true, total: users.length, data: users.map(mapUser) });
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, username, password, role = 'player', phone, isLocked = false } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu!' },
      { status: 400 },
    );
  }

  const cleanUsername = (username || email.split('@')[0]).toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `user-${Date.now()}`;

  const rows = await query<any>(
    `INSERT INTO users (id, name, email, username, password, role, phone, is_locked, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     RETURNING id, name, email, username, role, phone, avatar_url, is_locked, created_at`,
    [userId, name.trim(), email.toLowerCase().trim(), cleanUsername, hashedPassword, role, phone || '', Boolean(isLocked)],
  );

  return NextResponse.json({ success: true, message: 'Tạo người dùng thành công!', data: mapUser(rows[0]) });
}

function mapUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    phone: u.phone,
    avatarUrl: u.avatar_url,
    isLocked: u.is_locked,
    createdAt: u.created_at,
  };
}
