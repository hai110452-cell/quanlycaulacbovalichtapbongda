'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { exportToCSV, printReport } from '@/lib/exportUtils';

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

const availableFields = [
  'Sân bóng Sao Vàng A (Sân 7)',
  'Sân bóng Sao Vàng B (Sân 11)',
  'Sân trong nhà Futsal Arena',
];

export default function SchedulesPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>(initialSchedules);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('Tất cả');

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules');
      const data = await res.json();
      const list = data?.data || (Array.isArray(data) ? data : null);
      if (list && Array.isArray(list) && list.length > 0) {
        setSchedules(list);
      }
    } catch (err) {
      console.warn('Lỗi kết nối API /api/schedules:', err);
    }
  };

  // Tải dữ liệu từ Neon PostgreSQL API khi mở trang
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Kiểm tra quyền: Chỉ Admin và HLV mới được thêm / xóa lịch
  const canManage = user?.role === 'admin' || user?.role === 'coach';

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    type: 'Tập chiến thuật',
    date: '2026-10-27',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: '',
  });

  // TÍNH NĂNG 2: KIỂM TRA LỊCH TẬP BỊ TRÙNG (CONFLICT DETECTION)
  const conflictInfo = useMemo(() => {
    const { date, startTime, endTime, fieldName } = newSchedule;
    if (!date || !startTime || !endTime || !fieldName) return null;

    if (endTime <= startTime) {
      return {
        hasConflict: true,
        message: '⚠️ Giờ kết thúc phải lớn hơn giờ bắt đầu!',
      };
    }

    // So sánh với các lịch đã có trong cùng ngày
    for (const s of schedules) {
      if (s.date === date) {
        // Kiểm tra xem khoảng thời gian có bị giao nhau không:
        // Overlap nếu: newStart < existingEnd && newEnd > existingStart
        const isOverlap = startTime < s.endTime && endTime > s.startTime;

        if (isOverlap) {
          // Trùng cùng một sân bóng
          if (s.fieldName.trim().toLowerCase() === fieldName.trim().toLowerCase()) {
            return {
              hasConflict: true,
              message: `⚠️ TRÙNG SÂN TẬP: "${s.fieldName}" đã có lịch "${s.title}" (${s.startTime} - ${s.endTime}) ngày ${s.date}!`,
            };
          }

          // Trùng giờ tập của đội
          return {
            hasConflict: true,
            message: `⚠️ TRÙNG GIỜ TẬP ĐỘI BÓNG: Toàn đội đã có lịch "${s.title}" lúc ${s.startTime} - ${s.endTime} tại "${s.fieldName}"!`,
          };
        }
      }
    }

    return {
      hasConflict: false,
      message: '✓ Khung giờ và sân tập hoàn toàn hợp lệ, sẵn sàng lên lịch!',
    };
  }, [newSchedule, schedules]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    // Không cho lưu nếu lịch bị trùng hoặc không hợp lệ
    if (conflictInfo?.hasConflict) {
      alert(conflictInfo.message);
      return;
    }

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSchedule.title,
          type: newSchedule.type,
          date: newSchedule.date,
          startTime: newSchedule.startTime,
          endTime: newSchedule.endTime,
          fieldId: newSchedule.fieldName,
          fieldName: newSchedule.fieldName,
          coach: newSchedule.coach,
          status: 'Sắp diễn ra',
          notes: newSchedule.notes,
        }),
      });
      const data = await res.json();
      const createdId = data?.data?.id || `sched-${Date.now()}`;

      // Đồng bộ trực tiếp từ Database để chỉ hiển thị 1 bản ghi chính xác
      await fetchSchedules();

      // TÍNH NĂNG 1: THÔNG BÁO TỰ ĐỘNG KHI CÓ LỊCH MỚI
      addNotification(
        `Lịch mới: ${newSchedule.title}`,
        `HLV vừa lên lịch (${newSchedule.type}) vào ${newSchedule.startTime} - ${newSchedule.endTime} ngày ${newSchedule.date} tại ${newSchedule.fieldName}.`,
        'new',
        createdId
      );
    } catch (err) {
      console.error('Lỗi khi thêm lịch tập vào database:', err);
    }

    setShowAddModal(false);
    setNewSchedule({
      title: '',
      type: 'Tập chiến thuật',
      date: '2026-11-02',
      startTime: '17:30',
      endTime: '19:30',
      fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
      coach: 'HLV. Nguyễn Văn Huấn',
      notes: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    const target = schedules.find((s) => s.id === id);
    if (confirm('Bạn có chắc chắn muốn xóa lịch tập này?')) {
      try {
        await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
        await fetchSchedules();
      } catch (err) {
        console.error('Lỗi khi xóa lịch tập khỏi database:', err);
      }

      // TÍNH NĂNG 1: THÔNG BÁO TỰ ĐỘNG KHI LỊCH BỊ HỦY
      if (target) {
        addNotification(
          `Hủy lịch tập: ${target.title}`,
          `Buổi tập ngày ${target.date} (${target.startTime} - ${target.endTime}) tại ${target.fieldName} đã được hủy bỏ.`,
          'cancel',
          target.id
        );
      }
    }
  };

  const filtered = schedules.filter((s) => filterType === 'Tất cả' || s.type === filterType);

  // TÍNH NĂNG 2: XUẤT BÁO CÁO EXCEL VÀ PDF
  const handleExportExcel = () => {
    const headers = ['STT', 'Tiêu đề buổi tập', 'Phân loại', 'Ngày', 'Giờ bắt đầu', 'Giờ kết thúc', 'Sân tập', 'HLV phụ trách', 'Trạng thái', 'Ghi chú'];
    const rows = filtered.map((s, index) => [
      index + 1,
      s.title,
      s.type,
      s.date,
      s.startTime,
      s.endTime,
      s.fieldName,
      s.coach,
      s.status,
      s.notes || '',
    ]);
    exportToCSV(`Lich_Tap_Luyen_SaoVangFC_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handlePrintPDF = () => {
    const headers = ['STT', 'Nội dung buổi tập', 'Loại', 'Thời gian', 'Địa điểm sân', 'HLV', 'Lưu ý'];
    const rows = filtered.map((s, index) => [
      index + 1,
      s.title,
      s.type,
      `${s.date} (${s.startTime} - ${s.endTime})`,
      s.fieldName,
      s.coach,
      s.notes || '—',
    ]);
    printReport({
      title: 'BÁO CÁO KẾ HOẠCH TẬP LUYỆN & THI ĐẤU',
      subtitle: 'Kế hoạch phân bổ sân bãi, thời gian biểu và nội dung huấn luyện câu lạc bộ Sao Vàng FC',
      filterInfo: `Phân loại lọc: ${filterType} • Tổng số: ${filtered.length} buổi tập`,
      tableHeaders: headers,
      tableRows: rows,
      summary: [
        { label: 'Tổng số buổi tập', value: filtered.length },
        { label: 'Sân sử dụng', value: 'Sân Sao Vàng A & B' },
        { label: 'HLV Phụ trách', value: 'HLV. Nguyễn Văn Huấn' },
      ],
    });
  };

  return (
    <>
      <link rel="stylesheet" href="/css/schedules.css" />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>📅</span> Quản Lý Lịch Tập Luyện & Thi Đấu ({filtered.length})
          </h1>
          <p className="page-subtitle">
            Hệ thống sắp xếp lịch thông minh: Tự động chống trùng sân, thông báo lịch mới tức thì và xuất báo cáo
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* NÚT XUẤT EXCEL & PDF */}
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ fontSize: '13px' }} title="Xuất file Excel (.csv UTF-8 BOM)">
            📥 Xuất Excel
          </button>
          <button onClick={handlePrintPDF} className="btn btn-secondary" style={{ fontSize: '13px' }} title="In ấn hoặc lưu dạng PDF">
            📄 In / Xuất PDF
          </button>

          {canManage ? (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              ➕ Tạo Lịch Mới
            </button>
          ) : (
            <span className="badge badge-info" style={{ padding: '8px 14px' }}>
              👁️ Chế độ xem dành cho Cầu thủ
            </span>
          )}
        </div>
      </div>

      {/* Thông báo quyền hạn nếu là Cầu thủ */}
      {!canManage && (
        <div className="alert alert-danger" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#93c5fa' }}>
          <span>ℹ️</span> <strong>Thông báo phân quyền:</strong> Bạn đang đăng nhập với tư cách Cầu thủ. Cầu thủ chỉ có quyền theo dõi lịch thi đấu & tập luyện, không được tự ý tạo hoặc xóa lịch tập.
        </div>
      )}

      {/* Bộ lọc loại buổi tập */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['Tất cả', 'Tập thể lực', 'Tập chiến thuật', 'Thi đấu giao hữu'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`btn ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Timeline lịch tập */}
      <section className="schedule-timeline">
        {filtered.map((item) => (
          <article key={item.id} className="timeline-card">
            <div className="timeline-top">
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  {item.type}
                </span>
                <h3 className="timeline-title">{item.title}</h3>
              </div>

              {canManage && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn btn-danger"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  🗑️ Xóa Lịch
                </button>
              )}
            </div>

            <div className="timeline-details">
              <div className="timeline-detail-item">
                📅 <span>Ngày: <strong>{item.date}</strong></span>
              </div>
              <div className="timeline-detail-item">
                ⏰ <span>Giờ: <strong>{item.startTime} - {item.endTime}</strong></span>
              </div>
              <div className="timeline-detail-item">
                🏟️ <span>Sân: <strong>{item.fieldName}</strong></span>
              </div>
              <div className="timeline-detail-item">
                👤 <span>HLV: <strong>{item.coach}</strong></span>
              </div>
            </div>

            {item.notes && (
              <div className="timeline-notes">
                📌 <strong>Lưu ý:</strong> {item.notes}
              </div>
            )}
          </article>
        ))}
      </section>

      {/* MODAL TẠO LỊCH MỚI CÓ TÍNH NĂNG KIỂM TRA TRÙNG LỊCH */}
      {showAddModal && canManage && (
        <div className="modal-overlay active">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>➕ Lên Lịch Buổi Tập Mới (Tự động chống trùng lịch)</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSchedule}>
              <div className="form-group">
                <label className="form-label">Tên buổi tập:</label>
                <input
                  type="text"
                  required
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  placeholder="Ví dụ: Rèn luyện phối hợp 7v7 và bóng chết"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phân loại buổi tập:</label>
                <select
                  value={newSchedule.type}
                  onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value })}
                  className="form-control"
                >
                  <option value="Tập thể lực">Tập thể lực</option>
                  <option value="Tập chiến thuật">Tập chiến thuật</option>
                  <option value="Thi đấu giao hữu">Thi đấu giao hữu</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày tập:</label>
                  <input
                    type="date"
                    required
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sân tập:</label>
                  <select
                    value={newSchedule.fieldName}
                    onChange={(e) => setNewSchedule({ ...newSchedule, fieldName: e.target.value })}
                    className="form-control"
                  >
                    {availableFields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Giờ bắt đầu:</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giờ kết thúc:</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              {/* KHU VỰC CẢNH BÁO TRÙNG LỊCH REALTIME */}
              {conflictInfo && (
                <div
                  className={`alert ${conflictInfo.hasConflict ? 'alert-danger' : 'alert-success'}`}
                  style={{ fontSize: '13px', margin: '8px 0 16px', padding: '10px 14px' }}
                >
                  {conflictInfo.message}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ghi chú lưu ý:</label>
                <textarea
                  rows={2}
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  placeholder="Yêu cầu giày thi đấu, khởi động kỹ..."
                  className="form-control"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={conflictInfo?.hasConflict}
                  className="btn btn-primary"
                  style={{
                    opacity: conflictInfo?.hasConflict ? 0.5 : 1,
                    cursor: conflictInfo?.hasConflict ? 'not-allowed' : 'pointer',
                  }}
                >
                  {conflictInfo?.hasConflict ? '⚠️ Lịch Bị Trùng - Không Cho Lưu' : '✓ Lưu Lịch Hợp Lệ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
