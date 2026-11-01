import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/matches/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const match = await queryOne<any>(`SELECT * FROM matches WHERE id = $1`, [id]);
  if (!match) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy trận đấu' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapMatch(match) });
}

// PUT /api/matches/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM matches WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy trận đấu' }, { status: 404 });
  }

  const rows = await query<any>(
    `UPDATE matches SET
      opponent = $1,
      opponent_logo = $2,
      match_type = $3,
      date = $4,
      time = $5,
      field_name = $6,
      home_score = $7,
      away_score = $8,
      status = $9,
      goal_scorers = $10,
      mvp = $11,
      yellow_cards = $12,
      red_cards = $13,
      notes = $14
     WHERE id = $15
     RETURNING *`,
    [
      body.opponent ?? existing.opponent,
      body.opponentLogo ?? existing.opponent_logo,
      body.matchType ?? existing.match_type,
      body.date ?? existing.date,
      body.time ?? existing.time,
      body.fieldName ?? existing.field_name,
      body.homeScore !== undefined ? Number(body.homeScore) : existing.home_score,
      body.awayScore !== undefined ? Number(body.awayScore) : existing.away_score,
      body.status ?? existing.status,
      body.goalScorers ? JSON.stringify(body.goalScorers) : existing.goal_scorers,
      body.mvp ?? existing.mvp,
      body.yellowCards !== undefined ? Number(body.yellowCards) : existing.yellow_cards,
      body.redCards !== undefined ? Number(body.redCards) : existing.red_cards,
      body.notes ?? existing.notes,
      id,
    ],
  );

  return NextResponse.json({
    success: true,
    message: 'Cập nhật trận đấu thành công!',
    data: mapMatch(rows[0]),
  });
}

// DELETE /api/matches/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const match = await queryOne<any>(`SELECT id FROM matches WHERE id = $1`, [id]);
  if (!match) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy trận đấu' }, { status: 404 });
  }
  await query(`DELETE FROM matches WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Xóa trận đấu thành công!', data: { id } });
}

function mapMatch(m: any) {
  return {
    id: m.id,
    opponent: m.opponent,
    opponentLogo: m.opponent_logo,
    matchType: m.match_type,
    date: m.date,
    time: m.time,
    fieldName: m.field_name,
    homeScore: m.home_score,
    awayScore: m.away_score,
    status: m.status,
    goalScorers: m.goal_scorers,
    mvp: m.mvp,
    yellowCards: m.yellow_cards,
    redCards: m.red_cards,
    notes: m.notes,
    createdAt: m.created_at,
  };
}
