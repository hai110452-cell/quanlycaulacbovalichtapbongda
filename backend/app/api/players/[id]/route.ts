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
      SELECT id, name, jersey_number as "jerseyNumber", position,
             date_of_birth as "dateOfBirth", phone, status, joined_date as "joinedDate", avatar_url as "avatarUrl"
      FROM players
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy cầu thủ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết cầu thủ:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn' },
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
      UPDATE players
      SET name = COALESCE(${body.name}, name),
          jersey_number = COALESCE(${body.jerseyNumber ? Number(body.jerseyNumber) : null}, jersey_number),
          position = COALESCE(${body.position}, position),
          phone = COALESCE(${body.phone}, phone),
          status = COALESCE(${body.status}, status)
      WHERE id = ${id}
      RETURNING id, name, jersey_number as "jerseyNumber", position,
                date_of_birth as "dateOfBirth", phone, status, joined_date as "joinedDate", avatar_url as "avatarUrl";
    `;

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy cầu thủ để cập nhật' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cầu thủ thành công trên Neon!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi cập nhật cầu thủ:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật dữ liệu' },
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
      DELETE FROM players
      WHERE id = ${id}
      RETURNING id, name;
    `;

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy cầu thủ để xóa' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa cầu thủ khỏi Neon PostgreSQL thành công!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi xóa cầu thủ:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi xóa cầu thủ' },
      { status: 500 }
    );
  }
}
