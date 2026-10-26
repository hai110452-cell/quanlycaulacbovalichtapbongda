import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const playerId = searchParams.get('playerId');

    let rows;
    if (scheduleId && playerId) {
      rows = await sql`
        SELECT id, schedule_id as "scheduleId", player_id as "playerId",
               player_name as "playerName", status, check_in_time as "checkInTime", note
        FROM attendances
        WHERE schedule_id = ${scheduleId} AND player_id = ${playerId};
      `;
    } else if (scheduleId) {
      rows = await sql`
        SELECT id, schedule_id as "scheduleId", player_id as "playerId",
               player_name as "playerName", status, check_in_time as "checkInTime", note
        FROM attendances
        WHERE schedule_id = ${scheduleId};
      `;
    } else {
      rows = await sql`
        SELECT id, schedule_id as "scheduleId", player_id as "playerId",
               player_name as "playerName", status, check_in_time as "checkInTime", note
        FROM attendances;
      `;
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('Lỗi lấy điểm danh:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn điểm danh' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      for (const item of body) {
        const id = item.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await sql`
          INSERT INTO attendances (id, schedule_id, player_id, player_name, status, check_in_time, note)
          VALUES (
            ${id},
            ${item.scheduleId},
            ${item.playerId},
            ${item.playerName},
            ${item.status || 'Có mặt'},
            ${item.checkInTime || null},
            ${item.note || null}
          )
          ON CONFLICT (id) DO UPDATE
          SET status = EXCLUDED.status,
              check_in_time = EXCLUDED.check_in_time,
              note = EXCLUDED.note;
        `;
      }

      return NextResponse.json({
        success: true,
        message: 'Lưu điểm danh hàng loạt thành công trên Neon!',
        total: body.length,
      });
    }

    const id = body.id || `att-${Date.now()}`;
    const rows = await sql`
      INSERT INTO attendances (id, schedule_id, player_id, player_name, status, check_in_time, note)
      VALUES (
        ${id},
        ${body.scheduleId},
        ${body.playerId},
        ${body.playerName},
        ${body.status || 'Có mặt'},
        ${body.checkInTime || null},
        ${body.note || null}
      )
      ON CONFLICT (id) DO UPDATE
      SET status = EXCLUDED.status,
          check_in_time = EXCLUDED.check_in_time,
          note = EXCLUDED.note
      RETURNING id, schedule_id as "scheduleId", player_id as "playerId",
                player_name as "playerName", status, check_in_time as "checkInTime", note;
    `;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật điểm danh thành công trên Neon!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi lưu điểm danh:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi lưu điểm danh vào Neon CSDL' },
      { status: 400 }
    );
  }
}
