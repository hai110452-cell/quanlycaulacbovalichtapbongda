'use client';

import { useState } from 'react';

interface TrainingSchedule {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  fieldName: string;
  coach: string;
  status: string;
  notes?: string;
}

const initialSchedules: TrainingSchedule[] = [
  {
    id: 'sched-1',
    title: 'Rèn luyện thể lực và sức bền đầu tuần',
    type: 'Tập thể lực',
    date: '2026-10-27',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Khởi động kỹ, mang giày đinh dăm AG, tập chạy biến tốc.',
  },
  {
    id: 'sched-2',
    title: 'Tập phối hợp bóng ngắn và sút phạt góc',
    type: 'Tập chiến thuật',
    date: '2026-10-29',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Chia đội 7v7 tập phản công nhanh.',
  },
  {
    id: 'sched-3',
    title: 'Giao hữu thử nghiệm đội hình với Hà Nội Star FC',
    type: 'Thi đấu giao hữu',
    date: '2026-10-31',
    startTime: '16:00',
    endTime: '18:30',
    fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Mặc đồng phục thi đấu màu Đỏ, có mặt trước 45 phút.',
  },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<TrainingSchedule[]>(initialSchedules);
  const [filterType, setFilterType] = useState<string>('Tất cả');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    type: 'Tập thể lực',
    date: '',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: '',
  });

  const types = ['Tất cả', 'Tập thể lực', 'Tập chiến thuật', 'Đấu tập nội bộ', 'Thi đấu giao hữu'];

  const filtered = schedules.filter((s) => {
    return filterType === 'Tất cả' || s.type === filterType;
  });

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.title || !newSchedule.date) return;

    const added: TrainingSchedule = {
      id: `sched-${Date.now()}`,
      title: newSchedule.title,
      type: newSchedule.type,
      date: newSchedule.date,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      fieldName: newSchedule.fieldName,
      coach: newSchedule.coach,
      status: 'Sắp diễn ra',
      notes: newSchedule.notes,
    };

    setSchedules([added, ...schedules]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>📅</span> Quản Lý Lịch Tập & Thi Đấu
          </h1>
          <p className="text-sm text-slate-400 mt-1">Lịch trình rèn luyện, thi đấu và phân công huấn luyện viên</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          ➕ Tạo Lịch Mới
        </button>
      </div>

      {/* Bộ lọc phân loại */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === t
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Danh sách lịch trình */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {s.type}
                </span>
                <span className="text-xs text-slate-400">📅 {s.date} ({s.startTime} - {s.endTime})</span>
              </div>
              <h3 className="text-lg font-bold text-white">{s.title}</h3>
              <p className="text-xs text-slate-400">📍 Địa điểm: <span className="text-slate-200">{s.fieldName}</span> | 👤 Phụ trách: <span className="text-slate-200">{s.coach}</span></p>
              {s.notes && <p className="text-xs text-emerald-400/80 italic mt-1">Ghi chú: {s.notes}</p>}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                {s.status}
              </span>
              <a
                href={`/attendance?scheduleId=${s.id}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition-colors"
              >
                Điểm danh →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm Lịch */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Thêm Lịch Tập Luyện Mới</h2>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tiêu đề buổi tập</label>
                <input
                  type="text"
                  required
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  placeholder="Ví dụ: Luyện phối hợp nhóm nhỏ 3v3"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Phân loại</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tập thể lực">Tập thể lực</option>
                    <option value="Tập chiến thuật">Tập chiến thuật</option>
                    <option value="Đấu tập nội bộ">Đấu tập nội bộ</option>
                    <option value="Thi đấu giao hữu">Thi đấu giao hữu</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ngày diễn ra</label>
                  <input
                    type="date"
                    required
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Ghi chú huấn luyện viên</label>
                <textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-600"
                >
                  Tạo lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
