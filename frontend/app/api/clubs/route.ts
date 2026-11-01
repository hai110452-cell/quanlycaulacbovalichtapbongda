import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/clubs
export async function GET() {
  const club = await queryOne<any>(`SELECT * FROM clubs WHERE id = 'default-club'`);
  return NextResponse.json({ success: true, data: club ? mapClub(club) : null });
}

// PUT /api/clubs
export async function PUT(request: NextRequest) {
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM clubs WHERE id = 'default-club'`);

  let rows: any[];
  if (!existing) {
    rows = await query<any>(
      `INSERT INTO clubs (id, name, short_name, established_year, coach, captain, home_stadium, logo_url, description, created_at)
       VALUES ('default-club', $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        body.name || 'Câu Lạc Bộ Bóng Đá',
        body.shortName || null,
        body.establishedYear || null,
        body.coach || null,
        body.captain || null,
        body.homeStadium || null,
        body.logoUrl || null,
        body.description || null,
      ],
    );
  } else {
    rows = await query<any>(
      `UPDATE clubs SET
        name = $1, short_name = $2, coach = $3, captain = $4,
        home_stadium = $5, logo_url = $6, description = $7
       WHERE id = 'default-club'
       RETURNING *`,
      [
        body.name ?? existing.name,
        body.shortName ?? existing.short_name,
        body.coach ?? existing.coach,
        body.captain ?? existing.captain,
        body.homeStadium ?? existing.home_stadium,
        body.logoUrl ?? existing.logo_url,
        body.description ?? existing.description,
      ],
    );
  }

  return NextResponse.json({ success: true, message: 'Cập nhật thông tin CLB thành công!', data: mapClub(rows[0]) });
}

function mapClub(c: any) {
  return {
    id: c.id,
    name: c.name,
    shortName: c.short_name,
    establishedYear: c.established_year,
    coach: c.coach,
    captain: c.captain,
    homeStadium: c.home_stadium,
    logoUrl: c.logo_url,
    description: c.description,
    createdAt: c.created_at,
  };
}
