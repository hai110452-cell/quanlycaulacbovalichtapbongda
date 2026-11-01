import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/teams
export async function GET() {
  const teams = await query<any>(`SELECT * FROM teams ORDER BY id ASC`);
  return NextResponse.json({ success: true, total: teams.length, data: teams.map(mapTeam) });
}

// POST /api/teams
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.name && body.name.trim()) {
    const existing = await queryOne<any>(
      `SELECT id FROM teams WHERE name = $1`,
      [body.name.trim()],
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Đội bóng "${body.name.trim()}" đã tồn tại!` },
        { status: 400 },
      );
    }
  }

  const id = body.id || `team-${Date.now()}`;
  const rows = await query<any>(
    `INSERT INTO teams (id, name, level, head_coach, captain, member_count, home_pitch, established_year, description, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
     RETURNING *`,
    [
      id,
      body.name ? body.name.trim() : 'Đội bóng mới',
      body.level || 'Đội bóng trực thuộc CLB',
      body.headCoach || body.head_coach || 'Chưa phân công',
      body.captain || 'Chưa chỉ định',
      Number(body.memberCount || body.member_count) || 0,
      body.homePitch || body.home_pitch || 'Sân bóng Sao Vàng',
      Number(body.establishedYear || body.established_year) || 2024,
      body.description || '',
      body.status || 'Hoạt động',
    ],
  );

  return NextResponse.json({ success: true, message: 'Thêm đội bóng thành công!', data: mapTeam(rows[0]) });
}

function mapTeam(t: any) {
  return {
    id: t.id,
    name: t.name,
    level: t.level,
    headCoach: t.head_coach,
    captain: t.captain,
    memberCount: t.member_count,
    homePitch: t.home_pitch,
    establishedYear: t.established_year,
    description: t.description,
    status: t.status,
    createdAt: t.created_at,
  };
}
