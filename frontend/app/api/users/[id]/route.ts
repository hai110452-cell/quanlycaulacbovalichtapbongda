import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

// GET /api/users/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await queryOne<any>(
    `SELECT id, name, email, username, role, phone, avatar_url, is_locked, created_at FROM users WHERE id = $1`,
    [id],
  );
  if (!user) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapUser(user) });
}

// PUT /api/users/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM users WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng để cập nhật' }, { status: 404 });
  }

  let newPasswordHash = existing.password;
  if (body.password && body.password.trim()) {
    newPasswordHash = await bcrypt.hash(body.password.trim(), 10);
  }

  const rows = await query<any>(
    `UPDATE users SET
      name = $1,
      phone = $2,
      role = $3,
      is_locked = $4,
      password = $5
     WHERE id = $6
     RETURNING id, name, email, username, role, phone, avatar_url, is_locked, created_at`,
    [
      body.name ? body.name.trim() : existing.name,
      body.phone !== undefined ? body.phone.trim() : existing.phone,
      body.role ?? existing.role,
      body.isLocked !== undefined ? Boolean(body.isLocked) : (body.is_locked !== undefined ? Boolean(body.is_locked) : existing.is_locked),
      newPasswordHash,
      id,
    ],
  );

  return NextResponse.json({
    success: true,
    message: 'Cập nhật người dùng thành công!',
    data: mapUser(rows[0]),
  });
}

// DELETE /api/users/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await queryOne<any>(`SELECT id FROM users WHERE id = $1`, [id]);
  if (!user) {
    return NextResponse.json({
      success: true,
      message: 'Người dùng không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM users WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công!', data: { id } });
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
