'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { exportToCSV, printReport } from '@/lib/exportUtils';
import { MatchResult, GoalScorer } from '@/types';

const initialMatchesData: MatchResult[] = [
  {
    id: 'match-1',
    opponent: 'Hà Nội Star FC',
    matchType: 'Giao hữu',
    date: '2026-10-24',
    time: '16:00',
    fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
    homeScore: 3,
    awayScore: 1,
    status: 'Đã kết thúc',
    goalScorers: [
      { playerName: 'Nguyễn Tiến Linh', minute: 18 },
      { playerName: 'Nguyễn Quang Hải', minute: 55 },
      { playerName: 'Nguyễn Hoàng Đức', minute: 82 },
    ],
    mvp: 'Nguyễn Quang Hải',
    yellowCards: 1,
    redCards: 0,
    notes: 'Trận đấu giao hữu thành công, phối hợp bóng ngắn và phản công sắc bén.',
  },
  {
    id: 'match-2',
    opponent: 'Thăng Long United',
    matchType: 'Giải đấu',
    date: '2026-10-17',
    time: '17:30',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    homeScore: 2,
    awayScore: 2,
    status: 'Đã kết thúc',
    goalScorers: [
      { playerName: 'Nguyễn Tiến Linh', minute: 34 },
      { playerName: 'Đỗ Duy Mạnh', minute: 70 },
    ],
    mvp: 'Đỗ Duy Mạnh',
    yellowCards: 2,
    redCards: 0,
    notes: 'Trận hòa kịch tính vòng loại Cúp Mùa Thu, gỡ hòa ở những phút cuối.',
  },
  {
    id: 'match-3',
    opponent: 'Nam Định Mini FC',
    matchType: 'Giao hữu',
    date: '2026-10-10',
    time: '16:30',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    homeScore: 4,
    awayScore: 0,
    status: 'Đã kết thúc',
    goalScorers: [
      { playerName: 'Nguyễn Quang Hải', minute: 12 },
      { playerName: 'Nguyễn Tiến Linh', minute: 29 },
      { playerName: 'Nguyễn Tiến Linh', minute: 61 },
      { playerName: 'Nguyễn Hoàng Đức', minute: 78 },
    ],
    mvp: 'Nguyễn Tiến Linh',
    yellowCards: 0,
    redCards: 0,
    notes: 'Chiến thắng áp đảo với cú đúp của Tiến Linh, giữ sạch mành lưới.',
  },
  {
    id: 'match-4',
    opponent: 'Bắc Ninh Star FC',
    matchType: 'Cúp Mở Rộng',
    date: '2026-11-05',
    time: '15:30',
    fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
    homeScore: 0,
    awayScore: 0,
    status: 'Sắp diễn ra',
    goalScorers: [],
    notes: 'Trận tứ kết Cúp Mở Rộng 2026, toàn đội tập trung cao độ.',
  },
];

