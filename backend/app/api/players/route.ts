import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const search = searchParams.get('search');

    let rows;
    if (position && position !== 'Tất cả') {
      rows = await sql`
        SELECT id, name, jersey_number as "jerseyNumber", position,
               date_of_birth as "dateOfBirth", phone, status, joined_date as "joinedDate", avatar_url as "avatarUrl"
        FROM players
        WHERE position = ${position}
        ORDER BY jersey_number ASC;
      `;
    } else if (search) {
      const searchPattern = `%${search}%`;
      rows = await sql`
        SELECT id, name, jersey_number as "jerseyNumber", position,
               date_of_birth as "dateOfBirth", phone, status, joined_date as "joinedDate", avatar_url as "avatarUrl"
        FROM players
        WHERE name ILIKE ${searchPattern} OR jersey_number::text ILIKE ${searchPattern}
        ORDER BY jersey_number ASC;
      `;
    } else {
      rows = await sql`
        SELECT id, name, jersey_number as "jerseyNumber", position,
               date_of_birth as "dateOfBirth", phone, status, joined_date as "joinedDate", avatar_url as "avatarUrl"
        FROM players
        ORDER BY jersey_number ASC;
      `;
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách cầu thủ:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn cơ sở dữ liệu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = `player-${Date.now()}`;
    const joinedDate = new Date().toISOString().split('T')[0];

    const rows = await sql`
      INSERT INTO players (id, name, jersey_number, position, date_of_birth, phone, status, joined_date, avatar_url)
      VALUES (
        ${id},
        ${body.name},
        ${Number(body.jerseyNumber) || 99},
        ${body.position || 'Tiền vệ'},
        ${body.dateOfBirth || '2000-01-01'},
        ${body.phone || ''},
        ${body.status || 'Đang thi đấu'},
        ${joinedDate},
        ${body.avatarUrl || null}
      )
      RETURNING id, name, jersey_number as "jerseyNumber", position,
                date_of_birth as "dateOfBirth", phone, status, joined_date as "joinedDate", avatar_url as "avatarUrl";
    `;

    return NextResponse.json(
      {
        success: true,
        message: 'Thêm cầu thủ thành công vào Neon PostgreSQL!',
        data: rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi thêm cầu thủ:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi ghi nhận dữ liệu vào CSDL' },
      { status: 400 }
    );
  }
}
