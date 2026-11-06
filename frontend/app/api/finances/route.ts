import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/finances?category=xxx&search=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let sql = `SELECT * FROM finances`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (category && category !== 'Tất cả') {
    conditions.push(`category = $${params.length + 1}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(title ILIKE $${params.length + 1} OR person_in_charge ILIKE $${params.length + 1} OR notes ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY date DESC, created_at DESC`;

  const rows = await query<any>(sql, params);
  return NextResponse.json({
    success: true,
    total: rows.length,
    data: rows.map(mapFinance),
  });
}

// POST /api/finances
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = body.id || `fin-${Date.now()}`;
  const date = body.date || new Date().toISOString().split('T')[0];
  const title = (body.title || '').trim();
  const category = body.category === 'Chi' ? 'Chi' : 'Thu';
  const amount = Number(body.amount) || 0;
  const personInCharge = body.personInCharge || body.person_in_charge || 'Thủ quỹ CLB';
  const notes = body.notes || '';

  if (!title || amount <= 0) {
    return NextResponse.json(
      { success: false, message: 'Vui lòng nhập tiêu đề giao dịch và số tiền hợp lệ (> 0)!' },
      { status: 400 },
    );
  }

  const rows = await query<any>(
    `INSERT INTO finances (id, date, title, category, amount, person_in_charge, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [id, date, title, category, amount, personInCharge, notes],
  );

  return NextResponse.json({
    success: true,
    message: 'Ghi nhận giao dịch chi phí / quỹ thành công!',
    data: mapFinance(rows[0]),
  });
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