export default function MatchesPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [matches, setMatches] = useState<MatchResult[]>(initialMatchesData);
  const [filterOutcome, setFilterOutcome] = useState<string>('Tất cả');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      const list = data?.data || (Array.isArray(data) ? data : null);
      if (list && Array.isArray(list) && list.length > 0) {
        setMatches(list);
      }
    } catch (err) {
      console.warn('Lỗi kết nối /api/matches:', err);
    }
  };

  // Tải danh sách trận đấu từ Neon DB
  useEffect(() => {
    fetchMatches();
  }, []);

  // Phân quyền: Cầu thủ chỉ xem, Admin & HLV được thêm / xóa kết quả
  const canManage = user?.role === 'admin' || user?.role === 'coach';

  // Form state
  const [newMatch, setNewMatch] = useState({
    opponent: '',
    matchType: 'Giao hữu' as MatchResult['matchType'],
    date: '2026-11-01',
    time: '16:00',
    fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
    homeScore: 0,
    awayScore: 0,
    status: 'Đã kết thúc' as MatchResult['status'],
    mvp: 'Nguyễn Quang Hải',
    yellowCards: 0,
    redCards: 0,
    notes: '',
  });

  // Dynamic scorers input
  const [scorers, setScorers] = useState<GoalScorer[]>([
    { playerName: 'Nguyễn Tiến Linh', minute: 25 },
  ]);
  const [newScorerName, setNewScorerName] = useState('Nguyễn Tiến Linh');
  const [newScorerMinute, setNewScorerMinute] = useState(25);

  const addScorer = () => {
    if (!newScorerName) return;
    setScorers([...scorers, { playerName: newScorerName, minute: Number(newScorerMinute) }]);
  };

  const removeScorer = (index: number) => {
    setScorers(scorers.filter((_, i) => i !== index));
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const finished = matches.filter((m) => m.status === 'Đã kết thúc');
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    finished.forEach((m) => {
      goalsFor += m.homeScore;
      goalsAgainst += m.awayScore;
      if (m.homeScore > m.awayScore) wins++;
      else if (m.homeScore === m.awayScore) draws++;
      else losses++;
    });

    const winRate = finished.length > 0 ? Math.round((wins / finished.length) * 100) : 0;

    return {
      total: finished.length,
      upcoming: matches.filter((m) => m.status === 'Sắp diễn ra').length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      winRate,
    };
  }, [matches]);

  // Filtered list
  const filtered = useMemo(() => {
    return matches.filter((m) => {
      let matchOutcome = true;
      if (filterOutcome === 'Thắng') matchOutcome = m.status === 'Đã kết thúc' && m.homeScore > m.awayScore;
      else if (filterOutcome === 'Hòa') matchOutcome = m.status === 'Đã kết thúc' && m.homeScore === m.awayScore;
      else if (filterOutcome === 'Thua') matchOutcome = m.status === 'Đã kết thúc' && m.homeScore < m.awayScore;
      else if (filterOutcome === 'Sắp diễn ra') matchOutcome = m.status === 'Sắp diễn ra';

      const matchSearch =
        m.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.matchType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.fieldName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchOutcome && matchSearch;
    });
  }, [matches, filterOutcome, searchTerm]);

  // Handle Add Match
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !newMatch.opponent) return;

    const added: MatchResult = {
      id: `match-${Date.now()}`,
      opponent: newMatch.opponent,
      matchType: newMatch.matchType,
      date: newMatch.date,
      time: newMatch.time,
      fieldName: newMatch.fieldName,
      homeScore: Number(newMatch.homeScore),
      awayScore: Number(newMatch.awayScore),
      status: newMatch.status,
      goalScorers: newMatch.status === 'Đã kết thúc' ? scorers : [],
      mvp: newMatch.mvp,
      yellowCards: Number(newMatch.yellowCards),
      redCards: Number(newMatch.redCards),
      notes: newMatch.notes,
    };

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added),
      });
      const data = await res.json();
      if (data && data.data && data.data.id) {
        added.id = data.data.id;
      }
      // Tải lại danh sách từ Database để chỉ hiển thị 1 bản ghi chính xác, không nhân đôi
      await fetchMatches();
    } catch (err) {
      console.error('Lỗi khi lưu trận đấu vào database:', err);
      setMatches((prev) => [added, ...prev]);
    }

    // Dispatch notification
    addNotification(
      `Kết quả trận đấu mới: Sao Vàng FC ${added.homeScore} - ${added.awayScore} ${added.opponent}`,
      `Trận ${added.matchType} ngày ${added.date} tại ${added.fieldName}. MVP: ${added.mvp || 'Toàn đội'}`,
      'new',
      added.id
    );

    setShowAddModal(false);
    setNewMatch({
      opponent: '',
      matchType: 'Giao hữu',
      date: '2026-11-01',
      time: '16:00',
      fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
      homeScore: 0,
      awayScore: 0,
      status: 'Đã kết thúc',
      mvp: 'Nguyễn Quang Hải',
      yellowCards: 0,
      redCards: 0,
      notes: '',
    });
    setScorers([]);
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    const target = matches.find((m) => m.id === id);
    if (confirm(`Bạn có chắc muốn xóa kết quả trận gặp ${target?.opponent}?`)) {
      try {
        await fetch(`/api/matches/${id}`, { method: 'DELETE' });
        await fetchMatches();
      } catch (err) {
        console.error('Lỗi khi xóa trận đấu khỏi database:', err);
        setMatches((prev) => prev.filter((m) => m.id !== id));
      }
      if (target) {
        addNotification(
          `Xóa kết quả trận đấu: ${target.opponent}`,
          `Kết quả trận đấu ngày ${target.date} đã được xóa khỏi hệ thống.`,
          'cancel',
          target.id
        );
      }
    }
  };

  // Export Excel and PDF
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Đội Nhà',
      'Tỷ Số',
      'Đội Khách',
      'Phân Loại',
      'Ngày',
      'Giờ',
      'Sân Vận Động',
      'Trạng Thái',
      'Cầu Thủ Ghi Bàn',
      'MVP Trận Đấu',
      'Ghi Chú',
    ];
    const rows = filtered.map((m, index) => [
      index + 1,
      'Sao Vàng FC',
      m.status === 'Đã kết thúc' ? `${m.homeScore} - ${m.awayScore}` : 'Chưa đấu',
      m.opponent,
      m.matchType,
      m.date,
      m.time,
      m.fieldName,
      m.status,
      m.goalScorers.map((g) => `${g.playerName} (${g.minute}')`).join(', ') || '—',
      m.mvp || '—',
      m.notes || '',
    ]);
    exportToCSV(`Ket_Qua_Thi_Dau_SaoVangFC_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handlePrintPDF = () => {
    const headers = ['Trận Đấu', 'Tỷ Số', 'Giải Đấu', 'Thời Gian & Sân', 'Cầu Thủ Ghi Bàn', 'MVP'];
    const rows = filtered.map((m) => [
      `Sao Vàng FC vs ${m.opponent}`,
      m.status === 'Đã kết thúc' ? `${m.homeScore} - ${m.awayScore}` : 'Sắp diễn ra',
      m.matchType,
      `${m.date} (${m.time}) • ${m.fieldName}`,
      m.goalScorers.map((g) => `${g.playerName} (${g.minute}')`).join(', ') || '—',
      m.mvp || '—',
    ]);
    printReport({
      title: 'BÁO CÁO KẾT QUẢ THI ĐẤU & LỊCH SỬ TRẬN ĐẤU',
      subtitle: 'Thống kê kết quả thi đấu, tỷ số, danh sách ghi bàn câu lạc bộ Sao Vàng FC',
      filterInfo: `Tiêu chí: ${filterOutcome} • Tổng số trận hiển thị: ${filtered.length}`,
      tableHeaders: headers,
      tableRows: rows,
      summary: [
        { label: 'Tổng số trận đã đấu', value: stats.total },
        { label: 'Thắng - Hòa - Thua', value: `${stats.wins}T - ${stats.draws}H - ${stats.losses}B` },
        { label: 'Tỷ lệ thắng', value: `${stats.winRate}%` },
        { label: 'Bàn thắng / Thua', value: `${stats.goalsFor} / ${stats.goalsAgainst} (Hiệu số: +${stats.goalDifference})` },
      ],
    });
  };

  return (
    <>
      <link rel="stylesheet" href="/css/matches.css" />

      {/* Header trang */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>⚽</span> Quản Lý Kết Quả Trận Đấu & Lịch Sử Thi Đấu
          </h1>
          <p className="page-subtitle">
            Ghi nhận tỷ số, danh sách bàn thắng, cầu thủ xuất sắc nhất trận và thống kê phong độ thi đấu
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
              ➕ Nhập Kết Quả Trận Đấu
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
          <span>ℹ️</span> <strong>Thông báo phân quyền:</strong> Bạn đang xem với vai trò Cầu thủ. Cầu thủ có thể theo dõi tỷ số và bảng danh sách cầu thủ ghi bàn, không thể chỉnh sửa kết quả.
        </div>
      )}

      {/* TÍNH NĂNG 3: KPI THỐNG KÊ PHONG ĐỘ THI ĐẤU */}
      <section className="match-kpi-grid">
        <div className="match-kpi-card">
          <span className="match-kpi-title">Tổng Trận Đã Đấu</span>
          <div className="match-kpi-num">{stats.total}</div>
          <span className="match-kpi-desc">+{stats.upcoming} trận sắp diễn ra</span>
        </div>
        <div className="match-kpi-card">
          <span className="match-kpi-title">Thành Tích (T-H-B)</span>
          <div className="match-kpi-num" style={{ color: '#34d399' }}>
            {stats.wins} <span style={{ color: '#fbbf24', fontSize: '20px' }}>- {stats.draws} - </span>
            <span style={{ color: '#f87171', fontSize: '20px' }}>{stats.losses}</span>
          </div>
          <span className="match-kpi-desc">Tỷ lệ thắng: <strong>{stats.winRate}%</strong></span>
        </div>
        <div className="match-kpi-card">
          <span className="match-kpi-title">Bàn Thắng Ghi Được</span>
          <div className="match-kpi-num" style={{ color: '#60a5fa' }}>{stats.goalsFor}</div>
          <span className="match-kpi-desc">Trung bình: {(stats.goalsFor / (stats.total || 1)).toFixed(1)} bàn/trận</span>
        </div>
        <div className="match-kpi-card">
          <span className="match-kpi-title">Hiệu Số Bàn Thắng</span>
          <div className="match-kpi-num" style={{ color: stats.goalDifference >= 0 ? '#34d399' : '#f87171' }}>
            {stats.goalDifference >= 0 ? `+${stats.goalDifference}` : stats.goalDifference}
          </div>
          <span className="match-kpi-desc">Bị thủng lưới {stats.goalsAgainst} bàn</span>
        </div>
      </section>

      {/* Thanh bộ lọc và tìm kiếm */}
      <section style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '320px', margin: 0 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên đối thủ, giải đấu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Tất cả', 'Thắng', 'Hòa', 'Thua', 'Sắp diễn ra'].map((outcome) => (
            <button
              key={outcome}
              onClick={() => setFilterOutcome(outcome)}
              className={`btn ${filterOutcome === outcome ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              {outcome}
            </button>
          ))}
        </div>
      </section>

      {/* DANH SÁCH THẺ TRẬN ĐẤU */}
      <section className="matches-list">
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            Không tìm thấy trận đấu nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filtered.map((match) => {
            const isFinished = match.status === 'Đã kết thúc';
            const isWin = isFinished && match.homeScore > match.awayScore;
            const isDraw = isFinished && match.homeScore === match.awayScore;
            const isLoss = isFinished && match.homeScore < match.awayScore;

            let outcomeBadge = <span className="badge badge-info">SẮP DIỄN RA</span>;
            if (isWin) outcomeBadge = <span className="badge badge-success">🏆 THẮNG</span>;
            else if (isDraw) outcomeBadge = <span className="badge badge-warning">🤝 HÒA</span>;
            else if (isLoss) outcomeBadge = <span className="badge badge-danger">💔 THUA</span>;

            return (
              <article key={match.id} className="match-card">
                <div className="match-card-header">
                  <div className="match-meta-tags">
                    {outcomeBadge}
                    <span className="badge badge-info">{match.matchType}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      📅 {match.date} lúc {match.time}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                      🏟️ {match.fieldName}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(match.id)}
                        className="btn btn-danger"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        title="Xóa trận đấu"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* BẢNG TỶ SỐ TRỰC QUAN */}
                <div className="scoreboard">
                  <div className="team-box home">
                    <div>
                      <div className="team-name">SAO VÀNG FC</div>
                      <div className="team-sub">Đội Nhà • Áo Đỏ</div>
                    </div>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      ⭐
                    </div>
                  </div>

                  <div className="score-display">
                    {isFinished ? (
                      <>
                        <span className="score-number" style={{ color: isWin ? '#34d399' : '#fff' }}>
                          {match.homeScore}
                        </span>
                        <span className="score-divider">-</span>
                        <span className="score-number" style={{ color: isLoss ? '#f87171' : '#fff' }}>
                          {match.awayScore}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#93c5fd', padding: '4px 10px' }}>
                        VS
                      </span>
                    )}
                  </div>

                  <div className="team-box away">
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🛡️
                    </div>
                    <div>
                      <div className="team-name">{match.opponent}</div>
                      <div className="team-sub">Đội Khách</div>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH BÀN THẮNG & MVP */}
                <div className="match-footer-details">
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                      ⚽ Danh sách bàn thắng:
                    </div>
                    {match.goalScorers && match.goalScorers.length > 0 ? (
                      <div className="goal-scorers-list">
                        {match.goalScorers.map((scorer, i) => (
                          <span key={i} className="scorer-pill">
                            ⚽ {scorer.playerName} <strong>{scorer.minute}&apos;</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                        {isFinished ? 'Không có bàn thắng' : 'Chưa diễn ra'}
                      </span>
                    )}
                  </div>

                  {match.mvp && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cầu thủ xuất sắc nhất:</span>
                      <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                        🌟 MVP: {match.mvp}
                      </span>
                    </div>
                  )}

                  {match.notes && (
                    <div style={{ width: '100%', fontSize: '12px', color: 'var(--text-sub)', marginTop: '6px', fontStyle: 'italic' }}>
                      💬 Nhận định của HLV: &ldquo;{match.notes}&rdquo;
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* MODAL NHẬP KẾT QUẢ TRẬN ĐẤU MỚI */}
      {showAddModal && canManage && (
        <div className="modal-overlay active">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>➕ Nhập Kết Quả Trận Đấu Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tên đội đối thủ:</label>
                  <input
                    type="text"
                    required
                    value={newMatch.opponent}
                    onChange={(e) => setNewMatch({ ...newMatch, opponent: e.target.value })}
                    placeholder="Ví dụ: Hải Phòng United"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phân loại trận:</label>
                  <select
                    value={newMatch.matchType}
                    onChange={(e) => setNewMatch({ ...newMatch, matchType: e.target.value as any })}
                    className="form-control"
                  >
                    <option value="Giao hữu">Giao hữu</option>
                    <option value="Giải đấu">Giải đấu chính thức</option>
                    <option value="Cúp Mở Rộng">Cúp Mở Rộng</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày thi đấu:</label>
                  <input
                    type="date"
                    required
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sân thi đấu:</label>
                  <select
                    value={newMatch.fieldName}
                    onChange={(e) => setNewMatch({ ...newMatch, fieldName: e.target.value })}
                    className="form-control"
                  >
                    <option value="Sân bóng Sao Vàng A (Sân 7)">Sân bóng Sao Vàng A (Sân 7)</option>
                    <option value="Sân bóng Sao Vàng B (Sân 11)">Sân bóng Sao Vàng B (Sân 11)</option>
                    <option value="Sân vận động Mỹ Đình Mini">Sân vận động Mỹ Đình Mini</option>
                  </select>
                </div>
              </div>

              {/* Tỷ số */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>Tỷ số trận đấu:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>Sao Vàng FC</span>
                    <input
                      type="number"
                      min="0"
                      value={newMatch.homeScore}
                      onChange={(e) => setNewMatch({ ...newMatch, homeScore: Number(e.target.value) })}
                      className="form-control"
                      style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
                    />
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>-</span>
                  <div>
                    <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>Đối thủ</span>
                    <input
                      type="number"
                      min="0"
                      value={newMatch.awayScore}
                      onChange={(e) => setNewMatch({ ...newMatch, awayScore: Number(e.target.value) })}
                      className="form-control"
                      style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </div>

              {/* Nhập cầu thủ ghi bàn */}
              <div className="form-group">
                <label className="form-label">Ghi nhận bàn thắng của Sao Vàng FC:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={newScorerName}
                    onChange={(e) => setNewScorerName(e.target.value)}
                    placeholder="Tên cầu thủ ghi bàn"
                    className="form-control"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newScorerMinute}
                    onChange={(e) => setNewScorerMinute(Number(e.target.value))}
                    placeholder="Phút"
                    className="form-control"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={addScorer} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                    ➕ Thêm
                  </button>
                </div>

                {scorers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {scorers.map((s, index) => (
                      <span key={index} className="scorer-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        ⚽ {s.playerName} ({s.minute}&apos;)
                        <button
                          type="button"
                          onClick={() => removeScorer(index)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Cầu thủ xuất sắc nhất (MVP):</label>
                  <input
                    type="text"
                    value={newMatch.mvp}
                    onChange={(e) => setNewMatch({ ...newMatch, mvp: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Quang Hải"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái:</label>
                  <select
                    value={newMatch.status}
                    onChange={(e) => setNewMatch({ ...newMatch, status: e.target.value as any })}
                    className="form-control"
                  >
                    <option value="Đã kết thúc">Đã kết thúc</option>
                    <option value="Sắp diễn ra">Sắp diễn ra</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nhận định của HLV:</label>
                <textarea
                  rows={2}
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                  placeholder="Ghi chú về lối chơi, điểm cần khắc phục..."
                  className="form-control"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Kết Quả Trận Đấu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
