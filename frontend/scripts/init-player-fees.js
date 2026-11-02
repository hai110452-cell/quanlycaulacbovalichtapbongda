const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V0sxefCk4SKP@ep-lingering-paper-b7l71r95-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  console.log('--- Khởi tạo bảng và dữ liệu chi phí cầu thủ hằng tháng & năm trên Neon DB ---');

  // 1. Tạo bảng player_fees
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_fees (
      id VARCHAR(50) PRIMARY KEY,
      player_id VARCHAR(50) NOT NULL,
      year INT NOT NULL,
      month INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
      amount NUMERIC(15,2) NOT NULL DEFAULT 300000,
      paid_date VARCHAR(20),
      payment_method VARCHAR(50),
      receipt_no VARCHAR(50),
      notes TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_player_year_month UNIQUE (player_id, year, month)
    );
  `);
  console.log('✅ Bảng player_fees đã sẵn sàng!');

  // 2. Lấy danh sách cầu thủ hiện có
  const playersRes = await pool.query('SELECT id, name FROM players');
  const players = playersRes.rows;
  console.log(`Tìm thấy ${players.length} cầu thủ trong bảng players`);

  // 3. Tạo dữ liệu phí cho năm 2025 và 2026
  // Định mức: 300.000 VNĐ / tháng
  const years = [2025, 2026];
  let inserted = 0;

  for (const p of players) {
    for (const year of years) {
      for (let m = 1; m <= 12; m++) {
        const id = `fee-${p.id}-${year}-${m}`;
        let status = 'unpaid';
        let paidDate = null;
        let paymentMethod = null;
        let receiptNo = null;

        if (year === 2025) {
          // Năm 2025: Đa số đã nộp đủ
          status = 'paid';
          const day = (m * 2 + 5) % 25 + 1;
          paidDate = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          paymentMethod = m % 2 === 0 ? 'Chuyển khoản' : 'Tiền mặt';
          receiptNo = `REC-${year}${String(m).padStart(2, '0')}-${p.id.slice(-3)}`;
        } else if (year === 2026) {
          // Năm 2026:
          // Tháng 1 -> 9: 90% đã đóng
          // Tháng 10: 85% đã đóng
          // Tháng 11: 65% đã đóng
          // Tháng 12: Đang thu (chưa đóng hoặc đóng sớm)
          const seed = (p.id.charCodeAt(p.id.length - 1) + m) % 10;
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

        inserted++;
      }
    }
  }

  console.log(`✅ Đã nạp thành công ${inserted} bản ghi chi phí cầu thủ hàng tháng cho các năm 2025 & 2026!`);
  await pool.end();
}

main().catch(console.error);
