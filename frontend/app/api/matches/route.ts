import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/matches?status=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let sql = `SELECT * FROM matches`;
  const params: any[] = [];

  if (status && status !== 'Tất cả') {
    sql += ` WHERE status = $1`;
    params.push(status);
  }
  sql += ` ORDER BY created_at DESC`;

  const matches = await query<any>(sql, params);
  return NextResponse.json({
    success: true,
    total: matches.length,
    data: matches.map(mapMatch),
  });
}

// POST /api/matches
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = `match-${Date.now()}`;

  const rows = await query<any>(
    `INSERT INTO matches (id, opponent, opponent_logo, match_type, date, time, field_name, home_score, away_score, status, goal_scorers, mvp, yellow_cards, red_cards, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
     RETURNING *`,
    [
      id,
      body.opponent || 'Đối thủ FC',
      body.opponentLogo || null,
      body.matchType || 'Giao hữu',
      body.date || new Date().toISOString().split('T')[0],
      body.time || '16:00',
      body.fieldName || '',
      Number(body.homeScore ?? 0),
      Number(body.awayScore ?? 0),
      body.status || 'Đã kết thúc',
      JSON.stringify(body.goalScorers || []),
      body.mvp || null,
      Number(body.yellowCards ?? 0),
      Number(body.redCards ?? 0),
      body.notes || '',
    ],
  );

  return NextResponse.json({ success: true, message: 'Lưu kết quả trận đấu thành công!', data: mapMatch(rows[0]) });
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
