import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/notifications
export async function GET() {
  const notifications = await query<any>(
    `SELECT * FROM notifications ORDER BY created_at DESC`,
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json({
    success: true,
    total: notifications.length,
    unreadCount,
    data: notifications.map(mapNotification),
  });
}

// POST /api/notifications
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = body.id || `notif-${Date.now()}`;
  const timestamp = body.timestamp || new Date().toLocaleString('vi-VN');

  const rows = await query<any>(
    `INSERT INTO notifications (id, title, message, type, timestamp, read, schedule_id, created_at)
     VALUES ($1,$2,$3,$4,$5,false,$6,NOW())
     RETURNING *`,
    [
      id,
      body.title || 'Thông báo mới',
      body.message || '',
      body.type || 'new',
      timestamp,
      body.scheduleId || body.schedule_id || null,
    ],
  );

  return NextResponse.json({
    success: true,
    message: 'Tạo thông báo thành công!',
    data: mapNotification(rows[0]),
  });
}

// PUT /api/notifications (mark read)
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (body.markAllAsRead) {
    await query(`UPDATE notifications SET read = true WHERE read = false`);
    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    });
  }

  if (body.id) {
    await query(`UPDATE notifications SET read = true WHERE id = $1`, [body.id]);
    return NextResponse.json({
      success: true,
      message: 'Cập nhật trạng thái thông báo thành công',
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/notifications (clear all)
export async function DELETE() {
  await query(`DELETE FROM notifications`);
  return NextResponse.json({
    success: true,
    message: 'Đã xóa toàn bộ lịch sử thông báo',
  });
}

function mapNotification(n: any) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: n.timestamp,
    read: n.read,
    scheduleId: n.schedule_id,
    createdAt: n.created_at,
  };
}
