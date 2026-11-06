import { UserRole } from '../types';

export interface TestAccount {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  roleGroup: 'ADMIN' | 'MANAGER' | 'STAFF' | 'COACH' | 'USER';
  roleTitle: string;
  desc: string;
  avatar: string;
}

export interface RoleDetail {
  id: 'ADMIN' | 'MANAGER' | 'STAFF' | 'COACH' | 'USER';
  name: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  summary: string;
  permissions: string[];
}

export const ROLE_DEFINITIONS: Record<'ADMIN' | 'MANAGER' | 'STAFF' | 'COACH' | 'USER', RoleDetail> = {
  ADMIN: {
    id: 'ADMIN',
    name: 'Chủ Sân',
    subtitle: 'Chủ Sân C1 - Toàn quyền điều hành tối cao & Quản lý toàn diện',
    color: '#e11d48',
    bgColor: 'rgba(225, 29, 72, 0.1)',
    borderColor: 'rgba(225, 29, 72, 0.3)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    summary: 'Toàn quyền tối cao quản trị hệ thống. Xem báo cáo tổng năm, tạo mới sân bóng, quản lý nhân viên và phân quyền tất cả tài khoản.',
    permissions: [
      'Toàn quyền quản trị hệ thống (Full Access RBAC)',
      'Quản lý doanh thu toàn diện, xem báo cáo tài chính tổng năm',
      'Tạo mới, chỉnh sửa, định giá và cấu hình cụm sân bóng',
      'Quản lý, phân công và bổ nhiệm nhân sự (Quản lý, Nhân viên, HLV, Cầu thủ)',
      'Xem Dashboard thống kê tổng quan KPI, tỷ lệ lấp đầy ca sân toàn hệ thống',
      'Toàn quyền can thiệp phê duyệt, dời lịch, hủy bỏ mọi giao dịch và đơn đặt sân',
    ],
  },
  MANAGER: {
    id: 'MANAGER',
    name: 'Quản Lý',
    subtitle: 'Quản Lý Sân Bãi & Điều Phối Lịch Trực C1',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    summary: 'Quản lý 4 trụ cột nghiệp vụ: 1. Sân bãi & Kho thiết bị; 2. Lịch đặt & Điều phối đa sân; 3. Duyệt CLB & Gán HLV; 4. Thu ngân & Báo cáo ca/ngày (Không xem báo cáo tổng năm như Chủ Sân).',
    permissions: [
      'Quản lý Sân bãi & Thiết bị: Cập nhật trạng thái sân (bảo trì mặt cỏ, hỏng dàn đèn); Quản lý kho thiết bị phụ trợ (cho thuê bóng, áo bib, bán nước uống)',
      'Quản lý Lịch đặt & Điều phối: Duyệt, hủy hoặc dời lịch đặt sân từ các Câu lạc bộ/Người dùng; Xử lý các trường hợp trùng lịch (Conflict resolution); Xem toàn cảnh lịch của tất cả các sân dưới dạng Timeline/Calendar',
      'Quản lý Câu lạc bộ & Nhân sự: Duyệt yêu cầu thành lập Câu lạc bộ mới trên hệ thống; Gán quyền Huấn luyện viên (Coach) cho các tài khoản hợp lệ; Cảnh báo hoặc khóa tài khoản của người dùng/CLB vi phạm nội quy sân',
      'Thanh toán & Hóa đơn: Xác nhận các giao dịch chuyển khoản/tiền mặt hoàn tất; Xuất biên lai, xem báo cáo doanh thu theo ca làm việc hoặc theo ngày (Không xem được báo cáo tổng năm như Chủ Sân)',
    ],
  },
  STAFF: {
    id: 'STAFF',
    name: 'Nhân Viên',
    subtitle: 'Nhân Viên Trực Ca & Bàn Giao Sân C1',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    summary: 'Trực ca sân thực tế, đón khách check-in, cấp phát thu hồi thiết bị, ghi nhận thanh toán tại quầy và báo cáo ca trực.',
    permissions: [
      'Trực ca sân thực tế, hỗ trợ khách hàng check-in và nhận sân đúng giờ',
      'Cấp phát, kiểm đếm và thu hồi thiết bị phụ trợ (bóng thi đấu, áo bib, nước uống) theo ca',
      'Thu tiền mặt hoặc kiểm tra mã QR chuyển khoản trực tiếp tại quầy theo ca trực',
      'Tiếp nhận và duyệt các yêu cầu đặt sân nhanh tại quầy cho khách vãng lai',
      'Ghi chép sổ bàn giao ca trực và lập báo cáo doanh thu trong ca làm việc của mình',
    ],
  },
  COACH: {
    id: 'COACH',
    name: 'Huấn Luyện Viên',
    subtitle: 'Huấn Luyện Viên - Ban Huấn Luyện & Chuyên Môn Đội Bóng',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.1)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    summary: 'Lên lịch tập & điểm danh đội mình. Mượn trang thiết bị tập luyện. Chỉ xem thu chi quỹ và thông báo (không có quyền xóa sửa).',
    permissions: [
      'Lịch tập (Schedules): Tạo mới, chỉnh sửa, hoặc hủy lịch tập bóng đá cho đội của mình',
      'Điểm danh (Attendance): Đánh dấu sự có mặt, đi muộn, vắng phép của các thành viên sau mỗi buổi tập',
      'Thiết bị tập luyện: Đăng ký mượn bóng thi đấu và áo bib phục vụ các buổi tập của đội',
      'Thanh toán (Finances): Chỉ xem ma trận nộp phí cầu thủ & sổ quỹ CLB (Tuyệt đối không có quyền xóa sửa)',
      'Thông báo (Announcements): Chỉ xem bảng tin chỉ đạo từ Ban quản trị (Tuyệt đối không có quyền tạo/xóa/sửa)',
      'Đội hình & Thể lực: Theo dõi hồ sơ thể lực, chỉ số nhân trắc học và vị trí sở trường của từng cầu thủ',
    ],
  },
  USER: {
    id: 'USER',
    name: 'Cầu Thủ',
    subtitle: 'Cầu Thủ & Thành Viên Câu Lạc Bộ C1',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
    badgeClass: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
    summary: 'Tra cứu sân trống, đặt sân trực tuyến, xem lịch sử thi đấu và quản lý hồ sơ cá nhân cầu thủ.',
    permissions: [
      'Tra cứu lịch trống trực tuyến và bảng giá thuê sân theo thời gian thực (24/24)',
      'Đặt sân trực tuyến nhanh chóng, chọn dịch vụ đi kèm và nhận mã biên lai tự động',
      'Xem lịch sử đặt sân, lịch sử thi đấu và lịch tập luyện của bản thân',
      'Xem và cập nhật thông tin cá nhân, hồ sơ cầu thủ (chiều cao, cân nặng, vị trí thi đấu, chân thuận)',
      'Theo dõi tỷ lệ chuyên cần cá nhân và danh sách các cầu thủ cùng đội bóng',
    ],
  },
};

