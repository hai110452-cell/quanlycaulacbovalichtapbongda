'use client';

import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  dateOfBirth: string;
  phone: string;
  status: string;
}

const initialPlayers: Player[] = [
  { id: '1', name: 'Đặng Văn Lâm', jerseyNumber: 1, position: 'Thủ môn', dateOfBirth: '1993-08-13', phone: '0901234567', status: 'Đang thi đấu' },
  { id: '2', name: 'Đỗ Duy Mạnh', jerseyNumber: 4, position: 'Hậu vệ', dateOfBirth: '1996-09-29', phone: '0912345678', status: 'Đang thi đấu' },
  { id: '3', name: 'Đoàn Văn Hậu', jerseyNumber: 5, position: 'Hậu vệ', dateOfBirth: '1999-04-19', phone: '0923456789', status: 'Chấn thương' },
  { id: '4', name: 'Nguyễn Quang Hải', jerseyNumber: 19, position: 'Tiền vệ', dateOfBirth: '1997-04-12', phone: '0934567890', status: 'Đang thi đấu' },
  { id: '5', name: 'Nguyễn Hoàng Đức', jerseyNumber: 14, position: 'Tiền vệ', dateOfBirth: '1998-01-11', phone: '0945678901', status: 'Đang thi đấu' },
  { id: '6', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', dateOfBirth: '1997-10-20', phone: '0956789012', status: 'Đang thi đấu' },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [filterPosition, setFilterPosition] = useState<string>('Tất cả');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    jerseyNumber: '',
    position: 'Tiền vệ',
    phone: '',
    status: 'Đang thi đấu',
  });

  const positions = ['Tất cả', 'Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'];

  const filtered = players.filter((p) => {
    const matchPos = filterPosition === 'Tất cả' || p.position === filterPosition;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.jerseyNumber.toString().includes(searchTerm);
    return matchPos && matchSearch;
  });

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name || !newPlayer.jerseyNumber) return;
    const added: Player = {
      id: String(Date.now()),
      name: newPlayer.name,
      jerseyNumber: Number(newPlayer.jerseyNumber),
      position: newPlayer.position,
      dateOfBirth: '2000-01-01',
      phone: newPlayer.phone || '0988888888',
      status: newPlayer.status,
    };
    setPlayers([added, ...players]);
    setNewPlayer({ name: '', jerseyNumber: '', position: 'Tiền vệ', phone: '', status: 'Đang thi đấu' });
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cầu thủ này?')) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>🏃</span> Quản Lý Cầu Thủ ({players.length})
          </h1>
          <p className="text-sm text-slate-400 mt-1">Hồ sơ danh sách cầu thủ thuộc biên chế câu lạc bộ</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          ➕ Thêm Cầu Thủ Mới
        </button>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc số áo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
        <div className="flex flex-wrap gap-2">
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => setFilterPosition(pos)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterPosition === pos
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách cầu thủ Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400">
                #{p.jerseyNumber}
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  p.status === 'Đang thi đấu'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {p.status}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{p.name}</h3>
              <p className="text-xs text-slate-400">Vị trí: <span className="text-emerald-400 font-medium">{p.position}</span></p>
              <p className="text-xs text-slate-400 mt-1">Điện thoại: {p.phone}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => handleDelete(p.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm Cầu Thủ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Thêm Cầu Thủ Mới</h2>
            <form onSubmit={handleAddPlayer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Số áo</label>
                  <input
                    type="number"
                    required
                    value={newPlayer.jerseyNumber}
                    onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Vị trí</label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Thủ môn">Thủ môn</option>
                    <option value="Hậu vệ">Hậu vệ</option>
                    <option value="Tiền vệ">Tiền vệ</option>
                    <option value="Tiền đạo">Tiền đạo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
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
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
