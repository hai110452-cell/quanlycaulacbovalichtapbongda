import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const rows = await sql`
      SELECT id, title, type, date, start_time as "startTime", end_time as "endTime",
             field_id as "fieldId", field_name as "fieldName", coach, status, notes
      FROM schedules
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy lịch tập' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi lấy lịch tập:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn lịch tập' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const rows = await sql`
      UPDATE schedules
      SET title = COALESCE(${body.title}, title),
          type = COALESCE(${body.type}, type),
          date = COALESCE(${body.date}, date),
          start_time = COALESCE(${body.startTime}, start_time),
          end_time = COALESCE(${body.endTime}, end_time),
          status = COALESCE(${body.status}, status),
          notes = COALESCE(${body.notes}, notes)
      WHERE id = ${id}
      RETURNING id, title, type, date, start_time as "startTime", end_time as "endTime",
                field_id as "fieldId", field_name as "fieldName", coach, status, notes;
    `;

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy lịch tập để cập nhật' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật lịch tập thành công trên Neon!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi cập nhật lịch tập:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật lịch tập' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const rows = await sql`
      DELETE FROM schedules
      WHERE id = ${id}
      RETURNING id, title;
    `;

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy lịch tập để xóa' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã hủy/xóa lịch tập thành công từ Neon!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi xóa lịch tập:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa lịch tập' },
      { status: 500 }
    );
  }
}
