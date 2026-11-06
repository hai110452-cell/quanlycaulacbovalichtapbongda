'use client';

import React, { useState } from 'react';

interface FeatureDetail {
  title: string;
  desc: string;
  icon: string;
  tags: string[];
}

interface MemberCV {
  name: string;
  role: string;
  major: string;
  school: string;
  avatar: string;
  image?: string;
  summary: string;
  responsibilities: string[];
  skills: string[];
  projectContributions: string[];
  featureDetails: FeatureDetail[];
  contact: {
    email: string;
    phone: string;
    github?: string;
  };
}

const MEMBERS_CV: Record<'hai' | 'bao', MemberCV> = {
  hai: {
    name: 'Nguyễn Minh Hải',
    role: 'Backend Developer',
    major: 'Công Nghệ Thông Tin (Khoa CNTT - Lớp IT24M)',
    school: 'Đồ Án Cuối Kỳ - Lập Trình Mã Nguồn Mở',
    avatar: '👨‍💻',
    image: '/avatar-hai.jpg',
    summary:
      'Phụ trách toàn bộ mảng Backend và Cơ sở dữ liệu: Phân tích thiết kế cơ sở dữ liệu quan hệ PostgreSQL (Neon DB), xây dựng hệ sinh thái RESTful API bằng NestJS và TypeORM, xử lý logic nghiệp vụ đặt sân C1 24/24, quản lý quỹ thu chi và xác thực bảo mật JWT đa quyền (Admin/Coach/Player).',
    responsibilities: [
      'Thiết kế mô hình dữ liệu quan hệ (ERD) và quản trị Database PostgreSQL trên Neon Cloud',
      'Xây dựng toàn bộ hệ sinh thái RESTful API bằng NestJS: Sân bãi, Đội bóng, Lịch tập, Điểm danh, Tài chính',
      'Xử lý nghiệp vụ phân bổ khung giờ đặt sân C1 (250k - 350k/h), tránh xung đột lịch đá',
      'Triển khai cơ chế bảo mật xác thực JSON Web Token (JWT) và kiểm soát quyền truy cập RBAC',
      'Viết tài liệu API và deploy Backend lên nền tảng đám mây Wispbyte (haiandbao.wispbyte.app)',
    ],
    skills: ['Backend Development', 'NestJS', 'Node.js', 'PostgreSQL / Neon DB', 'TypeORM', 'RESTful API', 'JWT Authentication', 'Wispbyte Cloud'],
    projectContributions: [
      'Xây dựng kiến trúc Backend NestJS phân tầng Controller - Service - Entity chuẩn Enterprise',
      'Phát triển API đặt sân bóng C1 và đồng bộ dữ liệu thời gian thực',
      'Cấu hình CORS và bảo mật liên thông dữ liệu an toàn giữa Frontend và Backend',
    ],
    featureDetails: [
      {
        icon: '⚡',
        title: 'Kiến Trúc Máy Chủ NestJS Đa Tầng (Enterprise Modular Architecture)',
        desc: 'Thiết kế cấu trúc mã nguồn Backend NestJS theo mô hình module hóa chặt chẽ: Controller tiếp nhận và phân phối HTTP request, Service chứa toàn bộ quy tắc nghiệp vụ, Entity ánh xạ cấu trúc bảng PostgreSQL qua TypeORM, và DTO kiểm soát tính hợp lệ dữ liệu đầu vào.',
        tags: ['NestJS Framework', 'Controller - Service - Entity', 'DTO & Class-Validator', 'TypeORM'],
      },
      {
        icon: '🗄️',
        title: 'Thiết Kế & Tối Ưu Hóa Database PostgreSQL Trên Neon Cloud',
        desc: 'Xây dựng lược đồ quan hệ thực thể (ERD) gồm 9 bảng dữ liệu nghiệp vụ: users, teams, players, coaches, schedules, attendance, fields, bookings, finances. Khởi tạo bộ dữ liệu mẫu (seed.sql) chuẩn hóa cho sân C1 và tối ưu hóa index truy vấn nhanh chóng.',
        tags: ['PostgreSQL DB', 'Neon Serverless', 'ERD 9 bảng', 'SQL Indexing', 'Seed Data'],
      },
      {
        icon: '🏟️',
        title: 'RESTful API Nghiệp Vụ Quản Lý & Đặt Sân C1 (Field Booking API)',
        desc: 'Phát triển các endpoint tra cứu tình trạng sân trống theo ngày, tiếp nhận đơn đặt sân trực tuyến, thuật toán tự động tính giá lũy tiến theo khung giờ ngày (250.000 đ/h) và khung giờ tối có đèn cao áp (350.000 đ/h). Tích hợp cơ chế khóa ca tránh race-condition đặt trùng thời gian.',
        tags: ['RESTful API', 'Khóa ca chống race-condition', 'Tính giá tự động', '24/24 Sân C1'],
      },
      {
        icon: '📅',
        title: 'API Lịch Huấn Luyện & Thuật Toán Điểm Danh Số Lượng Lớn (Bulk Attendance)',
        desc: 'Xử lý CRUD lịch tập luyện cho 4 tuyến đội, thuật toán kiểm tra xung đột thời gian và sân tập giữa các đội bóng. Xây dựng API điểm danh hàng loạt (Bulk Attendance Update) cho phép lưu trạng thái của toàn bộ cầu thủ trong buổi tập chỉ bằng một Transaction cơ sở dữ liệu duy nhất.',
        tags: ['Bulk Attendance API', 'Kiểm tra xung đột lịch', 'Database Transaction', 'Quản lý lịch tập'],
      },
      {
        icon: '💰',
        title: 'API Quản Trị Quỹ Sinh Hoạt & Báo Cáo Dòng Tiền Thu Chi',
        desc: 'Tính toán tức thì tổng thu từ tiền đặt sân/quỹ đóng, tổng chi tiền thuê sân bãi/trang thiết bị và số dư quỹ tiền mặt khả dụng. Cung cấp API truy vấn ma trận đóng quỹ 12 tháng của từng cầu thủ trong CLB phục vụ công tác đối soát của ban điều hành.',
        tags: ['Báo cáo thu chi', 'Tính toán số dư thời gian thực', 'Ma trận quỹ 12 tháng', 'Đối soát tài chính'],
      },
      {
        icon: '🛡️',
        title: 'Hệ Thống Bảo Mật Xác Thực JWT & Phân Quyền Vai Trò (RBAC Guard)',
        desc: 'Bảo mật mật khẩu người dùng bằng giải thuật mã hóa một chiều Bcrypt salt 10 rounds. Cấp phát chữ ký số JSON Web Token (JWT) an toàn và triển khai Guard / Decorator kiểm soát truy cập nghiêm ngặt theo 3 cấp quyền: Quản trị viên (Admin), Ban huấn luyện (Coach), Cầu thủ (Player).',
        tags: ['Bcrypt Hashing', 'JWT Token Security', 'RBAC Role Guards', 'Phân quyền 3 cấp'],
      },
      {
        icon: '🚀',
        title: 'Triển Khai Đám Mây Wispbyte & Cấu Hình Liên Thông An Toàn',
        desc: 'Deploy toàn bộ hệ thống Backend lên hạ tầng đám mây Wispbyte (haiandbao.wispbyte.app), thiết lập chứng chỉ SSL/TLS HTTPS bảo mật, cấu hình CORS đa nguồn cho phép liên thông mượt mà với Frontend chạy trên máy chủ trường DirectAdmin.',
        tags: ['Wispbyte Cloud', 'CORS Security', 'SSL/TLS HTTPS', 'API Health Check'],
      },
    ],
    contact: {
      email: 'nguyenhaisun206@gmail.com',
      phone: '0389894084',
      github: 'github.com/hai110452-cell',
    },
  },
  bao: {
    name: 'Trương Kỳ Gia Bảo',
    role: 'Frontend Developer',
    major: 'Công Nghệ Thông Tin (Khoa CNTT - Lớp IT24M)',
    school: 'Đồ Án Cuối Kỳ - Lập Trình Mã Nguồn Mở',
    avatar: '⚡',
    image: '/avatar-bao.jpg',
    summary:
      'Phụ trách toàn bộ mảng Frontend của hệ thống: Thiết kế giao diện người dùng (UI/UX), xây dựng các phân hệ quản trị bằng Next.js 16 và React 19, tối ưu hóa responsive trên mọi thiết bị bằng Tailwind CSS, xử lý tương tác động client-side và đóng gói Static Export triển khai chuẩn hóa lên máy chủ web DirectAdmin.',
    responsibilities: [
      'Xây dựng toàn bộ kiến trúc giao diện Frontend Next.js 16 (App Router) & React 19',
      'Thiết kế giao diện các module: Quản lý sân bóng C1, Lịch tập, Điểm danh, Tuyến đội, Cầu thủ, Phí sinh hoạt và Thông báo',
      'Tối ưu hóa UI/UX Responsive, hiệu ứng tương tác, tông màu nhận diện Xanh lá Sân cỏ C1',
      'Chuyển đổi đường dẫn tương đối (Relative Path) và xử lý tương thích khi deploy lên DirectAdmin',
      'Tích hợp kết nối dữ liệu API thời gian thực với hệ thống Backend',
    ],
    skills: ['Frontend Development', 'Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Responsive UI/UX', 'Static Export', 'DirectAdmin'],
    projectContributions: [
      'Phát triển hoàn chỉnh giao diện Quản lý & Đặt sân bóng C1 (1B Y Ngông, Buôn Ma Thuột)',
      'Xây dựng bộ lọc, tìm kiếm nâng cao và bảng điều khiển trực quan cho ban điều hành',
      'Đóng gói hệ thống tĩnh chuẩn hóa phục vụ nghiệm thu đồ án tại it24m.dak.edu.vn',
    ],
    featureDetails: [
      {
        icon: '🏟️',
        title: 'Phân hệ Đặt Sân Bóng C1 (Interactive Field Booking UI)',
        desc: 'Thiết kế giao diện trực quan hiển thị cụm 2 sân bóng mini cỏ nhân tạo C1 (Sân 1 & Sân 2), chọn ngày đá bằng lịch số, bảng hiển thị ca ngày (250k/h) và ca tối có dàn đèn cao áp (350k/h). Cửa sổ Popup xác nhận đặt sân nhanh kèm trường nhập họ tên, số điện thoại và dịch vụ nước/bóng.',
        tags: ['Giao diện đặt sân C1', 'Ca ngày & Ca tối có đèn', 'Bộ lọc ngày đá', 'Popup xác nhận'],
      },
      {
        icon: '📅',
        title: 'Phân hệ Quản Lý Lịch Tập Luyện (Training Schedule Calendar)',
        desc: 'Xây dựng lịch tập bóng đá theo tuần và tháng với giao diện thẻ trực quan; gắn mã màu phân loại 4 tuyến đội (Tuyển chính, U21, U17, Futsal); hiển thị địa điểm sân tập C1, huấn luyện viên phụ trách, phân loại bài tập (Chiến thuật, Thể lực, Thi đấu nội bộ) và cảnh báo khi có ca đá trùng giờ.',
        tags: ['Lịch tập trực quan', 'Phân loại bài tập', 'Gắn mã màu tuyến đội', 'Cảnh báo trùng giờ'],
      },
      {
        icon: '✅',
        title: 'Phân hệ Điểm Danh Cầu Thủ & Theo Dõi Chuyên Cần (Attendance Tracking)',
        desc: 'Thiết kế bảng điểm danh dạng lưới sắc nét cho từng buổi tập; hỗ trợ tích chọn nhanh 3 trạng thái: Có mặt (Xanh lá), Đi trễ (Vàng hổ phách), Vắng mặt (Đỏ); tự động tính toán tỷ lệ chuyên cần (%) của từng cầu thủ, hỗ trợ tìm kiếm theo tên và lọc theo kết quả tham gia.',
        tags: ['Bảng điểm danh lưới', '3 trạng thái điểm danh', 'Tỷ lệ chuyên cần (%)', 'Tìm kiếm cầu thủ'],
      },
      {
        icon: '🛡️',
        title: 'Phân hệ Quản Lý Tuyến Đội & Hồ Sơ Cầu Thủ (Teams & Players Roster)',
        desc: 'Giao diện thẻ hồ sơ nhân sự cầu thủ chuyên nghiệp: ảnh đại diện, số áo, vị trí sở trường (Thủ môn, Hậu vệ, Tiền vệ, Tiền đạo), chiều cao, cân nặng, chân thuận và đội bóng trực thuộc. Bổ sung modal tạo mới, chỉnh sửa thông tin cầu thủ và danh sách Ban huấn luyện với đầy đủ bằng cấp AFC.',
        tags: ['Thẻ hồ sơ cầu thủ', 'Vị trí sở trường', 'Chỉ số thể hình', 'Ban huấn luyện AFC'],
      },
      {
        icon: '💰',
        title: 'Phân hệ Thu Chi & Ma Trận Đóng Quỹ Sinh Hoạt (Finances & Club Fund)',
        desc: 'Bảng theo dõi đóng quỹ 12 tháng trong năm của toàn bộ thành viên với nút gạt trạng thái Đã đóng/Chưa đóng một chạm; các thẻ thống kê tổng thu, tổng chi và số dư quỹ tiền mặt theo thời gian thực; bảng kê chi tiết các phiếu thu/chi kèm hóa đơn và người phụ trách.',
        tags: ['Ma trận quỹ 12 tháng', 'Thẻ thống kê thu chi', 'Số dư quỹ tức thì', 'Phiếu thu chi chi tiết'],
      },
      {
        icon: '📢',
        title: 'Phân hệ Bảng Tin & Trung Tâm Thông Báo (Announcements & Notification Center)',
        desc: 'Thiết kế trung tâm thông báo thời gian thực với biểu tượng chuông trên thanh Navbar, đếm số tin chưa đọc; hỗ trợ phân loại mức độ ưu tiên (Khẩn cấp, Quan trọng, Thông thường) và lọc theo đối tượng nhận tin (Toàn bộ CLB, Ban huấn luyện, Đội 1, Tuyển Trẻ U21).',
        tags: ['Chuông thông báo Navbar', 'Số tin chưa đọc', 'Mức độ ưu tiên', 'Lọc đối tượng nhận tin'],
      },
      {
        icon: '🔐',
        title: 'Phân Quyền Giao Diện & Điều Hướng Thích Ứng (RBAC UI & Responsive)',
        desc: 'Tối ưu hóa bố cục Responsive chuẩn trên điện thoại di động, máy tính bảng và màn hình máy tính; cơ chế phân quyền hiển thị thông minh: Khách chỉ xem trang giới thiệu, tìm sân và lịch đặt; Thành viên nội bộ/Admin đăng nhập sẽ mở khóa đầy đủ thanh menu và dashboard điều hành.',
        tags: ['Responsive đa thiết bị', 'Phân quyền menu thông minh', 'Tối ưu trải nghiệm mobile'],
      },
    ],
    contact: {
      email: 'gbaochill@gmail.com',
      phone: '0345067171',
      github: 'github.com/Zakuro2209',
    },
  },
};

