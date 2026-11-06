const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/app/page.tsx',
  'frontend/app/admin/page.tsx',
  'frontend/app/login/page.tsx',
  'frontend/app/matches/page.tsx',
  'frontend/app/players/page.tsx',
  'frontend/app/schedules/page.tsx',
  'frontend/app/layout.tsx',
  'frontend/app/api/teams/route.ts',
  'frontend/app/api/field-bookings/route.ts',
  'frontend/public/js/attendance.js',
  'frontend/public/js/dashboard.js',
  'frontend/public/js/exportUtils.js',
  'frontend/public/js/fields.js',
  'frontend/public/js/matches.js',
  'frontend/public/js/players.js',
  'frontend/public/js/schedules.js',
  'frontend/public/js/teams.js',
  'frontend/public/schedules.html',
  'frontend/public/teams.html',
  'frontend/public/attendance.html',
  'frontend/public/coaches.html',
  'frontend/public/fees.html',
  'frontend/public/fields.html',
  'frontend/public/login.html',
  'frontend/public/matches.html',
  'frontend/public/notifications.html',
  'frontend/public/players.html',
  'frontend/scripts/init-field-bookings.js',
  'frontend/scripts/init-finances-teams.js',
  'frontend/lib/auth-constants.ts',
  'frontend/lib/exportUtils.ts',
  'frontend/scripts/init-finances-teams.js',
  'backend/src/main.ts',
  'backend/src/teams/teams.service.ts',
  'backend/seed.sql'
];

const replacements = [
  ['Được thành lập từ năm 2015, Sao Vàng FC là mái nhà chung kết nối đam mê bóng đá, rèn luyện thể chất và xây dựng phong cách thi đấu hiện đại, công bằng. Chúng tôi tự hào phát triển toàn diện từ lứa tuổi trẻ U17, U21 đến đội 1 chuyên nghiệp và đội bóng đá trong nhà Futsal.', 'Tọa lạc tại số 1B Y Ngông, Tân Tiến, Buôn Ma Thuột, Sân Bóng C1 là điểm hẹn thể thao kết nối đam mê bóng đá, rèn luyện thể chất và tổ chức các trận cầu sôi nổi 24/24. Cụm 2 sân cỏ nhân tạo đạt chuẩn phục vụ thi đấu và tập luyện chuyên nghiệp.'],
  ['Thành lập từ năm 2015, Sao Vàng FC là mái nhà chung kết nối niềm đam mê sân cỏ, đào tạo thể chất toàn diện và bồi dưỡng đạo đức thể thao cho các thế hệ cầu thủ trẻ.', 'Sân Bóng C1 (1B Y Ngông, Buôn Ma Thuột) mở cửa phục vụ 24/24 với cụm 2 sân cỏ nhân tạo cao cấp, dàn đèn cao áp chiếu sáng đêm, bãi đỗ xe và dịch vụ nước uống, bóng thi đấu chu đáo.'],
  ['Hệ thống sân bóng Sao Vàng A (Sân 7), Sân B (Sân 11) đạt chuẩn cỏ nhân tạo FIFA Quality cùng phòng thể lực VO2Max và y tế phục hồi.', 'Cụm 2 sân bóng mini C1 (Sân 1 & Sân 2) đạt chuẩn cỏ nhân tạo cao cấp, dàn đèn chiếu sáng ban đêm 24/24 cùng đầy đủ trang thiết bị tập luyện.'],
  ['CÂU LẠC BỘ BÓNG ĐÁ SAO VÀNG (SAO VANG FC)', 'CÂU LẠC BỘ & SÂN BÓNG C1 (SAN BONG C1)'],
  ['CÂU LẠC BỘ BÓNG ĐÁ SAO VÀNG FC', 'CÂU LẠC BỘ & SÂN BÓNG C1'],
  ['BẢN SẮC & TINH THẦN SAO VÀNG FC', 'BẢN SẮC & TINH THẦN SÂN BÓNG C1'],
  ['Hệ Thống Quản Trị CLB Sao Vàng', 'Hệ Thống Quản Trị Sân Bóng C1'],
  ['Hệ thống Quản lý Câu lạc bộ & Lịch tập Bóng đá Sao Vàng', 'Hệ thống Quản lý Sân bóng & Lịch tập C1'],
  ['Đang tải cổng quản trị nội bộ Sao Vàng FC...', 'Đang tải cổng quản trị nội bộ Sân Bóng C1...'],
  ['Đang tải hệ thống quản lý Sao Vàng FC...', 'Đang tải hệ thống quản lý Sân Bóng C1...'],
  ['Sao Vàng FC - Đội 1 (Tuyển Chính)', 'CLB Sân C1 - Đội 1 (Tuyển Chính)'],
  ['Sao Vàng FC - Tuyến Trẻ U21', 'CLB Sân C1 - Tuyến Trẻ U21'],
  ['Sao Vàng FC - Tuyển Trẻ U21', 'CLB Sân C1 - Tuyến Trẻ U21'],
  ['Sao Vàng FC - Đội Trẻ U17', 'CLB Sân C1 - Đội Trẻ U17'],
  ['Sao Vàng FC - Futsal Team', 'CLB Sân C1 - Futsal Team'],
  ['Sao Vàng FC - Đội 1', 'CLB Sân C1 - Đội 1'],
  ['Sân bóng Sao Vàng A (Sân 7)', 'Sân bóng C1 (Sân 1)'],
  ['Sân bóng Sao Vàng B (Sân 11)', 'Sân bóng C1 (Sân 2)'],
  ['Sân Sao Vàng A & B', 'Sân C1 (Sân 1 & Sân 2)'],
  ['Sân Sao Vàng A', 'Sân C1 (Sân 1)'],
  ['Sân Sao Vàng B', 'Sân C1 (Sân 2)'],
  ['Sân bóng Sao Vàng', 'Sân bóng C1'],
  ['SAO VÀNG FC', 'SÂN BÓNG C1 FC'],
  ['SAO VÀNG', 'SÂN BÓNG C1'],
  ['Sao Vang FC', 'San Bong C1 FC'],
  ['CLB Sao Vàng FC', 'CLB Sân Bóng C1'],
  ['câu lạc bộ Sao Vàng FC', 'câu lạc bộ Sân Bóng C1'],
  ['CLB Sao Vàng', 'CLB Sân Bóng C1'],
  ['Sao Vàng FC', 'CLB Sân Bóng C1'],
  ['Sao Vàng', 'Sân C1']
];

const rootDir = path.resolve(__dirname, '..');

let totalModified = 0;

for (const relPath of targetFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`[SKIP] Khong tim thay: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[OK] Da cap nhat: ${relPath}`);
    totalModified++;
  } else {
    console.log(`[NO CHANGE] ${relPath}`);
  }
}

console.log(`\nHoan tat: da sua ${totalModified} file sang thong tin San C1.`);
