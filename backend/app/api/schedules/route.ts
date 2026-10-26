import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let rows;
    if (status && status !== 'Tất cả') {
      rows = await sql`
        SELECT id, title, type, date, start_time as "startTime", end_time as "endTime",
               field_id as "fieldId", field_name as "fieldName", coach, status, notes
        FROM schedules
        WHERE status = ${status}
        ORDER BY date ASC, start_time ASC;
      `;
    } else {
      rows = await sql`
        SELECT id, title, type, date, start_time as "startTime", end_time as "endTime",
               field_id as "fieldId", field_name as "fieldName", coach, status, notes
        FROM schedules
        ORDER BY date ASC, start_time ASC;
      `;
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch tập:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn lịch tập từ cơ sở dữ liệu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = `sched-${Date.now()}`;

    const rows = await sql`
      INSERT INTO schedules (id, title, type, date, start_time, end_time, field_id, field_name, coach, status, notes)
      VALUES (
        ${id},
        ${body.title || 'Buổi tập mới'},
        ${body.type || 'Tập thể lực'},
        ${body.date || new Date().toISOString().split('T')[0]},
        ${body.startTime || '18:00'},
        ${body.endTime || '20:00'},
        ${body.fieldId || 'field-1'},
        ${body.fieldName || 'Sân bóng Sao Vàng A (Sân 7)'},
        ${body.coach || 'HLV. Nguyễn Văn Huấn'},
        ${body.status || 'Sắp diễn ra'},
        ${body.notes || ''}
      )
      RETURNING id, title, type, date, start_time as "startTime", end_time as "endTime",
                field_id as "fieldId", field_name as "fieldName", coach, status, notes;
    `;

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo lịch tập luyện thành công trên Neon!',
        data: rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi tạo lịch tập:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tạo lịch tập luyện' },
      { status: 400 }
    );
  }
}
