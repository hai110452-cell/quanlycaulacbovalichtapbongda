import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/attendances?scheduleId=xxx&playerId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scheduleId = searchParams.get('scheduleId');
  const playerId = searchParams.get('playerId');

  let sql = `SELECT * FROM attendances`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (scheduleId) {
    conditions.push(`schedule_id = $${params.length + 1}`);
    params.push(scheduleId);
  }
  if (playerId) {
    conditions.push(`player_id = $${params.length + 1}`);
    params.push(playerId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY id ASC`;

  const rows = await query<any>(sql, params);
  return NextResponse.json({
    success: true,
    total: rows.length,
    data: rows.map(mapAttendance),
  });
}

// POST /api/attendances
export async function POST(request: NextRequest) {
  const body = await request.json();
  const rawList = Array.isArray(body)
    ? body
    : Array.isArray(body?.attendances)
    ? body.attendances
    : [body];
  const defaultScheduleId = body?.scheduleId || 'sched-001';

  for (const item of rawList) {
    if (!item) continue;
    const id = item.id;
    const scheduleId = item.scheduleId || defaultScheduleId;
    const playerId = item.playerId || `p-${Date.now()}`;
    const playerName = item.playerName || item.name || '';
    const status = item.status || 'Có mặt';
    const checkInTime = item.checkInTime || null;
    const note = item.note || null;

    // Kiểm tra bản ghi đã tồn tại theo id hoặc schedule_id + player_id
    let existing = id ? await queryOne<any>(`SELECT id FROM attendances WHERE id = $1`, [id]) : null;
    if (!existing && playerId && scheduleId) {
      existing = await queryOne<any>(
        `SELECT id FROM attendances WHERE schedule_id = $1 AND player_id = $2`,
        [scheduleId, playerId],
      );
    }

    if (existing) {
      await query(
        `UPDATE attendances SET
          status = $1,
          check_in_time = COALESCE($2, check_in_time),
          note = COALESCE($3, note),
          player_name = COALESCE(NULLIF($4, ''), player_name)
         WHERE id = $5`,
        [status, checkInTime, note, playerName, existing.id],
      );
    } else {
      const newId = id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO attendances (id, schedule_id, player_id, player_name, status, check_in_time, note, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [newId, scheduleId, playerId, playerName, status, checkInTime, note],
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Lưu điểm danh thành công!',
    total: rawList.length,
  });
}

function mapAttendance(a: any) {
  return {
    id: a.id,
    scheduleId: a.schedule_id,
    playerId: a.player_id,
    playerName: a.player_name,
    status: a.status,
    checkInTime: a.check_in_time,
    note: a.note,
    createdAt: a.created_at,
  };
}
