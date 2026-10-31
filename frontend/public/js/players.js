// ==========================================================================
// PLAYERS LOGIC & PROFILE DETAILS
// ==========================================================================

const defaultPlayers = [
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

let playerList = [];
let activePosition = 'Tất cả';
let searchQuery = '';

async function initPlayers() {
  try {
    const res = await apiClient.get('/players');
    if (res && Array.isArray(res) && res.length > 0) {
      playerList = res;
      saveLocalPlayers();
    } else {
      try {
        const saved = localStorage.getItem('localPlayers');
        playerList = (saved && saved !== 'undefined') ? JSON.parse(saved) : defaultPlayers;
      } catch {
        playerList = defaultPlayers;
      }
    }
  } catch (e) {
    try {
      const saved = localStorage.getItem('localPlayers');
      playerList = (saved && saved !== 'undefined') ? JSON.parse(saved) : defaultPlayers;
    } catch {
      playerList = defaultPlayers;
    }
  }
  checkRBAC();
  renderPlayers();
}

function checkRBAC() {
  const user = getAuthUser();
  const canManage = user && (user.role === 'admin' || user.role === 'coach');
  const btnOpen = document.getElementById('btnOpenAddModal');
  const notice = document.getElementById('playerRoleNotice');

  if (!canManage) {
    if (btnOpen) btnOpen.style.display = 'none';
    if (notice) {
      notice.style.display = 'block';
      notice.innerHTML = 'ℹ️ <strong>Chế độ Xem (Cầu thủ):</strong> Bạn đang đăng nhập với tư cách Cầu thủ. Bạn có quyền xem hồ sơ chi tiết nhưng không được thêm hoặc xóa cầu thủ.';
    }
  } else {
    if (btnOpen) btnOpen.style.display = 'inline-flex';
    if (notice) notice.style.display = 'none';
  }
}

let activeStatus = 'Tất cả';
let activeFoot = 'Tất cả';
let activeSort = 'jersey-asc';

function saveLocalPlayers() {
  localStorage.setItem('localPlayers', JSON.stringify(playerList));
}

function renderPlayers() {
  const container = document.getElementById('playersContainer');
  const countSpan = document.getElementById('playerTotalCount');
  const matchIndicator = document.getElementById('playerMatchIndicator');
  if (!container) return;

  const user = getAuthUser();
  const canManage = user && (user.role === 'admin' || user.role === 'coach');

  let filtered = playerList.filter((p) => {
    const matchPos = activePosition === 'Tất cả' || p.position === activePosition;
    const matchStatus = activeStatus === 'Tất cả' || p.status === activeStatus;
    const matchFoot = activeFoot === 'Tất cả' || (p.preferredFoot && p.preferredFoot.includes(activeFoot));
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      String(p.jerseyNumber).includes(q) ||
      (p.phone && p.phone.includes(q));
    return matchPos && matchStatus && matchFoot && matchSearch;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (activeSort === 'jersey-asc') return a.jerseyNumber - b.jerseyNumber;
    if (activeSort === 'jersey-desc') return b.jerseyNumber - a.jerseyNumber;
    if (activeSort === 'name-asc') return a.name.localeCompare(b.name, 'vi');
    if (activeSort === 'name-desc') return b.name.localeCompare(a.name, 'vi');
    return 0;
  });

  if (countSpan) countSpan.textContent = filtered.length;
  if (matchIndicator) matchIndicator.textContent = `Tìm thấy ${filtered.length} / ${playerList.length} cầu thủ`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
        <p style="font-size: 32px; margin-bottom: 8px;">🔍</p>
        <p>Không tìm thấy cầu thủ nào phù hợp với bộ lọc!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((player) => {
    let badgeClass = 'badge-success';
    if (player.status === 'Chấn thương') badgeClass = 'badge-danger';
    else if (player.status === 'Nghỉ phép') badgeClass = 'badge-warning';

    return `
      <article class="player-card">
        <div class="player-header">
          <div class="jersey-badge">#${player.jerseyNumber}</div>
          <span class="badge ${badgeClass}">${player.status || 'Đang thi đấu'}</span>
        </div>
        <h3 class="player-name">${player.name}</h3>
        <p class="player-position">Vị trí: ${player.position}</p>
        <ul class="player-info-list">
          <li class="player-info-item">📞 <span>Điện thoại: ${player.phone || 'Chưa cập nhật'}</span></li>
          <li class="player-info-item">🎂 <span>Ngày sinh: ${player.dateOfBirth || '2000-01-01'}</span></li>
          <li class="player-info-item">⚽ <span>Biên chế: CLB Sao Vàng FC</span></li>
        </ul>
        <div class="player-actions" style="display: flex; gap: 8px;">
          <button class="btn btn-secondary" style="flex: 1; font-size: 12px; padding: 7px 10px;" onclick="viewPlayerProfile('${player.id}')">
            👁️ Xem Hồ Sơ
          </button>
          ${canManage ? `
            <button class="btn btn-danger" style="font-size: 12px; padding: 7px 12px;" title="Xóa" onclick="deletePlayer('${player.id}')">
              🗑️
            </button>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');
}

window.viewPlayerProfile = function(id) {
  const p = playerList.find((item) => String(item.id) === String(id));
  if (!p) return;

  const modal = document.getElementById('profilePlayerModal');
  document.getElementById('profJerseyBadge').textContent = `#${p.jerseyNumber}`;
  document.getElementById('profName').textContent = p.name;
  document.getElementById('profPosition').textContent = p.position;
  
  const statusEl = document.getElementById('profStatus');
  statusEl.textContent = p.status || 'Đang thi đấu';
  statusEl.className = `badge ${p.status === 'Chấn thương' ? 'badge-danger' : p.status === 'Nghỉ phép' ? 'badge-warning' : 'badge-success'}`;

  document.getElementById('profDob').textContent = p.dateOfBirth || '2000-01-01';
  document.getElementById('profPhone').textContent = p.phone || 'Chưa cập nhật';
  document.getElementById('profHeight').textContent = p.height || '1m78';
  document.getElementById('profWeight').textContent = p.weight || '74kg';
  document.getElementById('profFoot').textContent = p.preferredFoot || 'Chân phải';
  document.getElementById('profJoined').textContent = p.joinedDate || '2023';

  const histBody = document.getElementById('profHistoryTableBody');
  const history = p.history || [
    { date: '25/10/2026', sessionTitle: 'Tập thể lực và chiến thuật', status: 'Có mặt' },
    { date: '22/10/2026', sessionTitle: 'Tập phối hợp bóng ngắn', status: 'Có mặt' },
    { date: '19/10/2026', sessionTitle: 'Đối kháng nội bộ 11v11', status: 'Có mặt' },
  ];

  histBody.innerHTML = history.map((h) => `
    <tr style="border-top: 1px solid var(--border-color);">
      <td style="padding: 10px 14px; color: #93c5fd;">${h.date}</td>
      <td style="padding: 10px 14px;">
        <strong>${h.sessionTitle}</strong>
        ${h.note ? `<div style="font-size: 11px; color: #fbbf24;">* ${h.note}</div>` : ''}
      </td>
      <td style="padding: 10px 14px;">
        <span class="badge ${h.status === 'Có mặt' ? 'badge-success' : h.status === 'Đến muộn' ? 'badge-warning' : 'badge-danger'}">
          ${h.status}
        </span>
      </td>
    </tr>
  `).join('');

  modal.classList.add('active');
};

window.deletePlayer = async function(id) {
  const user = getAuthUser();
  if (user && user.role === 'player') {
    alert('Cầu thủ không có quyền xóa cầu thủ!');
    return;
  }
  if (confirm('Bạn có chắc chắn muốn xóa cầu thủ này khỏi danh sách?')) {
    try {
      await apiClient.delete(`/players/${id}`);
      await initPlayers();
    } catch (err) {
      console.error('Lỗi khi xóa cầu thủ:', err);
      playerList = playerList.filter((p) => String(p.id) !== String(id));
      saveLocalPlayers();
      renderPlayers();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initPlayers();

  // Tìm kiếm
  const searchInput = document.getElementById('searchPlayerInput');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderPlayers();
  });

  // Lọc vị trí
  const filterBtns = document.querySelectorAll('#positionFilters .filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activePosition = btn.getAttribute('data-pos');
      renderPlayers();
    });
  });

  // Modal Profile
  const profModal = document.getElementById('profilePlayerModal');
  const btnCloseProf = document.getElementById('btnCloseProfileModal');
  const btnCloseProfBtn = document.getElementById('btnCloseProfileModalBtn');
  btnCloseProf?.addEventListener('click', () => profModal.classList.remove('active'));
  btnCloseProfBtn?.addEventListener('click', () => profModal.classList.remove('active'));

  // Modal Add
  const modal = document.getElementById('addPlayerModal');
  const btnOpen = document.getElementById('btnOpenAddModal');
  const btnClose = document.getElementById('btnCloseModal');
  const btnCancel = document.getElementById('btnCancelModal');
  const form = document.getElementById('addPlayerForm');

  btnOpen?.addEventListener('click', () => modal.classList.add('active'));
  btnClose?.addEventListener('click', () => modal.classList.remove('active'));
  btnCancel?.addEventListener('click', () => modal.classList.remove('active'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newPlayerName').value.trim();
    const jerseyNumber = Number(document.getElementById('newPlayerJersey').value);
    const position = document.getElementById('newPlayerPosition').value;
    const phone = document.getElementById('newPlayerPhone').value.trim();
    const status = document.getElementById('newPlayerStatus').value;
    const dateOfBirth = document.getElementById('newPlayerDob').value || '2000-01-01';

    const newObj = {
      name,
      jerseyNumber,
      position,
      dateOfBirth,
      phone: phone || '0901234567',
      status,
      height: '1m76',
      weight: '72kg',
      preferredFoot: 'Chân phải',
      joinedDate: '26/10/2026',
      history: [
        { date: '26/10/2026', sessionTitle: 'Buổi tập gia nhập đội bóng', status: 'Có mặt' }
      ]
    };

    try {
      await apiClient.post('/players', newObj);
      await initPlayers();
    } catch (err) {
      console.error('Lỗi khi thêm cầu thủ:', err);
      playerList.unshift({ id: Date.now().toString(), ...newObj });
      saveLocalPlayers();
      renderPlayers();
    }
    modal.classList.remove('active');
    form.reset();
  });

  // Advanced Filters
  const statusSelect = document.getElementById('filterStatusSelect');
  statusSelect?.addEventListener('change', (e) => {
    activeStatus = e.target.value;
    renderPlayers();
  });

  const footSelect = document.getElementById('filterFootSelect');
  footSelect?.addEventListener('change', (e) => {
    activeFoot = e.target.value;
    renderPlayers();
  });

  const sortSelect = document.getElementById('filterSortSelect');
  sortSelect?.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderPlayers();
  });

  const btnReset = document.getElementById('btnResetFilters');
  btnReset?.addEventListener('click', () => {
    activePosition = 'Tất cả';
    activeStatus = 'Tất cả';
    activeFoot = 'Tất cả';
    activeSort = 'jersey-asc';
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = 'Tất cả';
    if (footSelect) footSelect.value = 'Tất cả';
    if (sortSelect) sortSelect.value = 'jersey-asc';
    filterBtns.forEach((b) => b.classList.remove('active'));
    document.querySelector('#positionFilters [data-pos="Tất cả"]')?.classList.add('active');
    renderPlayers();
  });

  // Export Excel
  const btnExportExcel = document.getElementById('btnExportPlayersExcel');
  btnExportExcel?.addEventListener('click', () => {
    const headers = ['STT', 'Số Áo', 'Họ Tên', 'Vị Trí', 'Ngày Sinh', 'Điện Thoại', 'Thể Chất', 'Chân Thuận', 'Trạng Thái'];
    const rows = playerList.map((p, idx) => [
      idx + 1,
      p.jerseyNumber,
      p.name,
      p.position,
      p.dateOfBirth,
      p.phone,
      `${p.height || '1m78'} / ${p.weight || '74kg'}`,
      p.preferredFoot || 'Chân phải',
      p.status,
    ]);
    exportToCSV('Danh_Sach_Cau_Thu_SaoVangFC', headers, rows);
  });

  // Print PDF
  const btnPrintPDF = document.getElementById('btnPrintPlayersPDF');
  btnPrintPDF?.addEventListener('click', () => {
    const headers = ['Số Áo', 'Họ Tên', 'Vị Trí', 'Ngày Sinh', 'Điện Thoại', 'Thể Chất', 'Trạng Thái'];
    const rows = playerList.map((p) => [
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
      subtitle: 'Hồ sơ nhân sự thi đấu câu lạc bộ bóng đá Sao Vàng FC',
      filterInfo: `Tổng số: ${playerList.length} cầu thủ`,
      tableHeaders: headers,
      tableRows: rows,
      summary: [
        { label: 'Tổng cầu thủ', value: playerList.length },
        { label: 'Đang thi đấu', value: playerList.filter((p) => p.status === 'Đang thi đấu').length },
      ],
    });
  });
});
