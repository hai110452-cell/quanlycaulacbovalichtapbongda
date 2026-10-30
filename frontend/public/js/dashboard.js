// ==========================================================================
// DASHBOARD LOGIC
// ==========================================================================

const mockSchedules = [
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

async function loadDashboardData() {
  const listContainer = document.getElementById('upcomingScheduleList');
  if (!listContainer) return;

  // Gọi API lấy lịch tập
  let schedules = await apiClient.get('/schedules');
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    schedules = mockSchedules;
  }

  // Cập nhật thống kê
  const players = await apiClient.get('/players');
  if (players && Array.isArray(players)) {
    const el = document.getElementById('statPlayerCount');
    if (el) el.textContent = players.length;
  }

  const fields = await apiClient.get('/fields');
  if (fields && Array.isArray(fields)) {
    const el = document.getElementById('statFieldCount');
    if (el) el.textContent = fields.length;
  }

  // Render danh sách lịch tập
  listContainer.innerHTML = schedules.slice(0, 3).map((item) => `
    <article class="schedule-item-card">
      <div>
        <h3 class="schedule-item-title">${item.title}</h3>
        <div class="schedule-item-meta">
          <span>📅 ${item.date || 'Hôm nay'}</span>
          <span>⏰ ${item.startTime ? `${item.startTime} - ${item.endTime}` : item.time || '18:00 - 20:00'}</span>
          <span>🏟️ ${item.fieldName || item.field || 'Sân Sao Vàng A'}</span>
          <span>👤 ${item.coach || 'HLV trưởng'}</span>
        </div>
      </div>
      <div>
        <span class="badge badge-success">${item.type || 'Luyện tập'}</span>
      </div>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadDashboardData);
