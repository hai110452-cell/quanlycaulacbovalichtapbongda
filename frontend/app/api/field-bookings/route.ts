import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export interface FieldBooking {
  id: string;
  fieldId: string;
  fieldName: string;
  bookingDate: string;
  slotId: string;
  slotTime: string;
  slotLabel: string;
  price: number;
  isBooked: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  teamName?: string | null;
  services?: string | null;
  notes?: string | null;
  createdAt?: string;
}

function mapRow(r: any): FieldBooking {
  return {
    id: r.id,
    fieldId: r.field_id,
    fieldName: r.field_name,
    bookingDate: r.booking_date,
    slotId: r.slot_id,
    slotTime: r.slot_time,
    slotLabel: r.slot_label,
    price: Number(r.price) || 0,
    isBooked: Boolean(r.is_booked),
    customerName: r.customer_name || null,
    customerPhone: r.customer_phone || null,
    teamName: r.team_name || null,
    services: r.services || null,
    notes: r.notes || null,
    createdAt: r.created_at,
  };
}

// GET /api/field-bookings?date=2026-11-01&fieldId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const fieldId = searchParams.get('fieldId');

    let sql = 'SELECT * FROM field_bookings WHERE 1=1';
    const params: any[] = [];

    if (date) {
      params.push(date);
      sql += ` AND booking_date = $${params.length}`;
    }
    if (fieldId && fieldId !== 'all') {
      params.push(fieldId);
      sql += ` AND field_id = $${params.length}`;
    }

    sql += ' ORDER BY booking_date ASC, slot_time ASC, field_name ASC';

    const rows = await query<any>(sql, params);

    return NextResponse.json({
      success: true,
      total: rows.length,
      data: rows.map(mapRow),
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/field-bookings:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/field-bookings - Đặt sân mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fieldId,
      fieldName,
      bookingDate,
      slotId,
      slotTime,
      slotLabel,
      price,
      customerName,
      customerPhone,
      teamName,
      services,
      notes,
    } = body;

    if (!fieldId || !bookingDate || !slotTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp đầy đủ thông tin: Sân, Ngày, Ca và Thông tin liên hệ của khách hàng!' },
        { status: 400 },
      );
    }

    // Kiểm tra ca này đã có người đặt chưa
    const existing = await queryOne<any>(
      `SELECT * FROM field_bookings WHERE field_id = $1 AND booking_date = $2 AND slot_time = $3`,
      [fieldId, bookingDate, slotTime],
    );

    const bookingId = existing ? existing.id : `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let savedRow: any;
    if (existing) {
      if (existing.is_booked) {
        return NextResponse.json(
          {
            success: false,
            message: `Ca ${slotTime} ngày ${bookingDate} tại sân "${fieldName || existing.field_name}" đã có người đặt trước! Vui lòng chọn ca hoặc sân khác.`,
          },
          { status: 409 },
        );
      }
      // Cập nhật slot khả dụng thành đã đặt
      const updateResult = await query<any>(
        `UPDATE field_bookings
         SET is_booked = true,
             customer_name = $1,
             customer_phone = $2,
             team_name = $3,
             services = $4,
             notes = $5,
             price = COALESCE($6, price)
         WHERE id = $7
         RETURNING *`,
        [customerName, customerPhone, teamName || '', services || '', notes || '', price, existing.id],
      );
      savedRow = updateResult[0];
    } else {
      // Tạo mới slot đã đặt
      const insertResult = await query<any>(
        `INSERT INTO field_bookings (
          id, field_id, field_name, booking_date, slot_id, slot_time, slot_label,
          price, is_booked, customer_name, customer_phone, team_name, services, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [
          bookingId,
          fieldId,
          fieldName || 'Sân bóng Sao Vàng',
          bookingDate,
          slotId || 'slot-custom',
          slotTime,
          slotLabel || 'Ca đặt theo yêu cầu',
          price || 400000,
          true,
          customerName,
          customerPhone,
          teamName || '',
          services || '',
          notes || '',
        ],
      );
      savedRow = insertResult[0];
    }

    // Tự động ghi nhận thông báo cho Ban Quản Lý Sân
    try {
      const notifId = `notif-${Date.now()}`;
      await query(
        `INSERT INTO notifications (id, title, message, type, is_read, created_at)
         VALUES ($1, $2, $3, $4, false, NOW())`,
        [
          notifId,
          `Khách hàng đặt sân mới: ${customerName}`,
          `Khách ${customerName} (${customerPhone}) vừa đặt sân ${fieldName} vào ${slotTime} ngày ${bookingDate}. Tổng tiền: ${Number(price).toLocaleString('vi-VN')} VNĐ.`,
          'booking',
        ],
      );
    } catch (notifErr) {
      console.warn('Không thể tạo notification tự động:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Đặt sân thành công! Câu lạc bộ đã ghi nhận lịch của quý khách.',
      data: mapRow(savedRow),
      receiptCode: `SVB-${Date.now().toString().slice(-6)}`,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/field-bookings:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/field-bookings - Hủy đặt sân (trả lại trạng thái khả dụng)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu id ca đặt sân' }, { status: 400 });
    }

    await query(
      `UPDATE field_bookings
       SET is_booked = false,
           customer_name = NULL,
           customer_phone = NULL,
           team_name = NULL,
           services = NULL,
           notes = NULL
       WHERE id = $1`,
      [id],
    );

    return NextResponse.json({
      success: true,
      message: 'Đã hủy lịch đặt sân thành công! Ca sân đã trở lại trạng thái khả dụng (trống).',
    });
  } catch (error: any) {
    console.error('Lỗi DELETE /api/field-bookings:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
