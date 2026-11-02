const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V0sxefCk4SKP@ep-lingering-paper-b7l71r95-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

const all20Players = [
  { id: 'player-001', name: 'Nguyễn Văn Khải', jerseyNumber: 1, position: 'Thủ môn', phone: '0901111111', dateOfBirth: '1995-03-15', status: 'Đang tập luyện' },
  { id: 'player-002', name: 'Trần Minh Tuấn', jerseyNumber: 2, position: 'Hậu vệ', phone: '0902222222', dateOfBirth: '1994-07-22', status: 'Đang tập luyện' },
  { id: 'player-003', name: 'Lê Quốc Bảo', jerseyNumber: 15, position: 'Hậu vệ', phone: '0903333333', dateOfBirth: '1996-11-08', status: 'Đang tập luyện' },
  { id: 'player-004', name: 'Phạm Thanh Tùng', jerseyNumber: 3, position: 'Hậu vệ', phone: '0904444444', dateOfBirth: '1997-05-30', status: 'Chấn thương' },
  { id: 'player-005', name: 'Vũ Hoàng Nam', jerseyNumber: 6, position: 'Tiền vệ', phone: '0905555555', dateOfBirth: '1995-09-12', status: 'Đang tập luyện' },
  { id: 'player-006', name: 'Đặng Văn Long', jerseyNumber: 8, position: 'Tiền vệ', phone: '0906666666', dateOfBirth: '1998-02-28', status: 'Đang tập luyện' },
  { id: 'player-007', name: 'Hoàng Minh Huy', jerseyNumber: 10, position: 'Tiền vệ', phone: '0907777777', dateOfBirth: '1994-12-05', status: 'Đang tập luyện' },
  { id: 'player-008', name: 'Nguyễn Đức Thắng', jerseyNumber: 7, position: 'Tiền đạo', phone: '0908888888', dateOfBirth: '1996-08-17', status: 'Đang tập luyện' },
  { id: 'player-009', name: 'Bùi Văn Kiên', jerseyNumber: 9, position: 'Tiền đạo', phone: '0909999999', dateOfBirth: '1997-04-03', status: 'Đang tập luyện' },
  { id: 'player-010', name: 'Trịnh Quang Hải', jerseyNumber: 11, position: 'Tiền đạo', phone: '0910000000', dateOfBirth: '1995-10-25', status: 'Đang tập luyện' },
  { id: 'player-011', name: 'Mai Xuân Trường', jerseyNumber: 13, position: 'Hậu vệ', phone: '0911111111', dateOfBirth: '1998-06-14', status: 'Đang tập luyện' },
  { id: 'player-012', name: 'Lý Công Hoàng', jerseyNumber: 14, position: 'Tiền đạo', phone: '0912222222', dateOfBirth: '1999-01-20', status: 'Đang tập luyện' },
  { id: 'player-013', name: 'Đỗ Duy Mạnh', jerseyNumber: 4, position: 'Hậu vệ', phone: '0912345678', dateOfBirth: '1996-09-29', status: 'Đang tập luyện' },
  { id: 'player-014', name: 'Đoàn Văn Hậu', jerseyNumber: 5, position: 'Hậu vệ', phone: '0923456789', dateOfBirth: '1999-04-19', status: 'Chấn thương' },
  { id: 'player-015', name: 'Nguyễn Tuấn Anh', jerseyNumber: 11, position: 'Tiền vệ', phone: '0934567890', dateOfBirth: '1995-05-16', status: 'Đang tập luyện' },
  { id: 'player-016', name: 'Nguyễn Quang Hải', jerseyNumber: 19, position: 'Tiền vệ', phone: '0945678901', dateOfBirth: '1997-04-12', status: 'Đang tập luyện' },
  { id: 'player-017', name: 'Nguyễn Văn Toàn', jerseyNumber: 9, position: 'Tiền đạo', phone: '0956789012', dateOfBirth: '1996-04-12', status: 'Đang tập luyện' },
  { id: 'player-018', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', phone: '0967890123', dateOfBirth: '1997-10-20', status: 'Đang tập luyện' },
  { id: 'player-019', name: 'Lê Văn Đô', jerseyNumber: 17, position: 'Tiền đạo', phone: '0978901234', dateOfBirth: '2001-08-07', status: 'Đang tập luyện' },
  { id: 'player-020', name: 'Khuất Văn Khang', jerseyNumber: 10, position: 'Tiền vệ', phone: '0989012345', dateOfBirth: '2003-05-11', status: 'Đang tập luyện' },
];

async function main() {
  console.log('--- Nạp đầy đủ 20 cầu thủ và chi phí tháng/năm vào Neon DB ---');

  // 1. Chèn / cập nhật bảng players
  for (const p of all20Players) {
    await pool.query(`
      INSERT INTO players (id, name, jersey_number, position, date_of_birth, phone, status, joined_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, '2023-01-15', NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          jersey_number = EXCLUDED.jersey_number,
          position = EXCLUDED.position,
          date_of_birth = EXCLUDED.date_of_birth,
          phone = EXCLUDED.phone,
          status = EXCLUDED.status;
    `, [p.id, p.name, p.jerseyNumber, p.position, p.dateOfBirth, p.phone, p.status]);
  }
  console.log(`✅ Đã đồng bộ ${all20Players.length} cầu thủ vào bảng players!`);

  // 2. Tạo dữ liệu phí cho cả 20 cầu thủ x 2 năm x 12 tháng = 480 bản ghi
  const years = [2025, 2026];
  let feeCount = 0;

  for (const p of all20Players) {
    for (const year of years) {
      for (let m = 1; m <= 12; m++) {
        const id = `fee-${p.id}-${year}-${m}`;
        let status = 'unpaid';
        let paidDate = null;
        let paymentMethod = null;
        let receiptNo = null;

        if (year === 2025) {
          status = 'paid';
          const day = (m * 2 + 5) % 25 + 1;
          paidDate = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          paymentMethod = m % 2 === 0 ? 'Chuyển khoản' : 'Tiền mặt';
          receiptNo = `REC-${year}${String(m).padStart(2, '0')}-${p.id.slice(-3)}`;
        } else if (year === 2026) {
          const charCode = p.id.charCodeAt(p.id.length - 1);
          const seed = (charCode + m) % 10;
          if (m <= 9) {
            status = seed === 0 ? 'unpaid' : 'paid';
          } else if (m === 10) {
            status = seed <= 2 ? 'unpaid' : 'paid';
          } else if (m === 11) {
            status = seed <= 4 ? 'unpaid' : 'paid';
          } else {
            status = seed === 9 ? 'paid' : 'unpaid';
          }

          if (status === 'paid') {
            const day = (m * 3 + 2) % 24 + 1;
            paidDate = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            paymentMethod = seed % 2 === 0 ? 'Chuyển khoản' : 'Tiền mặt';
            receiptNo = `REC-${year}${String(m).padStart(2, '0')}-${p.id.slice(-3)}`;
          }
        }

        await pool.query(`
          INSERT INTO player_fees (id, player_id, year, month, status, amount, paid_date, payment_method, receipt_no, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (player_id, year, month) DO UPDATE
          SET status = EXCLUDED.status,
              amount = EXCLUDED.amount,
              paid_date = EXCLUDED.paid_date,
              payment_method = EXCLUDED.payment_method,
              receipt_no = EXCLUDED.receipt_no,
              updated_at = NOW();
        `, [id, p.id, year, m, status, 300000, paidDate, paymentMethod, receiptNo]);

        feeCount++;
      }
    }
  }

  console.log(`✅ Đã nạp thành công ${feeCount} bản ghi phí hàng tháng/năm của 20 cầu thủ vào bảng player_fees!`);
  await pool.end();
}

main().catch(console.error);
