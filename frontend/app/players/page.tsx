'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { exportToCSV, printReport } from '@/lib/exportUtils';

interface PlayerHistoryItem {
  date: string;
  sessionTitle: string;
  status: 'Có mặt' | 'Đến muộn' | 'Vắng có phép' | 'Vắng không phép';
  note?: string;
}

interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  dateOfBirth: string;
  phone: string;
  status: string;
  height?: string;
  weight?: string;
  preferredFoot?: string;
  joinedDate?: string;
  history?: PlayerHistoryItem[];
}

const initialPlayers: Player[] = [
  {
    id: '1',
    name: 'Đặng Văn Lâm',
    jerseyNumber: 1,
    position: 'Thủ môn',
    dateOfBirth: '1993-08-13',
    phone: '0901234567',
    status: 'Đang thi đấu',
    height: '1m88',
    weight: '85kg',
    preferredFoot: 'Chân phải',
    joinedDate: '15/01/2023',
    history: [
      { date: '25/10/2026', sessionTitle: 'Tập phản xạ bắt bóng bổng và sút xa', status: 'Có mặt' },
      { date: '22/10/2026', sessionTitle: 'Rèn thể lực và phát động tấn công', status: 'Có mặt' },
      { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
    ],
  },
  {
    id: '2',
    name: 'Đỗ Duy Mạnh',
    jerseyNumber: 4,
    position: 'Hậu vệ',
    dateOfBirth: '1996-09-29',
    phone: '0912345678',
    status: 'Đang thi đấu',
    height: '1m80',
    weight: '76kg',
    preferredFoot: 'Chân phải',
    joinedDate: '10/03/2023',
    history: [
      { date: '25/10/2026', sessionTitle: 'Tập bọc lót và kèm người 1v1', status: 'Có mặt' },
      { date: '22/10/2026', sessionTitle: 'Rèn thể lực và phối hợp bóng ngắn', status: 'Đến muộn', note: 'Kẹt xe đường Cầu Diễn' },
      { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
    ],
  },
  {
    id: '3',
    name: 'Đoàn Văn Hậu',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    dateOfBirth: '1999-04-19',
    phone: '0923456789',
    status: 'Chấn thương',
    height: '1m86',
    weight: '82kg',
    preferredFoot: 'Chân trái',
    joinedDate: '01/06/2023',
    history: [
      { date: '25/10/2026', sessionTitle: 'Tập bọc lót và kèm người 1v1', status: 'Vắng có phép', note: 'Điều trị dây chằng gối' },
      { date: '22/10/2026', sessionTitle: 'Rèn thể lực và phối hợp bóng ngắn', status: 'Vắng có phép', note: 'Tập hồi phục cùng bác sĩ' },
      { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
    ],
  },
  {
    id: '4',
    name: 'Nguyễn Quang Hải',
    jerseyNumber: 19,
    position: 'Tiền vệ',
    dateOfBirth: '1997-04-12',
    phone: '0934567890',
    status: 'Đang thi đấu',
    height: '1m68',
    weight: '67kg',
    preferredFoot: 'Chân trái khéo léo',
    joinedDate: '12/02/2023',
    history: [
      { date: '25/10/2026', sessionTitle: 'Tập sút phạt hàng rào và chọc khe', status: 'Có mặt' },
      { date: '22/10/2026', sessionTitle: 'Rèn thể lực và phối hợp bóng ngắn', status: 'Có mặt' },
      { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
    ],
  },
  {
    id: '5',
    name: 'Nguyễn Hoàng Đức',
    jerseyNumber: 14,
    position: 'Tiền vệ',
    dateOfBirth: '1998-01-11',
    phone: '0945678901',
    status: 'Đang thi đấu',
    height: '1m84',
    weight: '75kg',
    preferredFoot: 'Chân trái',
    joinedDate: '05/04/2023',
    history: [
      { date: '25/10/2026', sessionTitle: 'Tập thoát pressing và phân phối bóng', status: 'Có mặt' },
      { date: '22/10/2026', sessionTitle: 'Rèn thể lực và phối hợp bóng ngắn', status: 'Có mặt' },
      { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
    ],
  },
  {
    id: '6',
    name: 'Nguyễn Tiến Linh',
    jerseyNumber: 22,
    position: 'Tiền đạo',
    dateOfBirth: '1997-10-20',
    phone: '0956789012',
    status: 'Đang thi đấu',
    height: '1m80',
    weight: '77kg',
    preferredFoot: 'Chân phải',
    joinedDate: '20/07/2023',
    history: [
      { date: '25/10/2026', sessionTitle: 'Tập dứt điểm bóng bổng và một chạm', status: 'Đến muộn', note: 'Đến muộn 15p' },
      { date: '22/10/2026', sessionTitle: 'Rèn thể lực và phối hợp bóng ngắn', status: 'Có mặt' },
      { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
    ],
  },
];

export default function PlayersPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [filterPosition, setFilterPosition] = useState<string>('Tất cả');
  const [filterStatus, setFilterStatus] = useState<string>('Tất cả');
  const [filterFoot, setFilterFoot] = useState<string>('Tất cả');
  const [sortBy, setSortBy] = useState<string>('jersey-asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const fetchPlayers = async () => {
    try {
      let data = null;
      try {
        const res = await fetch('/api/players');
        if (res.ok) data = await res.json();
      } catch {
        // Fallback sang cổng 5000
      }
      if (!data || !data.data) {
        const resDirect = await fetch('http://localhost:5000/api/players');
        if (resDirect.ok) data = await resDirect.json();
      }
      const list = data?.data || (Array.isArray(data) ? data : null);
      if (list && Array.isArray(list) && list.length > 0) {
        setPlayers(list);
      }
    } catch (err) {
      console.warn('Lỗi kết nối API /api/players:', err);
    }
  };

  // Tải dữ liệu từ Neon PostgreSQL API khi mở trang
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Phân quyền: Cầu thủ chỉ xem, Admin & HLV được thêm / xóa
  const canManage = user?.role === 'admin' || user?.role === 'coach';

  const [newPlayer, setNewPlayer] = useState({
    name: '',
    jerseyNumber: '',
    position: 'Tiền vệ',
    phone: '',
    status: 'Đang thi đấu',
    dateOfBirth: '2000-01-01',
    height: '1m75',
    weight: '70kg',
    preferredFoot: 'Chân phải',
  });

  const positions = ['Tất cả', 'Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'];
  const statuses = ['Tất cả', 'Đang thi đấu', 'Chấn thương', 'Nghỉ phép'];
  const feet = ['Tất cả', 'Chân phải', 'Chân trái', 'Cả hai chân'];

  // TÍNH NĂNG 4: TÌM KIẾM VÀ LỌC NÂNG CAO
  const filtered = useMemo(() => {
    return players
      .filter((p) => {
        const matchPos = filterPosition === 'Tất cả' || p.position === filterPosition;
        const matchStatus = filterStatus === 'Tất cả' || p.status === filterStatus;
        const matchFoot =
          filterFoot === 'Tất cả' ||
          (p.preferredFoot && p.preferredFoot.toLowerCase().includes(filterFoot.toLowerCase()));
        const term = searchTerm.trim().toLowerCase();
        const matchSearch =
          !term ||
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.jerseyNumber && p.jerseyNumber.toString().includes(term)) ||
          (p.phone && p.phone.includes(term));
        return matchPos && matchStatus && matchFoot && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'jersey-asc') return a.jerseyNumber - b.jerseyNumber;
        if (sortBy === 'jersey-desc') return b.jerseyNumber - a.jerseyNumber;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi');
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'vi');
        return 0;
      });
  }, [players, filterPosition, filterStatus, filterFoot, sortBy, searchTerm]);

  const resetFilters = () => {
    setFilterPosition('Tất cả');
    setFilterStatus('Tất cả');
    setFilterFoot('Tất cả');
    setSortBy('jersey-asc');
    setSearchTerm('');
  };

  // TÍNH NĂNG 2: XUẤT BÁO CÁO EXCEL VÀ PDF DANH SÁCH CẦU THỦ
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Số Áo',
      'Họ và Tên',
      'Vị Trí',
      'Ngày Sinh',
      'Số Điện Thoại',
      'Chiều Cao',
      'Cân Nặng',
      'Chân Thuận',
      'Trạng Thái',
      'Ngày Gia Nhập',
    ];
    const rows = filtered.map((p, index) => [
      index + 1,
      p.jerseyNumber,
      p.name,
      p.position,
      p.dateOfBirth,
      p.phone,
      p.height || '1m78',
      p.weight || '74kg',
      p.preferredFoot || 'Chân phải',
      p.status,
      p.joinedDate || '2023',
    ]);
    exportToCSV(`Danh_Sach_Cau_Thu_SaoVangFC_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handlePrintPDF = () => {
    const headers = ['Số Áo', 'Họ và Tên', 'Vị Trí', 'Ngày Sinh', 'Điện Thoại', 'Thể Chất', 'Trạng Thái'];
    const rows = filtered.map((p) => [
      `#${p.jerseyNumber}`,
      p.name,
      p.position,
      p.dateOfBirth,
      p.phone,
      `${p.height || '1m78'} • ${p.weight || '74kg'}`,
      p.status,
    ]);
    printReport({
      title: 'DANH SÁCH CẦU THỦ BIÊN CHẾ CÂU LẠC BỘ',
      subtitle: 'Hồ sơ nhân trắc, thông tin liên lạc và vị trí thi đấu đội hình Sao Vàng FC',
      filterInfo: `Bộ lọc: Vị trí [${filterPosition}] • Trạng thái [${filterStatus}] • Kết quả: ${filtered.length} cầu thủ`,
      tableHeaders: headers,
      tableRows: rows,
      summary: [
        { label: 'Tổng số cầu thủ hiển thị', value: `${filtered.length} / ${players.length}` },
        { label: 'Đang thi đấu', value: filtered.filter((p) => p.status === 'Đang thi đấu').length },
        { label: 'Chấn thương', value: filtered.filter((p) => p.status === 'Chấn thương').length },
      ],
    });
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!newPlayer.name || !newPlayer.jerseyNumber) return;

    try {
      await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlayer.name,
          jerseyNumber: Number(newPlayer.jerseyNumber),
          position: newPlayer.position,
          dateOfBirth: newPlayer.dateOfBirth,
          phone: newPlayer.phone || '0988888888',
          status: newPlayer.status,
          avatarUrl: null,
        }),
      });

      // Tải lại danh sách từ Database để đảm bảo chỉ có đúng 1 bản ghi, không bị nhân đôi
      await fetchPlayers();
    } catch (err) {
      console.error('Lỗi lưu cầu thủ vào database:', err);
    }

    setNewPlayer({
      name: '',
      jerseyNumber: '',
      position: 'Tiền vệ',
      phone: '',
      status: 'Đang thi đấu',
      dateOfBirth: '2000-01-01',
      height: '1m75',
      weight: '70kg',
      preferredFoot: 'Chân phải',
    });
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn xóa cầu thủ này khỏi danh sách?')) {
      try {
        await fetch(`/api/players/${id}`, { method: 'DELETE' });
        await fetchPlayers();
      } catch (err) {
        console.error('Lỗi xóa cầu thủ khỏi database:', err);
      }
      if (selectedPlayer?.id === id) setSelectedPlayer(null);
    }
  };

  const hasActiveFilters =
    filterPosition !== 'Tất cả' ||
    filterStatus !== 'Tất cả' ||
    filterFoot !== 'Tất cả' ||
    searchTerm !== '' ||
    sortBy !== 'jersey-asc';

  return (
    <>
      <link rel="stylesheet" href="/css/players.css" />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>🏃</span> Quản Lý Cầu Thủ ({players.length})
          </h1>
          <p className="page-subtitle">
            Hồ sơ danh sách cầu thủ thuộc biên chế câu lạc bộ Sao Vàng FC kèm tìm kiếm nâng cao & xuất báo cáo
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ fontSize: '13px' }} title="Xuất file Excel (.csv UTF-8 BOM)">
            📥 Xuất Excel
          </button>
          <button onClick={handlePrintPDF} className="btn btn-secondary" style={{ fontSize: '13px' }} title="In ấn hoặc lưu dạng PDF">
            📄 In / Xuất PDF
          </button>

          {canManage ? (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              ➕ Thêm Cầu Thủ Mới
            </button>
          ) : (
            <span className="badge badge-info" style={{ padding: '8px 14px' }}>
              👁️ Chế độ xem dành cho Cầu thủ
            </span>
          )}
        </div>
      </div>

      {!canManage && (
        <div
          className="alert alert-danger"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            color: '#93c5fa',
          }}
        >
          <span>ℹ️</span> <strong>Thông báo phân quyền:</strong> Bạn đang đăng nhập với vai trò Cầu thủ. Bạn có quyền xem hồ sơ chi tiết các cầu thủ, nhưng không thể tạo mới hoặc xóa cầu thủ.
        </div>
      )}

      {/* TÍNH NĂNG 4: BỘ LỌC VÀ TÌM KIẾM NÂNG CAO */}
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          {/* Ô tìm kiếm đa năng */}
          <div className="search-input-wrapper" style={{ margin: 0 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên, số áo, số ĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Lọc Trạng thái */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
              style={{ fontSize: '13px', height: '100%' }}
            >
              <option value="Tất cả">⚡ Tất cả trạng thái</option>
              <option value="Đang thi đấu">🟢 Đang thi đấu</option>
              <option value="Chấn thương">🔴 Đang chấn thương</option>
              <option value="Nghỉ phép">🟡 Đang nghỉ phép</option>
            </select>
          </div>

          {/* Lọc Chân thuận */}
          <div>
            <select
              value={filterFoot}
              onChange={(e) => setFilterFoot(e.target.value)}
              className="form-control"
              style={{ fontSize: '13px', height: '100%' }}
            >
              <option value="Tất cả">👟 Tất cả chân thuận</option>
              <option value="Chân phải">Chân phải</option>
              <option value="Chân trái">Chân trái</option>
              <option value="Cả hai chân">Cả hai chân</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control"
              style={{ fontSize: '13px', height: '100%' }}
            >
              <option value="jersey-asc">🔢 Số áo: Nhỏ đến Lớn</option>
              <option value="jersey-desc">🔢 Số áo: Lớn đến Nhỏ</option>
              <option value="name-asc">🔤 Tên: A ➔ Z</option>
              <option value="name-desc">🔤 Tên: Z ➔ A</option>
            </select>
          </div>
        </div>

        {/* Thanh pills lọc theo vị trí và nút Reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="filter-pills" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Vị trí:</span>
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setFilterPosition(pos)}
                className={`filter-btn ${filterPosition === pos ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {pos}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 600 }}>
              Tìm thấy {filtered.length} / {players.length} cầu thủ
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                title="Đặt lại toàn bộ tiêu chí lọc"
              >
                🔄 Đặt lại
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid danh sách cầu thủ */}
      <section className="players-grid">
        {filtered.map((player) => {
          let badgeClass = 'badge-success';
          if (player.status === 'Chấn thương') badgeClass = 'badge-danger';
          else if (player.status === 'Nghỉ phép') badgeClass = 'badge-warning';

          return (
            <article key={player.id} className="player-card">
              <div className="player-header">
                <div className="jersey-badge">#{player.jerseyNumber}</div>
                <span className={`badge ${badgeClass}`}>{player.status}</span>
              </div>
              <h3 className="player-name">{player.name}</h3>
              <p className="player-position">Vị trí: {player.position}</p>
              <ul className="player-info-list">
                <li className="player-info-item">
                  📞 <span>Điện thoại: {player.phone}</span>
                </li>
                <li className="player-info-item">
                  🎂 <span>Ngày sinh: {player.dateOfBirth}</span>
                </li>
                <li className="player-info-item">
                  ⚽ <span>Biên chế: CLB Sao Vàng FC</span>
                </li>
              </ul>

              <div className="player-actions" style={{ display: 'flex', gap: '8px' }}>
                {/* TÍNH NĂNG 3: NÚT XEM HỒ SƠ CHI TIẾT */}
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '12px', padding: '7px 10px' }}
                >
                  👁️ Xem Hồ Sơ
                </button>

                {canManage && (
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '12px', padding: '7px 12px' }}
                    title="Xóa cầu thủ"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* TÍNH NĂNG 3: MODAL HỒ SƠ CHI TIẾT CẦU THỦ */}
      {selectedPlayer && (
        <div className="modal-overlay active">
          <div className="modal-box" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#022c22',
                  }}
                >
                  #{selectedPlayer.jerseyNumber}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedPlayer.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span className="badge badge-info">{selectedPlayer.position}</span>
                    <span
                      className={`badge ${
                        selectedPlayer.status === 'Chấn thương'
                          ? 'badge-danger'
                          : selectedPlayer.status === 'Nghỉ phép'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {selectedPlayer.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="modal-close">
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Thông tin nhân trắc & cá nhân */}
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  📌 Thông Tin Cá Nhân & Chỉ Số Thể Chất
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                  }}
                >
                  <div>🎂 Ngày sinh: <strong style={{ color: '#fff' }}>{selectedPlayer.dateOfBirth}</strong></div>
                  <div>📞 Điện thoại: <strong style={{ color: '#fff' }}>{selectedPlayer.phone}</strong></div>
                  <div>📏 Chiều cao: <strong style={{ color: '#fff' }}>{selectedPlayer.height || '1m78'}</strong></div>
                  <div>⚖️ Cân nặng: <strong style={{ color: '#fff' }}>{selectedPlayer.weight || '74kg'}</strong></div>
                  <div>👟 Chân thuận: <strong style={{ color: '#fff' }}>{selectedPlayer.preferredFoot || 'Chân phải'}</strong></div>
                  <div>📅 Gia nhập: <strong style={{ color: '#fff' }}>{selectedPlayer.joinedDate || '2023'}</strong></div>
                </div>
              </div>

              {/* TÍNH NĂNG 3: LỊCH SỬ THAM GIA TẬP LUYỆN */}
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  📋 Lịch Sử Tham Gia Tập Luyện Gần Nhất
                </h4>
                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  {selectedPlayer.history && selectedPlayer.history.length > 0 ? (
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#0f172a', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px 14px' }}>Ngày</th>
                          <th style={{ padding: '10px 14px' }}>Nội dung buổi tập</th>
                          <th style={{ padding: '10px 14px' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlayer.history.map((h, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 14px', color: '#93c5fd' }}>{h.date}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontWeight: 600 }}>{h.sessionTitle}</span>
                              {h.note && <div style={{ fontSize: '11px', color: '#fbbf24' }}>* {h.note}</div>}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span
                                className={`badge ${
                                  h.status === 'Có mặt'
                                    ? 'badge-success'
                                    : h.status === 'Đến muộn'
                                    ? 'badge-warning'
                                    : 'badge-danger'
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Chưa có lịch sử tập luyện được ghi nhận.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" onClick={() => setSelectedPlayer(null)} className="btn btn-primary" style={{ fontSize: '13px' }}>
                Đóng Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Cầu Thủ Mới */}
      {showAddModal && canManage && (
        <div className="modal-overlay active">
          <div className="modal-box">
            <div className="modal-header">
              <h3>➕ Thêm Cầu Thủ Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddPlayer}>
              <div className="form-group">
                <label className="form-label">Họ và tên cầu thủ:</label>
                <input
                  type="text"
                  required
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Hải"
                  className="form-control"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Số áo:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    value={newPlayer.jerseyNumber}
                    onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                    placeholder="Ví dụ: 10"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí:</label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                    className="form-control"
                  >
                    <option value="Thủ môn">Thủ môn</option>
                    <option value="Hậu vệ">Hậu vệ</option>
                    <option value="Tiền vệ">Tiền vệ</option>
                    <option value="Tiền đạo">Tiền đạo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày sinh:</label>
                  <input
                    type="date"
                    value={newPlayer.dateOfBirth}
                    onChange={(e) => setNewPlayer({ ...newPlayer, dateOfBirth: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={newPlayer.phone}
                    onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                    placeholder="0912345678"
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Chiều cao / Cân nặng:</label>
                  <input
                    type="text"
                    value={newPlayer.height}
                    onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })}
                    placeholder="1m75"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chân thuận:</label>
                  <select
                    value={newPlayer.preferredFoot}
                    onChange={(e) => setNewPlayer({ ...newPlayer, preferredFoot: e.target.value })}
                    className="form-control"
                  >
                    <option value="Chân phải">Chân phải</option>
                    <option value="Chân trái">Chân trái</option>
                    <option value="Cả hai chân">Cả hai chân</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Cầu Thủ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
