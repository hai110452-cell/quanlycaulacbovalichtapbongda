// ==========================================================================
// SCHEDULES LOGIC & CONFLICT DETECTION
// ==========================================================================

const defaultSchedules = [
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
    id: 'sched-001',
    title: 'Tập thể lực đầu tuần',
    type: 'Tập thể lực',
    date: '2026-10-28',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Đã hoàn thành',
    notes: 'Chú trọng cardio và tốc độ',
  },
  {
    id: 'sched-002',
    title: 'Tập chiến thuật 4-3-3',
    type: 'Tập chiến thuật',
    date: '2026-10-29',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Đã hoàn thành',
    notes: 'Luyện sơ đồ chiến thuật mới',
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
    id: 'sched-003',
    title: 'Đấu tập nội bộ thứ 4',
    type: 'Đấu tập nội bộ',
    date: '2026-10-30',
    startTime: '18:00',
    endTime: '20:30',
    fieldName: 'Sân Sao Vàng B',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Đang diễn ra',
    notes: 'Chia 2 đội: Đỏ vs Xanh',
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
  {
    id: 'sched-004',
    title: 'Tập thể lực cuối tuần',
    type: 'Tập thể lực',
    date: '2026-11-01',
    startTime: '07:00',
    endTime: '09:00',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Buổi tập sáng sớm, mang giày đinh',
  },
  {
    id: 'sched-005',
    title: 'Tập kỹ thuật cá nhân',
    type: 'Tập chiến thuật',
    date: '2026-11-02',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân Mini Star',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Tập rê bóng và dứt điểm',
  },
  {
    id: 'sched-006',
    title: 'Giao hữu vs FC Rồng Xanh',
    type: 'Thi đấu giao hữu',
    date: '2026-11-05',
    startTime: '16:00',
    endTime: '18:00',
    fieldName: 'Sân Thống Nhất',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Trận giao hữu hàng tháng, toàn đội tham gia',
  },
  {
    id: 'sched-007',
    title: 'Đấu tập nội bộ chủ nhật',
    type: 'Đấu tập nội bộ',
    date: '2026-11-08',
    startTime: '07:30',
    endTime: '10:00',
    fieldName: 'Sân Sao Vàng B',
    coach: 'HLV. Trần Đình Trọng',
    status: 'Sắp diễn ra',
    notes: 'Luyện set-piece và phạt góc',
  },
  {
    id: 'sched-008',
    title: 'Tập thể lực - Bài tập sức mạnh',
    type: 'Tập thể lực',
    date: '2026-11-10',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Gym + field training',
  },
  {
    id: 'sched-009',
    title: 'Tập phòng thủ',
    type: 'Tập chiến thuật',
    date: '2026-11-12',
    startTime: '17:00',
    endTime: '19:00',
    fieldName: 'Sân Rạch Miễu',
    coach: 'HLV. Trần Đình Trọng',
    status: 'Sắp diễn ra',
    notes: 'Tập pressing cao và chuyển trạng thái',
  },
  {
    id: 'sched-010',
    title: 'Giao hữu vs Hoàng Long FC',
    type: 'Thi đấu giao hữu',
    date: '2026-11-15',
    startTime: '15:30',
    endTime: '17:30',
    fieldName: 'Sân Đại học Thể dục',
    coach: 'HLV. Vũ Trọng Khôi',
    status: 'Sắp diễn ra',
    notes: 'Trận quan trọng chuẩn bị cho giải cuối năm',
  },
];

let scheduleList = [...defaultSchedules];

async function initSchedules() {
  try {
    const res = await apiClient.get('/schedules');
    if (res && Array.isArray(res) && res.length > 0) {
      scheduleList = res;
    } else {
      scheduleList = defaultSchedules;
    }
  } catch (err) {
    scheduleList = defaultSchedules;
  }
  checkRBAC();
  renderSchedules();
}

