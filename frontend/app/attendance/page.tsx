'use client';

import { useState } from 'react';

interface AttendanceItem {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  status: 'Có mặt' | 'Vắng có phép' | 'Vắng không phép' | 'Đến muộn';
  note?: string;
}

const defaultList: AttendanceItem[] = [
  { id: '1', name: 'Đặng Văn Lâm', jerseyNumber: 1, position: 'Thủ môn', status: 'Có mặt' },
  { id: '2', name: 'Đỗ Duy Mạnh', jerseyNumber: 4, position: 'Hậu vệ', status: 'Có mặt' },
  { id: '3', name: 'Đoàn Văn Hậu', jerseyNumber: 5, position: 'Hậu vệ', status: 'Vắng có phép', note: 'Chấn thương' },
  { id: '4', name: 'Nguyễn Quang Hải', jerseyNumber: 19, position: 'Tiền vệ', status: 'Có mặt' },
  { id: '5', name: 'Nguyễn Hoàng Đức', jerseyNumber: 14, position: 'Tiền vệ', status: 'Có mặt' },
  { id: '6', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', status: 'Đến muộn' },
];

export default function AttendancePage() {
  const [list, setList] = useState<AttendanceItem[]>(defaultList);
  const [saved, setSaved] = useState(false);

  const setPlayerStatus = (id: string, status: AttendanceItem['status']) => {
    setList(list.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const presentCount = list.filter((i) => i.status === 'Có mặt').length;
  const lateCount = list.filter((i) => i.status === 'Đến muộn').length;
  const absentCount = list.filter((i) => i.status.startsWith('Vắng')).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>✅</span> Điểm Danh Buổi Tập Bóng Đá
          </h1>
          <p className="text-sm text-slate-400 mt-1">Theo dõi chuyên cần cầu thủ trong các buổi tập</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          💾 Lưu Điểm Danh
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <span>✓</span> Dữ liệu điểm danh đã được cập nhật thành công lên hệ thống!
        </div>
      )}

      {/* Thống kê nhanh sĩ số */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Có mặt</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{presentCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Đến muộn</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{lateCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Vắng mặt</p>
          <p className="text-2xl font-black text-red-400 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Danh sách cầu thủ điểm danh */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {list.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 font-bold flex items-center justify-center">
                  #{item.jerseyNumber}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-400">{item.position} {item.note ? `• ${item.note}` : ''}</p>
                </div>
              </div>

              {/* Nút chọn trạng thái điểm danh */}
              <div className="flex flex-wrap gap-1.5">
                {(['Có mặt', 'Đến muộn', 'Vắng có phép', 'Vắng không phép'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPlayerStatus(item.id, st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      item.status === st
                        ? st === 'Có mặt'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : st === 'Đến muộn'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-red-500 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
