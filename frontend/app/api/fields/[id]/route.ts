import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/fields/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const field = await queryOne<any>(`SELECT * FROM fields WHERE id = $1`, [id]);
  if (!field) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy sân bóng' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapField(field) });
}

// PUT /api/fields/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM fields WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy sân bóng' }, { status: 404 });
  }

  const rows = await query<any>(
    `UPDATE fields SET
      name = $1, location = $2, field_type = $3,
      surface_type = $4, status = $5
     WHERE id = $6
     RETURNING *`,
    [
      body.name ?? existing.name,
      body.location ?? existing.location,
      body.fieldType ?? body.field_type ?? existing.field_type,
      body.surfaceType ?? body.surface_type ?? existing.surface_type,
      body.status ?? existing.status,
      id,
    ],
  );

  return NextResponse.json({
    success: true,
    message: 'Cập nhật sân bóng thành công!',
    data: mapField(rows[0]),
  });
}

// DELETE /api/fields/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const field = await queryOne<any>(`SELECT id FROM fields WHERE id = $1`, [id]);
  if (!field) {
    return NextResponse.json({
      success: true,
      message: 'Sân bóng không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM fields WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Đã xóa sân bóng thành công!', data: { id } });
}

function mapField(f: any) {
  return {
    id: f.id,
    name: f.name,
    location: f.location,
    fieldType: f.field_type,
    surfaceType: f.surface_type,
    status: f.status,
    createdAt: f.created_at,
  };
}
