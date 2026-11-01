import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// PUT /api/notifications/:id (mark single as read)
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await query(`UPDATE notifications SET read = true WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Đã đánh dấu thông báo là đã đọc' });
}

// DELETE /api/notifications/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const notif = await queryOne<any>(`SELECT id FROM notifications WHERE id = $1`, [id]);
  if (!notif) {
    return NextResponse.json({
      success: true,
      message: 'Thông báo không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM notifications WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Đã xóa thông báo thành công', data: { id } });
}
