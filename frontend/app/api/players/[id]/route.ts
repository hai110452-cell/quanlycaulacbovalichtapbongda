import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/players/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const player = await queryOne<any>(`SELECT * FROM players WHERE id = $1`, [id]);
  if (!player) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy cầu thủ' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapPlayer(player) });
}

// PUT /api/players/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM players WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy cầu thủ để cập nhật' }, { status: 404 });
  }

  // Kiểm tra trùng số áo (loại trừ chính mình)
  if (body.jerseyNumber !== undefined && body.jerseyNumber !== null && body.jerseyNumber !== '') {
    const jerseyNum = Number(body.jerseyNumber);
    const dup = await queryOne<any>(
      `SELECT id, name FROM players WHERE jersey_number = $1 AND id != $2`,
      [jerseyNum, id],
    );
    if (dup) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Số áo #${jerseyNum} đã thuộc về cầu thủ "${dup.name}". Vui lòng chọn số áo khác!` },
        { status: 400 },
      );
    }
  }

  // Kiểm tra trùng họ tên
  if (body.name && body.name.trim()) {
    const nameClean = body.name.trim();
    const dup = await queryOne<any>(
      `SELECT id FROM players WHERE LOWER(name) = LOWER($1) AND id != $2`,
      [nameClean, id],
    );
    if (dup) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Cầu thủ mang tên "${nameClean}" đã tồn tại trong danh sách!` },
        { status: 400 },
      );
    }
  }

  // Kiểm tra trùng số điện thoại
  if (body.phone && body.phone.trim()) {
    const phoneClean = body.phone.trim();
    const dup = await queryOne<any>(
      `SELECT id, name FROM players WHERE phone = $1 AND id != $2`,
      [phoneClean, id],
    );
    if (dup) {
      return NextResponse.json(
        { success: false, message: `Trùng dữ liệu: Số điện thoại "${phoneClean}" đã được sử dụng bởi cầu thủ "${dup.name}"!` },
        { status: 400 },
      );
    }
  }

  const rows = await query<any>(
    `UPDATE players SET
      name = $1,
      jersey_number = $2,
      position = $3,
      phone = $4,
      status = $5
     WHERE id = $6
     RETURNING *`,
    [
      body.name ? body.name.trim() : existing.name,
      body.jerseyNumber ? Number(body.jerseyNumber) : existing.jersey_number,
      body.position ?? existing.position,
      body.phone ? body.phone.trim() : existing.phone,
      body.status ?? existing.status,
      id,
    ],
  );

  return NextResponse.json({ success: true, message: 'Cập nhật cầu thủ thành công!', data: mapPlayer(rows[0]) });
}

// DELETE /api/players/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const player = await queryOne<any>(`SELECT * FROM players WHERE id = $1`, [id]);
  if (!player) {
    return NextResponse.json({
      success: true,
      message: 'Cầu thủ không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM players WHERE id = $1`, [id]);
  return NextResponse.json({
    success: true,
    message: 'Đã xóa cầu thủ thành công!',
    data: { id, name: player.name },
  });
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
