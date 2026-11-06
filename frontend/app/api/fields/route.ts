import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/fields
export async function GET() {
  const fields = await query<any>(`SELECT * FROM fields ORDER BY name ASC`);
  return NextResponse.json({
    success: true,
    total: fields.length,
    data: fields.map(mapField),
  });
}

// POST /api/fields
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = body.id || `field-${Date.now()}`;

  const rows = await query<any>(
    `INSERT INTO fields (id, name, location, field_type, surface_type, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     RETURNING *`,
    [
      id,
      body.name || 'Sân bóng mới',
      body.location || '',
      body.fieldType || body.field_type || 'Sân 7 người',
      body.surfaceType || body.surface_type || 'Cỏ nhân tạo',
      body.status || 'Khả dụng',
    ],
  );

  return NextResponse.json({
    success: true,
    message: 'Thêm sân bóng thành công!',
    data: mapField(rows[0]),
  });
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
