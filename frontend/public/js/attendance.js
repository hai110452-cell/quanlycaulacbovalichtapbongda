// ==========================================================================
// ATTENDANCE & STATS LOGIC
// ==========================================================================

const defaultAttendance = [
  { id: '1', name: 'Đặng Văn Lâm', jerseyNumber: 1, position: 'Thủ môn', status: 'Có mặt', note: '' },
  { id: '2', name: 'Đỗ Duy Mạnh', jerseyNumber: 4, position: 'Hậu vệ', status: 'Có mặt', note: '' },
  { id: '3', name: 'Đoàn Văn Hậu', jerseyNumber: 5, position: 'Hậu vệ', status: 'Vắng có phép', note: 'Chấn thương gối' },
  { id: '4', name: 'Nguyễn Quang Hải', jerseyNumber: 19, position: 'Tiền vệ', status: 'Có mặt', note: '' },
  { id: '5', name: 'Nguyễn Hoàng Đức', jerseyNumber: 14, position: 'Tiền vệ', status: 'Có mặt', note: '' },
  { id: '6', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', status: 'Đến muộn', note: 'Kẹt xe' },
];

const playerStatsData = [
  { id: '1', name: 'Đặng Văn Lâm', jerseyNumber: 1, position: 'Thủ môn', presentCount: 12, lateCount: 0, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '2', name: 'Đỗ Duy Mạnh', jerseyNumber: 4, position: 'Hậu vệ', presentCount: 11, lateCount: 1, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '3', name: 'Đoàn Văn Hậu', jerseyNumber: 5, position: 'Hậu vệ', presentCount: 8, lateCount: 1, excusedCount: 3, unexcusedCount: 0, totalSessions: 12 },
  { id: '4', name: 'Nguyễn Quang Hải', jerseyNumber: 19, position: 'Tiền vệ', presentCount: 12, lateCount: 0, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '5', name: 'Nguyễn Hoàng Đức', jerseyNumber: 14, position: 'Tiền vệ', presentCount: 10, lateCount: 2, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '6', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', presentCount: 9, lateCount: 2, excusedCount: 1, unexcusedCount: 0, totalSessions: 12 },
];

let attendanceList = [];
let currentPeriod = 'all';

function initAttendance() {
  const saved = localStorage.getItem('localAttendance');
  attendanceList = saved ? JSON.parse(saved) : defaultAttendance;
  
  checkRBAC();
  renderAttendanceTable();
  updateSummaryMetrics();
  renderStatsTable();
}

function checkRBAC() {
  const user = getAuthUser();
  const canEdit = user && (user.role === 'admin' || user.role === 'coach');
  const btnSave = document.getElementById('btnSaveAttendance');
  const roleNotice = document.getElementById('roleNotice');

  if (!canEdit) {
    if (btnSave) btnSave.style.display = 'none';
    if (roleNotice) {
      roleNotice.style.display = 'block';
      roleNotice.innerHTML = 'ℹ️ <strong>Chế độ Xem (Cầu thủ):</strong> Bạn đang đăng nhập với vai trò Cầu thủ. Chỉ Huấn luyện viên và Quản trị viên mới có quyền chỉnh sửa và lưu kết quả điểm danh.';
    }
  } else {
    if (btnSave) btnSave.style.display = 'inline-flex';
    if (roleNotice) roleNotice.style.display = 'none';
  }
}

function updateSummaryMetrics() {
  const present = attendanceList.filter((a) => a.status === 'Có mặt').length;
  const late = attendanceList.filter((a) => a.status === 'Đến muộn').length;
  const absent = attendanceList.filter((a) => a.status.startsWith('Vắng')).length;

  const countPresent = document.getElementById('countPresent');
  const countLate = document.getElementById('countLate');
  const countAbsent = document.getElementById('countAbsent');
  const countTotal = document.getElementById('countTotal');

  if (countPresent) countPresent.textContent = present;
  if (countLate) countLate.textContent = late;
  if (countAbsent) countAbsent.textContent = absent;
  if (countTotal) countTotal.textContent = attendanceList.length;
}

function renderAttendanceTable() {
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody) return;

  const user = getAuthUser();
  const canEdit = user && (user.role === 'admin' || user.role === 'coach');

  tbody.innerHTML = attendanceList.map((item, idx) => `
    <tr>
      <td><strong>#${item.jerseyNumber}</strong></td>
      <td><strong>${item.name}</strong></td>
      <td><span class="badge badge-info">${item.position}</span></td>
      <td>
        <select
          class="status-select"
          ${canEdit ? '' : 'disabled'}
          style="${canEdit ? '' : 'opacity: 0.7; cursor: not-allowed;'}"
          onchange="updatePlayerStatus(${idx}, this.value)"
        >
          <option value="Có mặt" ${item.status === 'Có mặt' ? 'selected' : ''}>🟢 Có mặt</option>
          <option value="Đến muộn" ${item.status === 'Đến muộn' ? 'selected' : ''}>🟡 Đến muộn</option>
          <option value="Vắng có phép" ${item.status === 'Vắng có phép' ? 'selected' : ''}>🔵 Vắng có phép</option>
          <option value="Vắng không phép" ${item.status === 'Vắng không phép' ? 'selected' : ''}>🔴 Vắng không phép</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          class="form-control"
          style="padding: 6px 10px; font-size: 13px;"
          value="${item.note || ''}"
          placeholder="Nhập ghi chú..."
          ${canEdit ? '' : 'disabled'}
          onchange="updatePlayerNote(${idx}, this.value)"
        >
      </td>
    </tr>
  `).join('');
}

function renderStatsTable() {
  const tbody = document.getElementById('statsTableBody');
  if (!tbody) return;

  const stats = playerStatsData.map((s) => {
    let total = s.totalSessions;
    let present = s.presentCount;
    let late = s.lateCount;
    if (currentPeriod === 'week') {
      total = 3;
      present = Math.min(present, 3);
      late = Math.min(late, 1);
    } else if (currentPeriod === 'month') {
      total = 8;
      present = Math.min(present, 7);
      late = Math.min(late, 1);
    }
    const rate = Math.round(((present + late * 0.5) / total) * 100);
    return { ...s, total, present, late, rate };
  });

  tbody.innerHTML = stats.map((st) => {
    let grade = 'Xuất sắc';
    let gradeBadge = 'badge-success';
    if (st.rate < 80) {
      grade = 'Cần cải thiện';
      gradeBadge = 'badge-danger';
    } else if (st.rate < 90) {
      grade = 'Khá tốt';
      gradeBadge = 'badge-warning';
    }

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: var(--primary);">#${st.jerseyNumber}</strong>
            <span>${st.name}</span>
          </div>
        </td>
        <td><span class="badge badge-info">${st.position}</span></td>
        <td><strong style="color: #34d399;">${st.present}</strong> / ${st.total}</td>
        <td><span style="color: #fbbf24; font-weight: 600;">${st.late}</span></td>
        <td><span style="color: #93c5fd;">${st.excusedCount}</span></td>
        <td><span style="color: #f87171;">${st.unexcusedCount}</span></td>
        <td style="min-width: 160px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 8px; background: #334155; border-radius: 4px; overflow: hidden;">
              <div style="width: ${st.rate}%; height: 100%; background: ${st.rate >= 90 ? '#10b981' : st.rate >= 80 ? '#f59e0b' : '#ef4444'}; border-radius: 4px;"></div>
            </div>
            <strong style="font-size: 13px;">${st.rate}%</strong>
          </div>
        </td>
        <td><span class="badge ${gradeBadge}">${grade}</span></td>
      </tr>
    `;
  }).join('');
}

window.updatePlayerStatus = function(idx, status) {
  attendanceList[idx].status = status;
  updateSummaryMetrics();
};

window.updatePlayerNote = function(idx, note) {
  attendanceList[idx].note = note;
};

document.addEventListener('DOMContentLoaded', () => {
  initAttendance();

  // Tab switching
  const tabBtnSheet = document.getElementById('tabBtnSheet');
  const tabBtnStats = document.getElementById('tabBtnStats');
  const sheetContent = document.getElementById('tabSheetContent');
  const statsContent = document.getElementById('tabStatsContent');

  tabBtnSheet?.addEventListener('click', () => {
    tabBtnSheet.className = 'btn btn-primary';
    tabBtnStats.className = 'btn btn-secondary';
    sheetContent.style.display = 'block';
    statsContent.style.display = 'none';
  });

  tabBtnStats?.addEventListener('click', () => {
    tabBtnSheet.className = 'btn btn-secondary';
    tabBtnStats.className = 'btn btn-primary';
    sheetContent.style.display = 'none';
    statsContent.style.display = 'block';
  });

  // Period filter
  const fAll = document.getElementById('filterPeriodAll');
  const fMonth = document.getElementById('filterPeriodMonth');
  const fWeek = document.getElementById('filterPeriodWeek');

  const setPeriod = (p, activeBtn) => {
    currentPeriod = p;
    [fAll, fMonth, fWeek].forEach((b) => b?.classList.replace('btn-primary', 'btn-secondary'));
    activeBtn.classList.replace('btn-secondary', 'btn-primary');
    renderStatsTable();
  };

  fAll?.addEventListener('click', () => setPeriod('all', fAll));
  fMonth?.addEventListener('click', () => setPeriod('month', fMonth));
  fWeek?.addEventListener('click', () => setPeriod('week', fWeek));

  // Save
  const btnSave = document.getElementById('btnSaveAttendance');
  const alertEl = document.getElementById('attendanceSuccessAlert');

  btnSave?.addEventListener('click', () => {
    localStorage.setItem('localAttendance', JSON.stringify(attendanceList));
    apiClient.post('/attendances', { scheduleId: 'sched-today', attendances: attendanceList });

    alertEl.style.display = 'flex';
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 3000);
  });

  // Export Excel
  const btnExportExcel = document.getElementById('btnExportAttendanceExcel');
  btnExportExcel?.addEventListener('click', () => {
    const isStats = document.getElementById('statsSection')?.style.display !== 'none';
    if (!isStats) {
      const headers = ['STT', 'Số Áo', 'Họ Tên', 'Vị Trí', 'Trạng Thái', 'Ghi Chú'];
      const rows = attendanceList.map((i, idx) => [
        idx + 1,
        i.jerseyNumber,
        i.name,
        i.position,
        i.status,
        i.note || '',
      ]);
      exportToCSV('Diem_Danh_Hom_Nay_SaoVangFC', headers, rows);
    } else {
      const headers = ['STT', 'Số Áo', 'Họ Tên', 'Vị Trí', 'Có Mặt', 'Đi Muộn', 'Vắng Phép', 'Vắng Ko Phép', 'Tỷ Lệ', 'Xếp Loại'];
      const rows = playerStatsData.map((s, idx) => {
        const rate = Math.round(((s.presentCount + s.lateCount * 0.5) / s.totalSessions) * 100);
        const grade = rate >= 90 ? 'Xuất sắc' : rate >= 80 ? 'Khá tốt' : 'Cần cải thiện';
        return [
          idx + 1,
          s.jerseyNumber,
          s.name,
          s.position,
          s.presentCount,
          s.lateCount,
          s.excusedCount,
          s.unexcusedCount,
          `${rate}%`,
          grade,
        ];
      });
      exportToCSV('Thong_Ke_Chuyen_Can_SaoVangFC', headers, rows);
    }
  });

  // Print PDF
  const btnPrintPDF = document.getElementById('btnPrintAttendancePDF');
  btnPrintPDF?.addEventListener('click', () => {
    const isStats = document.getElementById('statsSection')?.style.display !== 'none';
    if (!isStats) {
      const headers = ['Số Áo', 'Cầu Thủ', 'Vị Trí', 'Trạng Thái', 'Ghi Chú'];
      const rows = attendanceList.map((i) => [`#${i.jerseyNumber}`, i.name, i.position, i.status, i.note || '—']);
      printReport({
        title: 'BẢNG ĐIỂM DANH BUỔI TẬP BÓNG ĐÁ',
        subtitle: 'Bản ghi nhận diện diện quân số tập luyện Sao Vàng FC',
        filterInfo: `Tổng quân số: ${attendanceList.length} cầu thủ`,
        tableHeaders: headers,
        tableRows: rows,
        summary: [{ label: 'Tổng cầu thủ', value: attendanceList.length }],
      });
    } else {
      const headers = ['Số Áo', 'Họ Tên', 'Vị Trí', 'Có Mặt', 'Đi Muộn', 'Vắng Phép', 'Vắng Ko Phép', 'Tỷ Lệ', 'Xếp Loại'];
      const rows = playerStatsData.map((s) => {
        const rate = Math.round(((s.presentCount + s.lateCount * 0.5) / s.totalSessions) * 100);
        const grade = rate >= 90 ? 'Xuất sắc' : rate >= 80 ? 'Khá tốt' : 'Cần cải thiện';
        return [
          `#${s.jerseyNumber}`,
          s.name,
          s.position,
          `${s.presentCount}/${s.totalSessions}`,
          s.lateCount,
          s.excusedCount,
          s.unexcusedCount,
          `${rate}%`,
          grade,
        ];
      });
      printReport({
        title: 'BÁO CÁO THỐNG KÊ CHUYÊN CẦN CẦU THỦ',
        subtitle: 'Báo cáo tổng hợp tỷ lệ tham gia tập luyện câu lạc bộ Sao Vàng FC',
        filterInfo: `Chu kỳ: ${currentPeriod === 'week' ? 'Tuần này' : currentPeriod === 'month' ? 'Tháng này' : 'Toàn bộ'}`,
        tableHeaders: headers,
        tableRows: rows,
        summary: [{ label: 'Số cầu thủ', value: playerStatsData.length }, { label: 'Tỷ lệ trung bình', value: '92.4%' }],
      });
    }
  });
});
