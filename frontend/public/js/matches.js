/**
 * matches.js - Quản lý kết quả trận đấu & lịch sử thi đấu
 */

let matches = [
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

let currentFilter = 'Tất cả';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  renderKPIs();
  renderMatches();
  setupRolePermissions();
  setupEventListeners();
});

function setupRolePermissions() {
  const user = window.auth ? window.auth.getCurrentUser() : null;
  const canManage = user?.role === 'admin' || user?.role === 'coach';

  const btnOpen = document.getElementById('btnOpenAddMatch');
  const roleNotice = document.getElementById('matchRoleNotice');

  if (!canManage) {
    if (btnOpen) btnOpen.style.display = 'none';
    if (roleNotice) {
      roleNotice.style.display = 'block';
      roleNotice.innerHTML = '<span>ℹ️</span> <strong>Chế độ Xem (Cầu thủ):</strong> Bạn chỉ có quyền theo dõi kết quả thi đấu & danh sách bàn thắng, không có quyền tạo hoặc xóa kết quả trận đấu.';
    }
  } else {
    if (btnOpen) btnOpen.style.display = 'inline-block';
    if (roleNotice) roleNotice.style.display = 'none';
  }
}

function renderKPIs() {
  const finished = matches.filter(m => m.status === 'Đã kết thúc');
  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;

  finished.forEach(m => {
    gf += m.homeScore;
    ga += m.awayScore;
    if (m.homeScore > m.awayScore) wins++;
    else if (m.homeScore === m.awayScore) draws++;
    else losses++;
  });

  const total = finished.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const diff = gf - ga;

  const kpiTotal = document.getElementById('kpiTotalMatches');
  const kpiRec = document.getElementById('kpiRecord');
  const kpiRate = document.getElementById('kpiWinRate');
  const kpiGf = document.getElementById('kpiGoalsFor');
  const kpiDiff = document.getElementById('kpiDiff');
  const kpiGa = document.getElementById('kpiGoalsAgainst');

  if (kpiTotal) kpiTotal.innerText = total;
  if (kpiRec) kpiRec.innerHTML = `${wins} <span style="color: #fbbf24; font-size: 18px;">- ${draws} - </span><span style="color: #f87171; font-size: 18px;">${losses}</span>`;
  if (kpiRate) kpiRate.innerText = `${winRate}%`;
  if (kpiGf) kpiGf.innerText = gf;
  if (kpiDiff) {
    kpiDiff.innerText = diff >= 0 ? `+${diff}` : diff;
    kpiDiff.style.color = diff >= 0 ? '#34d399' : '#f87171';
  }
  if (kpiGa) kpiGa.innerText = `Thủng lưới ${ga} bàn`;
}

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  if (!container) return;

  const user = window.auth ? window.auth.getCurrentUser() : null;
  const canManage = user?.role === 'admin' || user?.role === 'coach';

  const filtered = matches.filter(m => {
    let matchOutcome = true;
    if (currentFilter === 'Thắng') matchOutcome = m.status === 'Đã kết thúc' && m.homeScore > m.awayScore;
    else if (currentFilter === 'Hòa') matchOutcome = m.status === 'Đã kết thúc' && m.homeScore === m.awayScore;
    else if (currentFilter === 'Thua') matchOutcome = m.status === 'Đã kết thúc' && m.homeScore < m.awayScore;
    else if (currentFilter === 'Sắp diễn ra') matchOutcome = m.status === 'Sắp diễn ra';

    const matchSearch =
      m.opponent.toLowerCase().includes(currentSearch.toLowerCase()) ||
      m.matchType.toLowerCase().includes(currentSearch.toLowerCase()) ||
      m.fieldName.toLowerCase().includes(currentSearch.toLowerCase());

    return matchOutcome && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">Không tìm thấy kết quả trận đấu nào phù hợp.</div>';
    return;
  }

  container.innerHTML = filtered.map(m => {
    const isFinished = m.status === 'Đã kết thúc';
    const isWin = isFinished && m.homeScore > m.awayScore;
    const isDraw = isFinished && m.homeScore === m.awayScore;
    const isLoss = isFinished && m.homeScore < m.awayScore;

    let badgeHtml = '<span class="badge badge-info">SẮP DIỄN RA</span>';
    if (isWin) badgeHtml = '<span class="badge badge-success">🏆 THẮNG</span>';
    else if (isDraw) badgeHtml = '<span class="badge badge-warning">🤝 HÒA</span>';
    else if (isLoss) badgeHtml = '<span class="badge badge-danger">💔 THUA</span>';

    const scorersHtml = m.goalScorers && m.goalScorers.length > 0
      ? m.goalScorers.map(g => `<span class="scorer-pill">⚽ ${g.playerName} <strong>${g.minute}'</strong></span>`).join('')
      : `<span style="font-size: 12px; color: var(--text-sub);">${isFinished ? 'Không có bàn thắng' : 'Chưa thi đấu'}</span>`;

    return `
      <article class="match-card">
        <div class="match-card-header">
          <div class="match-meta-tags">
            ${badgeHtml}
            <span class="badge badge-info">${m.matchType}</span>
            <span style="font-size: 13px; color: var(--text-muted);">📅 ${m.date} lúc ${m.time}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-sub);">🏟️ ${m.fieldName}</span>
            ${canManage ? `<button onclick="deleteMatch('${m.id}')" class="btn btn-danger" style="font-size: 11px; padding: 3px 8px;">🗑️</button>` : ''}
          </div>
        </div>

        <div class="scoreboard">
          <div class="team-box home">
            <div>
              <div class="team-name">SAO VÀNG FC</div>
              <div class="team-sub">Đội Nhà • Áo Đỏ</div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; font-size: 20px;">⭐</div>
          </div>

          <div class="score-display">
            ${isFinished
              ? `<span class="score-number" style="color: ${isWin ? '#34d399' : '#fff'};">${m.homeScore}</span>
                 <span class="score-divider">-</span>
                 <span class="score-number" style="color: ${isLoss ? '#f87171' : '#fff'};">${m.awayScore}</span>`
              : `<span style="font-size: 16px; font-weight: 700; color: #93c5fd; padding: 4px 10px;">VS</span>`
            }
          </div>

          <div class="team-box away">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 20px;">🛡️</div>
            <div>
              <div class="team-name">${m.opponent}</div>
              <div class="team-sub">Đội Khách</div>
            </div>
          </div>
        </div>

        <div class="match-footer-details">
          <div style="flex: 1; min-width: 240px;">
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">⚽ Bàn thắng:</div>
            <div class="goal-scorers-list">${scorersHtml}</div>
          </div>
          ${m.mvp ? `<div><span class="badge badge-warning">🌟 MVP: ${m.mvp}</span></div>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

function deleteMatch(id) {
  const user = window.auth ? window.auth.getCurrentUser() : null;
  if (user?.role === 'player') return;

  if (confirm('Bạn có chắc chắn muốn xóa kết quả trận đấu này?')) {
    matches = matches.filter(m => m.id !== id);
    renderKPIs();
    renderMatches();
  }
}

function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('searchMatchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderMatches();
    });
  }

  // Outcome filters
  const filterBtns = document.querySelectorAll('#matchOutcomeFilters .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'Tất cả';
      renderMatches();
    });
  });

  // Modal controls
  const modal = document.getElementById('addMatchModal');
  const btnOpen = document.getElementById('btnOpenAddMatch');
  const btnClose = document.getElementById('btnCloseAddMatch');
  const btnCancel = document.getElementById('btnCancelAddMatch');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => modal.classList.add('active'));
  }
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (btnCancel && modal) {
    btnCancel.addEventListener('click', () => modal.classList.remove('active'));
  }

  // Add match form submit
  const form = document.getElementById('addMatchForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const opponent = document.getElementById('matchOpponent').value;
      const matchType = document.getElementById('matchType').value;
      const date = document.getElementById('matchDate').value;
      const fieldName = document.getElementById('matchField').value;
      const homeScore = Number(document.getElementById('matchHomeScore').value || 0);
      const awayScore = Number(document.getElementById('matchAwayScore').value || 0);
      const mvp = document.getElementById('matchMVP').value;
      const status = document.getElementById('matchStatus').value;
      const notes = document.getElementById('matchNotes').value;
      const scorersRaw = document.getElementById('matchScorersInput').value;

      const scorers = scorersRaw
        ? scorersRaw.split(',').map(s => {
            const parts = s.trim().split(' ');
            const minPart = parts[parts.length - 1].replace(/['\(\)]/g, '');
            const name = parts.slice(0, parts.length - 1).join(' ') || parts.join(' ');
            return { playerName: name, minute: Number(minPart) || 45 };
          })
        : [];

      const newM = {
        id: `match-${Date.now()}`,
        opponent,
        matchType,
        date,
        time: '16:00',
        fieldName,
        homeScore,
        awayScore,
        status,
        goalScorers: status === 'Đã kết thúc' ? scorers : [],
        mvp,
        notes,
      };

      matches.unshift(newM);
      renderKPIs();
      renderMatches();
      if (modal) modal.classList.remove('active');
      form.reset();
    });
  }

  // Export Excel
  const btnExcel = document.getElementById('btnExportExcel');
  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      const headers = ['STT', 'Đội Nhà', 'Tỷ Số', 'Đội Khách', 'Giải Đấu', 'Ngày', 'Sân', 'Bàn Thắng', 'MVP'];
      const rows = matches.map((m, idx) => [
        idx + 1,
        'Sao Vàng FC',
        m.status === 'Đã kết thúc' ? `${m.homeScore} - ${m.awayScore}` : 'Chưa đấu',
        m.opponent,
        m.matchType,
        m.date,
        m.fieldName,
        m.goalScorers.map(g => `${g.playerName} (${g.minute}')`).join(', ') || '—',
        m.mvp || '—',
      ]);
      exportToCSV('Ket_Qua_Tran_Dau_SaoVangFC', headers, rows);
    });
  }

  // Print PDF
  const btnPdf = document.getElementById('btnPrintPDF');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const headers = ['Trận Đấu', 'Tỷ Số', 'Giải Đấu', 'Thời Gian & Sân', 'Cầu Thủ Ghi Bàn', 'MVP'];
      const rows = matches.map(m => [
        `Sao Vàng FC vs ${m.opponent}`,
        m.status === 'Đã kết thúc' ? `${m.homeScore} - ${m.awayScore}` : 'Sắp diễn ra',
        m.matchType,
        `${m.date} • ${m.fieldName}`,
        m.goalScorers.map(g => `${g.playerName} (${g.minute}')`).join(', ') || '—',
        m.mvp || '—',
      ]);
      printReport({
        title: 'BÁO CÁO KẾT QUẢ THI ĐẤU & LỊCH SỬ TRẬN ĐẤU',
        subtitle: 'Thống kê kết quả thi đấu câu lạc bộ bóng đá Sao Vàng FC',
        filterInfo: `Tổng số trận: ${matches.length}`,
        tableHeaders: headers,
        tableRows: rows,
        summary: [
          { label: 'Số trận', value: matches.length },
          { label: 'Đội bóng', value: 'Sao Vàng FC' },
        ],
      });
    });
  }
}