function checkRBAC() {
  const user = getAuthUser();
  const canManage = user && (user.role === 'admin' || user.role === 'coach');
  const btnOpen = document.getElementById('btnOpenScheduleModal');
  const notice = document.getElementById('schedRoleNotice');

  if (!canManage) {
    if (btnOpen) btnOpen.style.display = 'none';
    if (notice) {
      notice.style.display = 'block';
      notice.innerHTML = 'ℹ️ <strong>Chế độ Xem (Cầu thủ):</strong> Bạn chỉ có quyền theo dõi lịch thi đấu & tập luyện, không được tự ý tạo hoặc xóa lịch tập.';
    }
  } else {
    if (btnOpen) btnOpen.style.display = 'inline-flex';
    if (notice) notice.style.display = 'none';
  }
}

function saveLocalSchedules() {
  localStorage.setItem('localSchedules', JSON.stringify(scheduleList));
}

function renderSchedules() {
  const container = document.getElementById('schedulesContainer');
  if (!container) return;

  const user = getAuthUser();
  const canManage = user && (user.role === 'admin' || user.role === 'coach');

  container.innerHTML = scheduleList.map((item) => `
    <article class="timeline-card">
      <div class="timeline-top">
        <div>
          <span class="badge badge-success" style="margin-bottom: 6px;">${item.type || 'Luyện tập'}</span>
          <h3 class="timeline-title">${item.title}</h3>
        </div>
        ${canManage ? `
          <button class="btn btn-danger" style="font-size: 11px; padding: 4px 8px;" onclick="deleteSchedule('${item.id}')">
            🗑️ Xóa Lịch
          </button>
        ` : ''}
      </div>

      <div class="timeline-details">
        <div class="timeline-detail-item">📅 <span>Ngày: <strong>${item.date}</strong></span></div>
        <div class="timeline-detail-item">⏰ <span>Giờ: <strong>${item.startTime} - ${item.endTime}</strong></span></div>
        <div class="timeline-detail-item">🏟️ <span>Sân: <strong>${item.fieldName}</strong></span></div>
        <div class="timeline-detail-item">👤 <span>HLV: <strong>${item.coach}</strong></span></div>
      </div>

      ${item.notes ? `<div class="timeline-notes">📌 <strong>Lưu ý:</strong> ${item.notes}</div>` : ''}
    </article>
  `).join('');
}

window.deleteSchedule = async function (id) {
  const user = getAuthUser();
  if (user && user.role === 'player') {
    alert('Cầu thủ không có quyền xóa lịch tập!');
    return;
  }
  if (confirm('Bạn có chắc chắn muốn xóa lịch tập này?')) {
    try {
      await apiClient.delete(`/schedules/${id}`);
      await initSchedules();
    } catch (err) {
      console.error('Lỗi khi xóa lịch tập:', err);
      scheduleList = scheduleList.filter((s) => String(s.id) !== String(id));
      saveLocalSchedules();
      renderSchedules();
    }
  }
};

