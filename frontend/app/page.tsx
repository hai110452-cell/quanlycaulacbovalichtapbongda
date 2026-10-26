import Link from 'next/link';

export default function HomePage() {
  const stats = [
    { label: 'Tổng số Cầu thủ', value: '25', icon: '🏃', note: '6 đang đá chính', color: 'from-blue-600 to-cyan-500' },
    { label: 'Buổi tập tuần này', value: '4', icon: '📅', note: '2 buổi chiến thuật', color: 'from-emerald-600 to-green-500' },
    { label: 'Tỷ lệ chuyên cần', value: '94%', icon: '📈', note: '+3% so với tháng trước', color: 'from-purple-600 to-indigo-500' },
    { label: 'Sân tập liên kết', value: '3', icon: '🏟️', note: '2 sân đạt chuẩn', color: 'from-amber-600 to-yellow-500' },
  ];

  const upcomingSchedules = [
    {
      title: 'Rèn luyện thể lực và sức bền đầu tuần',
      date: 'Thứ Ba, 27/10/2026',
      time: '17:30 - 19:30',
      type: 'Tập thể lực',
      field: 'Sân bóng Sao Vàng A (Sân 7)',
      coach: 'HLV. Nguyễn Văn Huấn',
    },
    {
      title: 'Tập phối hợp bóng ngắn và sút phạt góc',
      date: 'Thứ Năm, 29/10/2026',
      time: '18:00 - 20:00',
      type: 'Tập chiến thuật',
      field: 'Sân bóng Sao Vàng A (Sân 7)',
      coach: 'HLV. Nguyễn Văn Huấn',
    },
    {
      title: 'Giao hữu thử nghiệm đội hình với Hà Nội Star FC',
      date: 'Thứ Bảy, 31/10/2026',
      time: '16:00 - 18:30',
      type: 'Thi đấu giao hữu',
      field: 'Sân bóng Sao Vàng B (Sân 11)',
      coach: 'HLV. Nguyễn Văn Huấn',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner CLB */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            ⚽ Câu Lạc Bộ Sao Vàng FC
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Quản Lý Câu Lạc Bộ & Lịch Tập Bóng Đá
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Hệ thống quản lý toàn diện đội bóng: điều phối lịch tập luyện, danh sách cầu thủ, theo dõi chuyên cần và cơ sở vật chất sân bãi hiện đại.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/schedules"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/30"
            >
              📅 Xem lịch tập
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all"
            >
              🏃 Quản lý cầu thủ
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all"
            >
              ✅ Điểm danh ngay
            </Link>
          </div>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">{s.label}</span>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{s.value}</span>
            </div>
            <p className="mt-1 text-xs text-emerald-400">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Lịch tập sắp diễn ra */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚽</span> Lịch tập luyện sắp tới
          </h2>
          <Link
            href="/schedules"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Xem tất cả lịch →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingSchedules.map((sc) => (
            <div
              key={sc.title}
              className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {sc.type}
                </span>
                <h3 className="font-bold text-white text-base leading-snug">{sc.title}</h3>
                <div className="text-xs text-slate-400 space-y-1 pt-1">
                  <p>🕒 {sc.date} | {sc.time}</p>
                  <p>📍 {sc.field}</p>
                  <p>👤 {sc.coach}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">Trạng thái: Sắp diễn ra</span>
                <Link
                  href="/attendance"
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Điểm danh
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
