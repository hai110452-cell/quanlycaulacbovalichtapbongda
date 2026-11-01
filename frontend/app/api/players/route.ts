import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/players?position=xxx&search=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position');
  const search = searchParams.get('search');

  let sql = `SELECT * FROM players`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (position && position !== 'Tất cả') {
    conditions.push(`position = $${params.length + 1}`);
    params.push(position);
  }
  if (search) {
    conditions.push(`name ILIKE $${params.length + 1}`);
    params.push(`%${search}%`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY jersey_number ASC`;

  const players = await query<any>(sql, params);
  return NextResponse.json({
    success: true,
    total: players.length,
    data: players.map(mapPlayer),
  });
}

// POST /api/players
export async function POST(request: NextRequest) {
  const body = await request.json();
  const nameClean = (body.name || '').trim();
  const jerseyNum = Number(body.jerseyNumber);

  // Kiểm tra trùng số áo
  if (jerseyNum) {
    const existing = await queryOne<any>(
      `SELECT id, name FROM players WHERE jersey_number = $1`,
      [jerseyNum],
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Số áo #${jerseyNum} đã được đăng ký cho cầu thủ "${existing.name}". Vui lòng chọn số áo khác!` },
        { status: 400 },
      );
    }
  }

  // Kiểm tra trùng họ tên
  if (nameClean) {
    const existing = await queryOne<any>(
      `SELECT id FROM players WHERE LOWER(name) = LOWER($1)`,
      [nameClean],
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Cầu thủ mang tên "${nameClean}" đã tồn tại trong danh sách!` },
        { status: 400 },
      );
    }
  }

  // Kiểm tra trùng số điện thoại
  if (body.phone && body.phone.trim()) {
    const phoneClean = body.phone.trim();
    const existing = await queryOne<any>(
      `SELECT id, name FROM players WHERE phone = $1`,
      [phoneClean],
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Số điện thoại "${phoneClean}" đã được sử dụng bởi cầu thủ "${existing.name}"!` },
        { status: 400 },
      );
    }
  }

  const id = `player-${Date.now()}`;
  const joinedDate = new Date().toISOString().split('T')[0];

  const rows = await query<any>(
    `INSERT INTO players (id, name, jersey_number, position, date_of_birth, phone, status, joined_date, avatar_url, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
     RETURNING *`,
    [
      id,
      nameClean,
      jerseyNum || 99,
      body.position || 'Tiền vệ',
      body.dateOfBirth || '2000-01-01',
      body.phone ? body.phone.trim() : '',
      body.status || 'Đang thi đấu',
      joinedDate,
      body.avatarUrl || null,
    ],
  );

  return NextResponse.json({ success: true, message: 'Thêm cầu thủ thành công!', data: mapPlayer(rows[0]) });
}

function mapPlayer(p: any) {
  return {
    id: p.id,
    name: p.name,
    jerseyNumber: p.jersey_number,
    position: p.position,
    dateOfBirth: p.date_of_birth,
    phone: p.phone,
    status: p.status,
    joinedDate: p.joined_date,
    avatarUrl: p.avatar_url,
    createdAt: p.created_at,
  };
}
