import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/schedules?status=xxx&date=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date');

  let sql = `SELECT * FROM schedules`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (status && status !== 'Tất cả') {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }
  if (date) {
    conditions.push(`date = $${params.length + 1}`);
    params.push(date);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY date ASC, start_time ASC`;

  const schedules = await query<any>(sql, params);
  return NextResponse.json({
    success: true,
    total: schedules.length,
    data: schedules.map(mapSchedule),
  });
}

// POST /api/schedules
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = `sched-${Date.now()}`;

  const rows = await query<any>(
    `INSERT INTO schedules (id, title, type, date, start_time, end_time, field_id, field_name, coach, status, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
     RETURNING *`,
    [
      id,
      body.title || 'Buổi tập mới',
      body.type || 'Tập thể lực',
      body.date || new Date().toISOString().split('T')[0],
      body.startTime || '18:00',
      body.endTime || '20:00',
      body.fieldId || '',
      body.fieldName || '',
      body.coach || '',
      body.status || 'Sắp diễn ra',
      body.notes || '',
    ],
  );

  return NextResponse.json({ success: true, message: 'Tạo lịch tập luyện thành công!', data: mapSchedule(rows[0]) });
}

function mapSchedule(s: any) {
  return {
    id: s.id,
    title: s.title,
    type: s.type,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    fieldId: s.field_id,
    fieldName: s.field_name,
    coach: s.coach,
    status: s.status,
    notes: s.notes,
    createdAt: s.created_at,
  };
}