// Kiểm tra trùng lịch Realtime
function checkScheduleConflict() {
  const date = document.getElementById('schedDate').value;
  const startTime = document.getElementById('schedStart').value;
  const endTime = document.getElementById('schedEnd').value;
  const fieldName = document.getElementById('schedField').value;
  const alertBox = document.getElementById('conflictAlertBox');
  const btnSubmit = document.getElementById('btnSubmitSchedule');

  if (!alertBox || !btnSubmit) return;

  if (!date || !startTime || !endTime || !fieldName) {
    alertBox.className = 'alert alert-info';
    alertBox.textContent = 'Vui lòng điền ngày, giờ và chọn sân tập...';
    btnSubmit.disabled = false;
    return;
  }

  if (endTime <= startTime) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = '⚠️ Giờ kết thúc phải lớn hơn giờ bắt đầu!';
    btnSubmit.disabled = true;
    return;
  }

  for (const s of scheduleList) {
    if (s.date === date) {
      const isOverlap = startTime < s.endTime && endTime > s.startTime;
      if (isOverlap) {
        if (s.fieldName.trim().toLowerCase() === fieldName.trim().toLowerCase()) {
          alertBox.className = 'alert alert-danger';
          alertBox.textContent = `⚠️ TRÙNG SÂN TẬP: "${s.fieldName}" đã có lịch "${s.title}" (${s.startTime} - ${s.endTime})!`;
          btnSubmit.disabled = true;
          return;
        }

        alertBox.className = 'alert alert-danger';
        alertBox.textContent = `⚠️ TRÙNG GIỜ TẬP: Toàn đội đã có lịch "${s.title}" lúc ${s.startTime} - ${s.endTime} tại "${s.fieldName}"!`;
        btnSubmit.disabled = true;
        return;
      }
    }
  }

  alertBox.className = 'alert alert-success';
  alertBox.textContent = '✓ Khung giờ và sân tập hợp lệ, sẵn sàng lên lịch!';
  btnSubmit.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  initSchedules();

  const modal = document.getElementById('addScheduleModal');
  const btnOpen = document.getElementById('btnOpenScheduleModal');
  const btnClose = document.getElementById('btnCloseScheduleModal');
  const btnCancel = document.getElementById('btnCancelScheduleModal');
  const form = document.getElementById('addScheduleForm');

  btnOpen?.addEventListener('click', () => {
    modal.classList.add('active');
    // Set default date to today or tomorrow
    const d = document.getElementById('schedDate');
    if (d && !d.value) d.value = '2026-10-27';
    checkScheduleConflict();
  });

  btnClose?.addEventListener('click', () => modal.classList.remove('active'));
  btnCancel?.addEventListener('click', () => modal.classList.remove('active'));

  // Lắng nghe thay đổi để kiểm tra trùng lịch ngay lập tức
  ['schedDate', 'schedStart', 'schedEnd', 'schedField'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', checkScheduleConflict);
    document.getElementById(id)?.addEventListener('input', checkScheduleConflict);
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('schedTitle').value.trim();
    const type = document.getElementById('schedType').value;
    const date = document.getElementById('schedDate').value;
    const startTime = document.getElementById('schedStart').value;
    const endTime = document.getElementById('schedEnd').value;
    const fieldName = document.getElementById('schedField').value.trim();
    const coach = document.getElementById('schedCoach').value.trim();
    const notes = document.getElementById('schedNotes').value.trim();

    const newSched = {
      title,
      type,
      date,
      startTime,
      endTime,
      fieldName,
      fieldId: fieldName,
      coach,
      status: 'Sắp diễn ra',
      notes
    };

    try {
      await apiClient.post('/schedules', newSched);
      await initSchedules();
    } catch (err) {
      console.error('Lỗi khi thêm lịch tập:', err);
      scheduleList.unshift({ id: `sched-${Date.now()}`, ...newSched });
      saveLocalSchedules();
      renderSchedules();
    }
    modal.classList.remove('active');
    form.reset();
  });

  // Export Excel
  const btnExportExcel = document.getElementById('btnExportSchedulesExcel');
  btnExportExcel?.addEventListener('click', () => {
    const headers = ['STT', 'Tiêu đề buổi tập', 'Phân loại', 'Ngày', 'Giờ bắt đầu', 'Giờ kết thúc', 'Sân tập', 'HLV', 'Ghi chú'];
    const rows = scheduleList.map((s, idx) => [
      idx + 1,
      s.title,
      s.type,
      s.date,
      s.startTime,
      s.endTime,
      s.fieldName,
      s.coach,
      s.notes || '',
    ]);
    exportToCSV('Lich_Tap_Luyen_SaoVangFC', headers, rows);
  });

  // Print PDF
  const btnPrintPDF = document.getElementById('btnPrintSchedulesPDF');
  btnPrintPDF?.addEventListener('click', () => {
    const headers = ['Nội Dung', 'Phân Loại', 'Thời Gian', 'Sân Tập', 'HLV', 'Lưu Ý'];
    const rows = scheduleList.map((s) => [
      s.title,
      s.type,
      `${s.date} (${s.startTime} - ${s.endTime})`,
      s.fieldName,
      s.coach,
      s.notes || '—',
    ]);
    printReport({
      title: 'BÁO CÁO LỊCH TẬP LUYỆN & THI ĐẤU',
      subtitle: 'Kế hoạch biểu huấn luyện câu lạc bộ bóng đá Sao Vàng FC',
      filterInfo: `Tổng số: ${scheduleList.length} buổi tập`,
      tableHeaders: headers,
      tableRows: rows,
      summary: [
        { label: 'Tổng số buổi', value: scheduleList.length },
        { label: 'CLB', value: 'Sao Vàng FC' },
      ],
    });
  });
});
