import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface PlayerFeeRecord {
  id: string;
  playerId: string;
  playerName?: string;
  jerseyNumber?: number;
  position?: string;
  year: number;
  month: number;
  status: 'paid' | 'unpaid' | 'exempt';
  amount: number;
  paidDate?: string;
  paymentMethod?: string;
  receiptNo?: string;
  notes?: string;
  updatedAt?: string;
}

// GET /api/player-fees?year=2026&month=11&playerId=player-001
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : null;
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : null;
  const playerId = searchParams.get('playerId');

  let sql = `
    SELECT pf.*, p.name as player_name, p.jersey_number, p.position
    FROM player_fees pf
    LEFT JOIN players p ON pf.player_id = p.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (year) {
    conditions.push(`pf.year = $${params.length + 1}`);
    params.push(year);
  }
  if (month) {
    conditions.push(`pf.month = $${params.length + 1}`);
    params.push(month);
  }
  if (playerId) {
    conditions.push(`pf.player_id = $${params.length + 1}`);
    params.push(playerId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY pf.year DESC, pf.month ASC, p.jersey_number ASC`;

  try {
    const rows = await query<any>(sql, params);
    const mapped: PlayerFeeRecord[] = rows.map((r) => ({
      id: r.id,
      playerId: r.player_id,
      playerName: r.player_name || 'Cầu thủ',
      jerseyNumber: r.jersey_number,
      position: r.position,
      year: Number(r.year),
      month: Number(r.month),
      status: r.status,
      amount: Number(r.amount) || 300000,
      paidDate: r.paid_date,
      paymentMethod: r.payment_method,
      receiptNo: r.receipt_no,
      notes: r.notes,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({
      success: true,
      total: mapped.length,
      data: mapped,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/player-fees
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, year, month, status, amount, paymentMethod, notes } = body;

    if (!playerId || !year || !month) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc: playerId, year, month' },
        { status: 400 }
      );
    }

    const feeId = `fee-${playerId}-${year}-${month}`;
    const feeAmount = Number(amount) || 300000;
    const feeStatus = status === 'paid' ? 'paid' : status === 'exempt' ? 'exempt' : 'unpaid';
    const paidDate = feeStatus === 'paid' ? (body.paidDate || new Date().toISOString().split('T')[0]) : null;
    const method = feeStatus === 'paid' ? (paymentMethod || 'Chuyển khoản') : null;
    const receiptNo = feeStatus === 'paid' ? `REC-${year}${String(month).padStart(2, '0')}-${playerId.slice(-3)}` : null;

    const rows = await query<any>(
      `INSERT INTO player_fees (id, player_id, year, month, status, amount, paid_date, payment_method, receipt_no, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (player_id, year, month) DO UPDATE
       SET status = EXCLUDED.status,
           amount = EXCLUDED.amount,
           paid_date = EXCLUDED.paid_date,
           payment_method = EXCLUDED.payment_method,
           receipt_no = EXCLUDED.receipt_no,
           notes = EXCLUDED.notes,
           updated_at = NOW()
       RETURNING *`,
      [feeId, playerId, year, month, feeStatus, feeAmount, paidDate, method, receiptNo, notes || null]
    );

    // Nếu vừa chuyển sang 'paid', tự động thêm một transaction vào bảng finances để đồng bộ quỹ CLB
    if (feeStatus === 'paid') {
      const pRes = await query<any>('SELECT name FROM players WHERE id = $1', [playerId]);
      const pName = pRes[0]?.name || playerId;
      const finId = `fin-fee-${playerId}-${year}-${month}`;
      await query(
        `INSERT INTO finances (id, date, title, category, amount, person_in_charge, notes, created_at)
         VALUES ($1, $2, $3, 'Thu', $4, 'Thủ quỹ CLB', $5, NOW())
         ON CONFLICT (id) DO UPDATE
         SET amount = EXCLUDED.amount,
             title = EXCLUDED.title,
             date = EXCLUDED.date;`,
        [
          finId,
          paidDate,
          `Thu phí sinh hoạt T${month}/${year} - ${pName}`,
          feeAmount,
          `Biên lai: ${receiptNo} (${method})`
        ]
      ).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật trạng thái phí cầu thủ thành công!',
      data: rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