export default function Footer() {
  const [selectedMember, setSelectedMember] = useState<'hai' | 'bao' | null>(null);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const currentCV = selectedMember ? MEMBERS_CV[selectedMember] : null;

  return (
    <>
      <footer className="relative border-t-2 border-emerald-500/40 bg-gradient-to-b from-[#022c22] via-[#031d16] to-[#01140f] text-slate-200 shadow-2xl overflow-hidden pt-8 pb-5">
        {/* Glowing background accents */}
        <div className="absolute top-0 left-1/4 w-96 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          {/* Main Footer 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
            {/* Cột 1: Thương hiệu Sân bóng C1 & Đồ án công nghệ (4 cols) */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-base shadow-md shadow-emerald-500/30">
                  ⚽
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                    <span>SÂN BÓNG C1</span>
                  </h3>
                  <p className="text-[10.5px] text-emerald-300 font-semibold">
                    Professional Pitch Management & Booking
                  </p>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-300 leading-relaxed font-normal">
                Hệ thống số hóa quản lý đặt sân 24/24, điều phối lịch thi đấu và hồ sơ cầu thủ cụm sân cỏ nhân tạo C1.
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10.5px]">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Neon Cloud DB
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-medium">
                  ⚡ Wispbyte API v2.0
                </span>
              </div>
            </div>

            {/* Cột 2: Đội ngũ phát triển (5 cols) - 2 High-Tech Profile Cards */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <span>👨‍💻</span> Đội Ngũ Lập Trình & Phụ Trách Đồ Án
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Nhấn card để mở liên kết CV cá nhân ↗</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Member 1: Nguyễn Minh Hải (Backend) */}
                <a
                  href="https://it24m.dak.edu.vn/nguyenminhhai/baitap1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900/90 border border-emerald-500/30 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-left cursor-pointer flex flex-col justify-between"
                  title="Mở CV trực tuyến của Nguyễn Minh Hải (https://it24m.dak.edu.vn/nguyenminhhai/baitap1/)"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <img
                      src={`${basePath}/avatar-hai.jpg`}
                      alt="Nguyễn Minh Hải"
                      className="w-10 h-10 rounded-xl object-cover object-top border-2 border-amber-400/80 shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                        Nguyễn Minh Hải
                      </div>
                      <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 mt-0.5">
                        Backend & Database
                      </span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium line-clamp-1 border-t border-emerald-900/60 pt-1.5 flex items-center justify-between">
                    <span>NestJS • PostgreSQL</span>
                    <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      CV Cá Nhân ↗
                    </span>
                  </div>
                </a>

                {/* Member 2: Trương Kỳ Gia Bảo (Frontend) */}
                <a
                  href="https://it24m.dak.edu.vn/truongkygiabao/baitap1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900/90 border border-emerald-500/30 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 transition-all text-left cursor-pointer flex flex-col justify-between"
                  title="Mở CV trực tuyến của Trương Kỳ Gia Bảo (https://it24m.dak.edu.vn/truongkygiabao/baitap1/)"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <img
                      src={`${basePath}/avatar-bao.jpg`}
                      alt="Trương Kỳ Gia Bảo"
                      className="w-10 h-10 rounded-xl object-cover object-top border-2 border-sky-400/80 shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate group-hover:text-sky-300 transition-colors">
                        Trương Kỳ Gia Bảo
                      </div>
                      <span className="inline-block text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-400/20 text-sky-300 border border-sky-400/40 mt-0.5">
                        Frontend & UI/UX
                      </span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium line-clamp-1 border-t border-emerald-900/60 pt-1.5 flex items-center justify-between">
                    <span>Next.js 16 • Tailwind</span>
                    <span className="text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      CV Cá Nhân ↗
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Cột 3: Thông tin liên hệ & Cơ sở sân bóng (3 cols) */}
            <div className="lg:col-span-3 space-y-2.5 text-xs text-slate-300">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <span>📍</span> Trung Tâm Sân Bóng C1
              </span>

              <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 space-y-2 text-[11.5px]">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">📌</span>
                  <span>1B Y Ngông, P. Tân Tiến, TP. Buôn Ma Thuột, Đắk Lắk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0">📞</span>
                  <span>Hotline: <strong className="text-white">0983 830 955 / 0906 424 006</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0">⏰</span>
                  <span>Hoạt động: <strong className="text-emerald-300">24/24 (T2 – CN)</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Tech Badges Bar */}
          <div className="pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              © 2026 <strong>Sân Bóng C1</strong> • Đồ Án Lập Trình Mã Nguồn Mở (Khoa CNTT - Lớp IT24M).
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold text-emerald-300/80">
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/60">Next.js 16</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/60">NestJS 10</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/60">PostgreSQL (Neon)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/60">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>

      {/* POPUP MODAL XEM CV CỦA 2 THÀNH VIÊN */}
      {selectedMember && currentCV && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-emerald-600 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal với Tab chuyển đổi thành viên */}
            <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="text-lg font-black tracking-wide">HỒ SƠ THÀNH VIÊN (CV)</h3>
                  <p className="text-xs text-emerald-200 font-medium">Đồ án Quản Lý Sân Bóng & Lịch Tập CLB Bóng Đá</p>
                </div>
              </div>

              {/* Nút Đóng Modal */}
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg font-bold transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Thanh Tab chuyển giữa 2 người */}
            <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 p-1.5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMember('hai')}
                className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedMember === 'hai'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <img
                  src={`${basePath}/avatar-hai.jpg`}
                  alt="Nguyễn Minh Hải"
                  className="w-6 h-6 rounded-full object-cover object-top border border-white/60 shadow-sm"
                />
                <span>Nguyễn Minh Hải</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    selectedMember === 'hai' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Backend
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMember('bao')}
                className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedMember === 'bao'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <img
                  src={`${basePath}/avatar-bao.jpg`}
                  alt="Trương Kỳ Gia Bảo"
                  className="w-6 h-6 rounded-full object-cover object-top border border-white/60 shadow-sm"
                />
                <span>Trương Kỳ Gia Bảo</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    selectedMember === 'bao' ? 'bg-sky-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Frontend
                </span>
              </button>
            </div>

            {/* Nội dung chi tiết CV */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-900">
                  {currentCV.image ? (
                    <img
                      src={`${basePath}${currentCV.image}`}
                      alt={currentCV.name}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl">
                      {currentCV.avatar}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-[9px] text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                    {selectedMember === 'hai' ? 'BE' : 'FE'}
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h2 className="text-xl font-black text-slate-900">{currentCV.name}</h2>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-black self-center sm:self-auto border ${
                        selectedMember === 'hai'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300'
                      }`}
                    >
                      {currentCV.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">{currentCV.major}</p>
                  <p className="text-xs text-emerald-700 font-bold">{currentCV.school}</p>
                  <div className="mt-2.5">
                    <a
                      href={
                        selectedMember === 'hai'
                          ? 'https://it24m.dak.edu.vn/nguyenminhhai/baitap1/'
                          : 'https://it24m.dak.edu.vn/truongkygiabao/baitap1/'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>🌐 Mở Website CV Riêng (it24m.dak.edu.vn) ↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Tóm tắt mục tiêu / tóm tắt hồ sơ */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                  <span>📌</span> Giới Thiệu & Tóm Tắt Vai Trò
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {currentCV.summary}
                </p>
              </div>

              {/* Nhiệm vụ chính trong đồ án */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                  <span>🎯</span> Nhiệm Vụ Phụ Trách Trong Đồ Án
                </h4>
                <ul className="space-y-1.5">
                  {currentCV.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-emerald-600 font-bold">✔</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chi tiết từng tính năng thực hiện */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2.5 flex items-center gap-1.5">
                  <span>✨</span> Chi Tiết Từng Tính Năng Đã Xây Dựng ({currentCV.featureDetails.length} Phân Hệ Chính)
                </h4>
                <div className="space-y-2.5">
                  {currentCV.featureDetails.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 hover:to-emerald-50 border border-slate-200 hover:border-emerald-400 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs">
                          {feat.icon}
                        </span>
                        <h5 className="font-black text-xs text-slate-900 flex-1">{feat.title}</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2.5 pl-9">
                        {feat.desc}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pl-9">
                        {feat.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200/80 shadow-2xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kỹ năng công nghệ */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                  <span>💻</span> Kỹ Năng Công Nghệ Sử Dụng
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentCV.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Đóng góp tiêu biểu */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                  <span>🏆</span> Đóng Góp Nổi Bật Cho Dự Án
                </h4>
                <ul className="space-y-1.5">
                  {currentCV.projectContributions.map((contrib, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-emerald-500">⚽</span>
                      <span>{contrib}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Thông tin liên hệ */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>📧 Email:</span>
                  <a href={`mailto:${currentCV.contact.email}`} className="text-slate-800 font-bold hover:text-emerald-700 hover:underline">
                    {currentCV.contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>📱 Hotline/Zalo:</span>
                  <a href={`tel:${currentCV.contact.phone}`} className="text-emerald-700 font-black hover:underline">
                    {currentCV.contact.phone}
                  </a>
                </div>
                {currentCV.contact.github && (
                  <div className="flex items-center gap-1.5">
                    <span>🐙 GitHub:</span>
                    <a
                      href={`https://${currentCV.contact.github.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-800 font-bold hover:text-emerald-700 hover:underline"
                    >
                      {currentCV.contact.github}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Nhấn phím hoặc bấm ra ngoài để quay lại trang chính
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow cursor-pointer transition"
              >
                Đóng Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

