import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/schedules/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const schedule = await queryOne<any>(`SELECT * FROM schedules WHERE id = $1`, [id]);
  if (!schedule) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy lịch tập' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapSchedule(schedule) });
}

// PUT /api/schedules/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM schedules WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy lịch tập' }, { status: 404 });
  }

  const rows = await query<any>(
    `UPDATE schedules SET
      title = $1, type = $2, date = $3, start_time = $4, end_time = $5,
      field_id = $6, field_name = $7, coach = $8, status = $9, notes = $10
     WHERE id = $11
     RETURNING *`,
    [
      body.title ?? existing.title,
      body.type ?? existing.type,
      body.date ?? existing.date,
      body.startTime ?? existing.start_time,
      body.endTime ?? existing.end_time,
      body.fieldId ?? existing.field_id,
      body.fieldName ?? existing.field_name,
      body.coach ?? existing.coach,
      body.status ?? existing.status,
      body.notes ?? existing.notes,
      id,
    ],
  );

  return NextResponse.json({ success: true, message: 'Cập nhật lịch tập thành công!', data: mapSchedule(rows[0]) });
}

// DELETE /api/schedules/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const schedule = await queryOne<any>(`SELECT id FROM schedules WHERE id = $1`, [id]);
  if (!schedule) {
    return NextResponse.json({
      success: true,
      message: 'Lịch tập không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM schedules WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Đã hủy/xóa lịch tập thành công!', data: { id } });
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
