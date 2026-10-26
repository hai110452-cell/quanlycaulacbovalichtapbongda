import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, location, field_type as "fieldType", surface_type as "surfaceType", status
      FROM fields
      ORDER BY name ASC;
    `;

    return NextResponse.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('Lỗi lấy sân bóng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn danh sách sân bóng' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = `field-${Date.now()}`;

    const rows = await sql`
      INSERT INTO fields (id, name, location, field_type, surface_type, status)
      VALUES (
        ${id},
        ${body.name || 'Sân bóng mới'},
        ${body.location || ''},
        ${body.fieldType || 'Sân 7 người'},
        ${body.surfaceType || 'Cỏ nhân tạo'},
        ${body.status || 'Khả dụng'}
      )
      RETURNING id, name, location, field_type as "fieldType", surface_type as "surfaceType", status;
    `;

    return NextResponse.json(
      {
        success: true,
        message: 'Thêm sân bóng thành công vào Neon!',
        data: rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi thêm sân bóng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi thêm sân bóng' },
      { status: 400 }
    );
  }
}