export const PRESET_TEST_ACCOUNTS: TestAccount[] = [
  // 1. NHÓM CHỦ SÂN (ADMIN)
  {
    username: 'admin',
    password: '123456',
    name: 'Chủ Sân C1 (Toàn Quyền)',
    role: 'admin',
    roleGroup: 'ADMIN',
    roleTitle: 'Chủ Sân (Toàn quyền hệ thống)',
    desc: 'Toàn quyền hệ thống. Quản lý doanh thu tổng năm, tạo mới sân bóng, quản lý nhân viên, và xem thống kê tổng quan.',
    avatar: '👑',
  },
  {
    username: 'chusan',
    password: '123456',
    name: 'Ban Điều Hành Sân C1',
    role: 'admin',
    roleGroup: 'ADMIN',
    roleTitle: 'Chủ Sân (Quản trị cơ sở)',
    desc: 'Quản lý tài chính, phân quyền nhân sự và giám sát doanh thu tổng quan',
    avatar: '🛡️',
  },

  // 2. NHÓM QUẢN LÝ (MANAGER)
  {
    username: 'manager',
    password: '123456',
    name: 'Quản Lý Sân Bãi & Điều Phối C1',
    role: 'manager',
    roleGroup: 'MANAGER',
    roleTitle: 'Quản Lý (Sân bãi & Điều phối)',
    desc: 'Cập nhật trạng thái sân/thiết bị, duyệt & dời lịch đặt, xử lý trùng lịch, duyệt CLB, gán quyền HLV, xuất biên lai & xem doanh thu ca/ngày.',
    avatar: '👔',
  },

  // 3. NHÓM NHÂN VIÊN (STAFF)
  {
    username: 'staff',
    password: '123456',
    name: 'Nhân Viên Điều Phối Sân C1',
    role: 'staff',
    roleGroup: 'STAFF',
    roleTitle: 'Nhân Viên (Trực ca sân)',
    desc: 'Trực ca, bàn giao sân thực tế, cấp phát bóng & áo bib thi đấu, kiểm tra thanh toán',
    avatar: '⚡',
  },

  // 4. NHÓM HUẤN LUYỆN VIÊN (COACH)
  {
    username: 'coach',
    password: '123456',
    name: 'HLV. Nguyễn Văn Huấn',
    role: 'coach',
    roleGroup: 'COACH',
    roleTitle: 'Huấn Luyện Viên (Đội 1)',
    desc: 'Lịch tập (Schedules): Tạo mới, chỉnh sửa, hoặc hủy lịch tập bóng đá cho đội của mình. Điểm danh (Attendance): Đánh dấu sự có mặt của các thành viên sau mỗi buổi tập.',
    avatar: '🧢',
  },
  {
    username: 'coach01',
    password: '123456',
    name: 'HLV. Trần Đình Trọng',
    role: 'coach',
    roleGroup: 'COACH',
    roleTitle: 'Huấn Luyện Viên (Tuyến trẻ U21)',
    desc: 'Tạo và chỉnh sửa lịch tập, điểm danh quân số và phân loại giáo án kỹ chiến thuật',
    avatar: '⚽',
  },

  // 5. NHÓM CẦU THỦ (PLAYER / USER)
  {
    username: 'user01',
    password: '123456',
    name: 'Khách Đặt Sân Giao Hữu',
    role: 'user',
    roleGroup: 'USER',
    roleTitle: 'Cầu Thủ / Khách Đặt Sân',
    desc: 'Xem lịch trống, đặt sân, xem lịch sử đá bóng của bản thân, và quản lý thông tin cá nhân.',
    avatar: '📱',
  },
  {
    username: 'quanghai19',
    password: '123456',
    name: 'Nguyễn Quang Hải (#19)',
    role: 'player',
    roleGroup: 'USER',
    roleTitle: 'Cầu Thủ (CLB Sân C1)',
    desc: 'Theo dõi lịch tập của bản thân, tra cứu điểm danh và cập nhật hồ sơ cá nhân',
    avatar: '🏃',
  },
  {
    username: 'khachhang',
    password: '123456',
    name: 'Đại Diện Đội Bóng Phong Trào',
    role: 'user',
    roleGroup: 'USER',
    roleTitle: 'Cầu Thủ / Khách Hàng',
    desc: 'Đặt sân bóng mini cỏ nhân tạo C1, nhận biên lai và chọn dịch vụ kèm theo',
    avatar: '👟',
  },
];
