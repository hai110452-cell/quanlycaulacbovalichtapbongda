const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V0sxefCk4SKP@ep-lingering-paper-b7l71r95-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  console.log('--- KHỞI TẠO BẢNG FIELD_BOOKINGS TRÊN NEON DB ---');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS field_bookings (
      id VARCHAR(100) PRIMARY KEY,
      field_id VARCHAR(100) NOT NULL,
      field_name VARCHAR(255) NOT NULL,
      booking_date VARCHAR(50) NOT NULL,
      slot_id VARCHAR(50) NOT NULL,
      slot_time VARCHAR(100) NOT NULL,
      slot_label VARCHAR(100) NOT NULL,
      price NUMERIC NOT NULL DEFAULT 400000,
      is_booked BOOLEAN NOT NULL DEFAULT false,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      team_name VARCHAR(255),
      services TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✓ Bảng field_bookings đã sẵn sàng.');

  // Tạo index cho truy vấn nhanh theo ngày và sân
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_field_bookings_date ON field_bookings(booking_date);
    CREATE INDEX IF NOT EXISTS idx_field_bookings_field ON field_bookings(field_id);
  `);

  // Kiểm tra số lượng bản ghi hiện có
  const check = await pool.query('SELECT COUNT(*) FROM field_bookings');
  console.log('Số lượng bản ghi hiện tại:', check.rows[0].count);

  if (parseInt(check.rows[0].count, 10) === 0) {
    console.log('Tiến hành seed dữ liệu demo đặt sân cho hôm nay và các ngày tới...');

    const sampleBookings = [
      // Sân bóng C1 (Sân 7)
      {
        id: 'fb-c1-001',
        field_id: 'field-c1',
        field_name: 'Sân bóng C1',
        booking_date: '2026-11-01',
        slot_id: 'slot-c1-1',
        slot_time: '18:00 - 19:30',
        slot_label: 'Ca Giờ Vàng (Tối)',
        price: 350000,
        is_booked: true,
        customer_name: 'Trần Văn Nam',
        customer_phone: '0912.888.999',
        team_name: 'FC Sân C1 All Stars',
        services: 'Nước khoáng + Thuê bóng',
        notes: 'Đá giao hữu định kỳ ban đêm'
      },
      {
        id: 'fb-c1-002',
        field_id: 'field-c1',
        field_name: 'Sân bóng C1',
        booking_date: '2026-11-01',
        slot_id: 'slot-c1-2',
        slot_time: '19:30 - 21:00',
        slot_label: 'Ca Đêm (Tối muộn)',
        price: 350000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },
      // Sân Sao Vàng A (Sân 7) - Hôm nay 2026-11-01
      {
        id: 'fb-001',
        field_id: 'field-001',
        field_name: 'Sân Sao Vàng A (Sân 7)',
        booking_date: '2026-11-01',
        slot_id: 'slot-1',
        slot_time: '06:00 - 07:30',
        slot_label: 'Ca 1 (Sáng sớm)',
        price: 350000,
        is_booked: true,
        customer_name: 'Nguyễn Văn Mạnh',
        customer_phone: '0912.345.678',
        team_name: 'FC Sunrise Ban Mai',
        services: 'Nước khoáng đóng chai',
        notes: 'Đá giao hữu định kỳ sáng sớm'
      },
      {
        id: 'fb-002',
        field_id: 'field-001',
        field_name: 'Sân Sao Vàng A (Sân 7)',
        booking_date: '2026-11-01',
        slot_id: 'slot-2',
        slot_time: '07:30 - 09:00',
        slot_label: 'Ca 2 (Sáng)',
        price: 350000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },
      {
        id: 'fb-003',
        field_id: 'field-001',
        field_name: 'Sân Sao Vàng A (Sân 7)',
        booking_date: '2026-11-01',
        slot_id: 'slot-3',
        slot_time: '16:00 - 17:30',
        slot_label: 'Ca 3 (Chiều)',
        price: 450000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },
      {
        id: 'fb-004',
        field_id: 'field-001',
        field_name: 'Sân Sao Vàng A (Sân 7)',
        booking_date: '2026-11-01',
        slot_id: 'slot-4',
        slot_time: '17:30 - 19:00',
        slot_label: 'Ca 4 (Giờ Vàng - Chiều tối)',
        price: 550000,
        is_booked: true,
        customer_name: 'Trần Minh Quân',
        customer_phone: '0988.765.432',
        team_name: 'FC Công Nghệ FPT',
        services: 'Áo pitch thi đấu + Nước giải khát',
        notes: 'Cần mượn 2 bóng thi đấu Molten'
      },
      {
        id: 'fb-005',
        field_id: 'field-001',
        field_name: 'Sân Sao Vàng A (Sân 7)',
        booking_date: '2026-11-01',
        slot_id: 'slot-5',
        slot_time: '19:00 - 20:30',
        slot_label: 'Ca 5 (Đỉnh cao - Đèn LED)',
        price: 550000,
        is_booked: true,
        customer_name: 'Lê Hoàng Hải',
        customer_phone: '0903.222.111',
        team_name: 'Sao Vàng FC - Tuyến Trẻ U21',
        services: 'Bật dàn đèn cao áp 100% công suất',
        notes: 'Lịch tập chiến thuật câu lạc bộ'
      },
      {
        id: 'fb-006',
        field_id: 'field-001',
        field_name: 'Sân Sao Vàng A (Sân 7)',
        booking_date: '2026-11-01',
        slot_id: 'slot-6',
        slot_time: '20:30 - 22:00',
        slot_label: 'Ca 6 (Đêm muộn)',
        price: 450000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },

      // Sân Thống Nhất / SVĐ Quốc Gia Sao Vàng (Sân 11 - Chuẩn Olympic như ảnh khách hàng tải lên)
      {
        id: 'fb-011',
        field_id: 'field-003',
        field_name: 'Sân Vận Động Sao Vàng (Sân 11 Chuẩn Quốc Tế)',
        booking_date: '2026-11-01',
        slot_id: 'slot-1',
        slot_time: '06:30 - 08:30',
        slot_label: 'Ca Sáng (2 tiếng thi đấu)',
        price: 1200000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },
      {
        id: 'fb-012',
        field_id: 'field-003',
        field_name: 'Sân Vận Động Sao Vàng (Sân 11 Chuẩn Quốc Tế)',
        booking_date: '2026-11-01',
        slot_id: 'slot-3',
        slot_time: '15:30 - 17:30',
        slot_label: 'Ca Chiều (2 tiếng thi đấu)',
        price: 1500000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },
      {
        id: 'fb-013',
        field_id: 'field-003',
        field_name: 'Sân Vận Động Sao Vàng (Sân 11 Chuẩn Quốc Tế)',
        booking_date: '2026-11-01',
        slot_id: 'slot-4',
        slot_time: '18:00 - 20:30',
        slot_label: 'Ca Tối Đỉnh Cao (Khán đài & Dàn đèn SVĐ)',
        price: 1800000,
        is_booked: true,
        customer_name: 'Phạm Hồng Thái',
        customer_phone: '0977.889.900',
        team_name: 'Sao Vàng FC - Đội 1 (Tuyển Chính) vs FC Hà Nội All Stars',
        services: 'Mở cửa khán đài A + Bảng điện tử LED + Tổ trọng tài VFF',
        notes: 'Trận đại chiến giao hữu phong trào cúp mùa thu'
      },

      // Sân Futsal Olympic (Sàn gỗ trong nhà)
      {
        id: 'fb-021',
        field_id: 'field-004',
        field_name: 'Sân Futsal Olympic Center (Sân Trong Nhà)',
        booking_date: '2026-11-01',
        slot_id: 'slot-2',
        slot_time: '08:00 - 09:30',
        slot_label: 'Ca Sáng',
        price: 300000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      },
      {
        id: 'fb-022',
        field_id: 'field-004',
        field_name: 'Sân Futsal Olympic Center (Sân Trong Nhà)',
        booking_date: '2026-11-01',
        slot_id: 'slot-4',
        slot_time: '17:30 - 19:00',
        slot_label: 'Ca Chiều Tối',
        price: 450000,
        is_booked: true,
        customer_name: 'Võ Minh Tiến',
        customer_phone: '0908.112.233',
        team_name: 'FC Futsal Sài Gòn Phố',
        services: 'Bóng futsal số 4 không nảy + Máy lạnh trung tâm',
        notes: 'Đá tập chiến thuật power-play'
      },
      {
        id: 'fb-023',
        field_id: 'field-004',
        field_name: 'Sân Futsal Olympic Center (Sân Trong Nhà)',
        booking_date: '2026-11-01',
        slot_id: 'slot-5',
        slot_time: '19:00 - 20:30',
        slot_label: 'Ca Tối',
        price: 450000,
        is_booked: false,
        customer_name: null,
        customer_phone: null,
        team_name: null,
        services: null,
        notes: null
      }
    ];

    for (const b of sampleBookings) {
      await pool.query(
        `INSERT INTO field_bookings (
          id, field_id, field_name, booking_date, slot_id, slot_time, slot_label,
          price, is_booked, customer_name, customer_phone, team_name, services, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO NOTHING`,
        [
          b.id, b.field_id, b.field_name, b.booking_date, b.slot_id, b.slot_time, b.slot_label,
          b.price, b.is_booked, b.customer_name, b.customer_phone, b.team_name, b.services, b.notes
        ]
      );
    }
    console.log(`✓ Đã seed thành công ${sampleBookings.length} ca đặt sân mẫu!`);
  }

  await pool.end();
  console.log('--- HOÀN THÀNH SETUP BẢNG FIELD_BOOKINGS ---');
}

main().catch(err => {
  console.error('Lỗi khởi tạo field_bookings:', err);
  pool.end();
});
