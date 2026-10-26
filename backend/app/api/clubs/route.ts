import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, short_name as "shortName", established_year as "establishedYear",
             coach, captain, home_stadium as "homeStadium", description
      FROM clubs
      LIMIT 1;
    `;

    return NextResponse.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin CLB:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn cơ sở dữ liệu' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const rows = await sql`
      UPDATE clubs
      SET name = COALESCE(${body.name}, name),
          short_name = COALESCE(${body.shortName}, short_name),
          coach = COALESCE(${body.coach}, coach),
          captain = COALESCE(${body.captain}, captain),
          home_stadium = COALESCE(${body.homeStadium}, home_stadium),
          description = COALESCE(${body.description}, description)
      WHERE id = 'default-club'
      RETURNING id, name, short_name as "shortName", established_year as "establishedYear",
                coach, captain, home_stadium as "homeStadium", description;
    `;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin CLB thành công trên Neon!',
      data: rows[0],
    });
  } catch (error) {
    console.error('Lỗi cập nhật CLB:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi cập nhật CSDL' },
      { status: 500 }
    );
  }
}
