import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/teams/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const team = await queryOne<any>(`SELECT * FROM teams WHERE id = $1`, [id]);
  if (!team) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy đội bóng' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapTeam(team) });
}

// PUT /api/teams/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM teams WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy đội bóng để cập nhật' }, { status: 404 });
  }

  if (body.name && body.name.trim()) {
    const dup = await queryOne<any>(
      `SELECT id FROM teams WHERE name = $1 AND id != $2`,
      [body.name.trim(), id],
    );
    if (dup) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Đội bóng "${body.name.trim()}" đã tồn tại!` },
        { status: 400 },
      );
    }
  }

  const rows = await query<any>(
    `UPDATE teams SET
      name = $1, level = $2, head_coach = $3, captain = $4,
      member_count = $5, home_pitch = $6, established_year = $7,
      description = $8, status = $9
     WHERE id = $10
     RETURNING *`,
    [
      body.name ?? existing.name,
      body.level ?? existing.level,
      body.headCoach ?? body.head_coach ?? existing.head_coach,
      body.captain ?? existing.captain,
      body.memberCount !== undefined ? Number(body.memberCount) : existing.member_count,
      body.homePitch ?? body.home_pitch ?? existing.home_pitch,
      body.establishedYear ? Number(body.establishedYear) : existing.established_year,
      body.description ?? existing.description,
      body.status ?? existing.status,
      id,
    ],
  );

  return NextResponse.json({ success: true, message: 'Cập nhật đội bóng thành công!', data: mapTeam(rows[0]) });
}

// DELETE /api/teams/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const team = await queryOne<any>(`SELECT * FROM teams WHERE id = $1`, [id]);
  if (!team) {
    return NextResponse.json({
      success: true,
      message: 'Đội bóng không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM teams WHERE id = $1`, [id]);
  return NextResponse.json({
    success: true,
    message: 'Đã xóa đội bóng thành công!',
    data: { id, name: team.name },
  });
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
