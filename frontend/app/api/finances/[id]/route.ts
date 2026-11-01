import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/finances/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const finance = await queryOne<any>(`SELECT * FROM finances WHERE id = $1`, [id]);
  if (!finance) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy giao dịch' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapFinance(finance) });
}

// PUT /api/finances/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne<any>(`SELECT * FROM finances WHERE id = $1`, [id]);
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy giao dịch để cập nhật' }, { status: 404 });
  }

  const rows = await query<any>(
    `UPDATE finances SET
      date = $1,
      title = $2,
      category = $3,
      amount = $4,
      person_in_charge = $5,
      notes = $6
     WHERE id = $7
     RETURNING *`,
    [
      body.date ?? existing.date,
      body.title ? body.title.trim() : existing.title,
      body.category ?? existing.category,
      body.amount !== undefined ? Number(body.amount) : existing.amount,
      body.personInCharge ?? body.person_in_charge ?? existing.person_in_charge,
      body.notes ?? existing.notes,
      id,
    ],
  );

  return NextResponse.json({
    success: true,
    message: 'Cập nhật giao dịch thành công!',
    data: mapFinance(rows[0]),
  });
}

// DELETE /api/finances/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const finance = await queryOne<any>(`SELECT id FROM finances WHERE id = $1`, [id]);
  if (!finance) {
    return NextResponse.json({
      success: true,
      message: 'Giao dịch không tồn tại hoặc đã được xóa trước đó!',
      data: { id },
    });
  }
  await query(`DELETE FROM finances WHERE id = $1`, [id]);
  return NextResponse.json({ success: true, message: 'Đã xóa giao dịch thành công!', data: { id } });
}

function mapFinance(f: any) {
  return {
    id: f.id,
    date: f.date,
    title: f.title,
    category: f.category,
    amount: Number(f.amount),
    personInCharge: f.person_in_charge,
    notes: f.notes,
    createdAt: f.created_at,
  };
}
