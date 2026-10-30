'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { exportToCSV, printReport } from '@/lib/exportUtils';

interface PlayerAttendanceStat {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  unexcusedCount: number;
  totalSessions: number;
}

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
  { id: '6', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', status: 'Đến muộn', note: 'Kẹt xe' },
];

// Dữ liệu mẫu thống kê đa buổi
const initialStats: PlayerAttendanceStat[] = [
  { id: '1', name: 'Đặng Văn Lâm', jerseyNumber: 1, position: 'Thủ môn', presentCount: 12, lateCount: 0, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '2', name: 'Đỗ Duy Mạnh', jerseyNumber: 4, position: 'Hậu vệ', presentCount: 11, lateCount: 1, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '3', name: 'Đoàn Văn Hậu', jerseyNumber: 5, position: 'Hậu vệ', presentCount: 8, lateCount: 1, excusedCount: 3, unexcusedCount: 0, totalSessions: 12 },
  { id: '4', name: 'Nguyễn Quang Hải', jerseyNumber: 19, position: 'Tiền vệ', presentCount: 12, lateCount: 0, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '5', name: 'Nguyễn Hoàng Đức', jerseyNumber: 14, position: 'Tiền vệ', presentCount: 10, lateCount: 2, excusedCount: 0, unexcusedCount: 0, totalSessions: 12 },
  { id: '6', name: 'Nguyễn Tiến Linh', jerseyNumber: 22, position: 'Tiền đạo', presentCount: 9, lateCount: 2, excusedCount: 1, unexcusedCount: 0, totalSessions: 12 },
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sheet' | 'stats'>('sheet');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [list, setList] = useState<AttendanceItem[]>(defaultList);
  const [saved, setSaved] = useState(false);

  // Kiểm tra quyền: Chỉ Admin và HLV mới được điểm danh & lưu
  const canEdit = user?.role === 'admin' || user?.role === 'coach';

  const setPlayerStatus = (id: string, status: AttendanceItem['status']) => {
    if (!canEdit) return;
    setList(list.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const handleSave = () => {
    if (!canEdit) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const presentCount = list.filter((i) => i.status === 'Có mặt').length;
  const lateCount = list.filter((i) => i.status === 'Đến muộn').length;
  const absentCount = list.filter((i) => i.status.startsWith('Vắng')).length;

  // Lọc số liệu thống kê theo chu kỳ
  const filteredStats = useMemo(() => {
    if (selectedPeriod === 'week') {
      return initialStats.map(s => ({
        ...s,
        totalSessions: 3,
        presentCount: Math.min(s.presentCount, 3),
        lateCount: Math.min(s.lateCount, 1),
      }));
    }
    if (selectedPeriod === 'month') {
      return initialStats.map(s => ({
        ...s,
        totalSessions: 8,
        presentCount: Math.min(s.presentCount, 7),
        lateCount: Math.min(s.lateCount, 1),
      }));
    }
    return initialStats;
  }, [selectedPeriod]);

  // TÍNH NĂNG 2: XUẤT BÁO CÁO EXCEL VÀ PDF CHUYÊN CẦN / ĐIỂM DANH
  const handleExportExcel = () => {
    if (activeTab === 'sheet') {
      const headers = ['STT', 'Số Áo', 'Họ và Tên', 'Vị Trí', 'Trạng Thái Điểm Danh', 'Ghi Chú'];
      const rows = list.map((item, index) => [
        index + 1,
        item.jerseyNumber,
        item.name,
        item.position,
        item.status,
        item.note || '',
      ]);
      exportToCSV(`Diem_Danh_SaoVangFC_${new Date().toISOString().split('T')[0]}`, headers, rows);
    } else {
      const headers = [
        'STT',
        'Số Áo',
        'Họ và Tên',
        'Vị Trí',
        'Có Mặt',
        'Đi Muộn',
        'Vắng Có Phép',
        'Vắng Không Phép',
        'Tổng Buổi',
        'Tỷ Lệ Chuyên Cần (%)',
        'Xếp Loại',
      ];
      const rows = filteredStats.map((s, index) => {
        const rate = Math.round(((s.presentCount + s.lateCount * 0.5) / s.totalSessions) * 100);
        const grade = rate >= 90 ? 'Xuất sắc' : rate >= 80 ? 'Khá tốt' : 'Cần cải thiện';
        return [
          index + 1,
          s.jerseyNumber,
          s.name,
          s.position,
          s.presentCount,
          s.lateCount,
          s.excusedCount,
          s.unexcusedCount,
          s.totalSessions,
          `${rate}%`,
          grade,
        ];
      });
      exportToCSV(`Thong_Ke_Chuyen_Can_SaoVangFC_${selectedPeriod}`, headers, rows);
    }
  };

  const handlePrintPDF = () => {
    if (activeTab === 'sheet') {
      const headers = ['Số Áo', 'Cầu Thủ', 'Vị Trí', 'Trạng Thái', 'Ghi Chú'];
      const rows = list.map((i) => [`#${i.jerseyNumber}`, i.name, i.position, i.status, i.note || '—']);
      printReport({
        title: 'BẢNG ĐIỂM DANH BUỔI TẬP BÓNG ĐÁ',
        subtitle: 'Bản ghi nhận diện diện quân số tập luyện thực tế trong ngày',
        filterInfo: `Ngày điểm danh: ${new Date().toLocaleDateString('vi-VN')} • Quân số: ${list.length} cầu thủ`,
        tableHeaders: headers,
        tableRows: rows,
        summary: [
          { label: 'Có mặt', value: presentCount },
          { label: 'Đến muộn', value: lateCount },
          { label: 'Vắng mặt', value: absentCount },
          { label: 'Tổng quân số', value: list.length },
        ],
      });
    } else {
      const headers = ['Số Áo', 'Họ Tên', 'Vị Trí', 'Có Mặt', 'Đi Muộn', 'Vắng Phép', 'Vắng Ko Phép', 'Tỷ Lệ', 'Xếp Loại'];
      const rows = filteredStats.map((s) => {
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
      const periodLabel = selectedPeriod === 'week' ? 'Tuần này' : selectedPeriod === 'month' ? 'Tháng này' : 'Toàn bộ mùa giải';
      printReport({
        title: 'BÁO CÁO TỶ LỆ CHUYÊN CẦN CẦU THỦ',
        subtitle: 'Bảng đánh giá mức độ kỷ luật, chuyên cần tham gia huấn luyện của ban huấn luyện',
        filterInfo: `Chu kỳ thống kê: ${periodLabel}`,
        tableHeaders: headers,
        tableRows: rows,
        summary: [
          { label: 'Chu kỳ', value: periodLabel },
          { label: 'Số cầu thủ theo dõi', value: filteredStats.length },
          { label: 'Chuyên cần trung bình', value: '92.4%' },
        ],
      });
    }
  };

  return (
    <>
      <link rel="stylesheet" href="/css/attendance.css" />

      {/* Header trang */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>✅</span> Quản Lý Điểm Danh & Thống Kê Chuyên Cần
          </h1>
          <p className="page-subtitle">
            Theo dõi sự hiện diện, tỷ lệ tham gia tập luyện theo tuần, tháng và xếp loại chuyên cần của cầu thủ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ fontSize: '13px' }} title="Xuất file Excel (.csv UTF-8 BOM)">
            📥 Xuất Excel
          </button>
          <button onClick={handlePrintPDF} className="btn btn-secondary" style={{ fontSize: '13px' }} title="In ấn hoặc lưu dạng PDF">
            📄 In / Xuất PDF
          </button>

          {canEdit && activeTab === 'sheet' && (
            <button onClick={handleSave} className="btn btn-primary">
              💾 Lưu Kết Quả Điểm Danh
            </button>
          )}
        </div>
      </div>

      {/* Thông báo phân quyền nếu là Cầu thủ */}
      {!canEdit && (
        <div className="alert alert-danger" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd' }}>
          <span>ℹ️</span> <strong>Chế độ Xem (Cầu thủ):</strong> Bạn chỉ có quyền theo dõi thống kê cá nhân và lịch điểm danh. Quyền sửa điểm danh dành cho Huấn luyện viên & Quản trị viên.
        </div>
      )}

      {saved && (
        <div className="alert alert-success">
          <span>✓</span> Dữ liệu điểm danh buổi tập hôm nay đã được cập nhật thành công lên hệ thống!
        </div>
      )}

      {/* Tabs điều hướng: Bảng điểm danh vs Thống kê chuyên cần */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('sheet')}
          className={`btn ${activeTab === 'sheet' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px' }}
        >
          📋 Bảng Điểm Danh Hôm Nay
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px' }}
        >
          📊 Thống Kê Chuyên Cần Cầu Thủ
        </button>
      </div>

      {/* TAB 1: BẢNG ĐIỂM DANH HIỆN TẠI */}
      {activeTab === 'sheet' && (
        <>
          {/* Thống kê nhanh buổi hôm nay */}
          <section className="attendance-summary-cards">
            <div className="attendance-summary-card">
              <span className="badge badge-success">Có mặt</span>
              <div className="attendance-summary-num" style={{ color: '#34d399' }}>
                {presentCount}
              </div>
            </div>
            <div className="attendance-summary-card">
              <span className="badge badge-warning">Đến muộn</span>
              <div className="attendance-summary-num" style={{ color: '#fbbf24' }}>
                {lateCount}
              </div>
            </div>
            <div className="attendance-summary-card">
              <span className="badge badge-danger">Vắng mặt</span>
              <div className="attendance-summary-num" style={{ color: '#f87171' }}>
                {absentCount}
              </div>
            </div>
            <div className="attendance-summary-card">
              <span className="badge badge-info">Tổng quân số</span>
              <div className="attendance-summary-num" style={{ color: '#60a5fa' }}>
                {list.length}
              </div>
            </div>
          </section>

          {/* Bảng điểm danh */}
          <section className="attendance-table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Số Áo</th>
                    <th>Cầu Thủ</th>
                    <th>Vị Trí</th>
                    <th>Trạng Thái Điểm Danh</th>
                    <th>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>#{item.jerseyNumber}</strong>
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-info">{item.position}</span>
                      </td>
                      <td>
                        <select
                          disabled={!canEdit}
                          value={item.status}
                          onChange={(e) => setPlayerStatus(item.id, e.target.value as any)}
                          className="status-select"
                          style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        >
                          <option value="Có mặt">🟢 Có mặt</option>
                          <option value="Đến muộn">🟡 Đến muộn</option>
                          <option value="Vắng có phép">🔵 Vắng có phép</option>
                          <option value="Vắng không phép">🔴 Vắng không phép</option>
                        </select>
                      </td>
                      <td>
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                          {item.note || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* TAB 2: TÍNH NĂNG 1 - THỐNG KÊ CHUYÊN CẦN CẦU THỦ */}
      {activeTab === 'stats' && (
        <section className="space-y-6">
          {/* Bộ lọc theo tuần / tháng / toàn bộ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                📅 Bộ Lọc Chu Kỳ Chuyên Cần:
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Tính toán tổng số buổi tham gia và tỷ lệ chuyên cần theo chu kỳ lựa chọn
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`btn ${selectedPeriod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                Toàn Bộ Mùa Giải (12 buổi)
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`btn ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                Tháng Này (8 buổi)
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`btn ${selectedPeriod === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                Tuần Này (3 buổi)
              </button>
            </div>
          </div>

          {/* Bảng chi tiết tỷ lệ chuyên cần từng cầu thủ */}
          <div className="attendance-table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cầu Thủ</th>
                    <th>Vị Trí</th>
                    <th>Có Mặt</th>
                    <th>Đi Muộn</th>
                    <th>Vắng Có Phép</th>
                    <th>Vắng Không Phép</th>
                    <th>Tỷ Lệ Chuyên Cần</th>
                    <th>Đánh Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((stat) => {
                    // Tính tỷ lệ chuyên cần = (Có mặt + 0.5 * Đi muộn) / Tổng buổi
                    const rate = Math.round(((stat.presentCount + stat.lateCount * 0.5) / stat.totalSessions) * 100);
                    let grade = 'Xuất sắc';
                    let gradeBadge = 'badge-success';
                    if (rate < 80) {
                      grade = 'Cần cải thiện';
                      gradeBadge = 'badge-danger';
                    } else if (rate < 90) {
                      grade = 'Khá tốt';
                      gradeBadge = 'badge-warning';
                    }

                    return (
                      <tr key={stat.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{stat.jerseyNumber}</span>
                            <span style={{ fontWeight: 600 }}>{stat.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{stat.position}</span>
                        </td>
                        <td>
                          <strong style={{ color: '#34d399' }}>{stat.presentCount}</strong> / {stat.totalSessions}
                        </td>
                        <td>
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{stat.lateCount}</span>
                        </td>
                        <td>
                          <span style={{ color: '#93c5fd' }}>{stat.excusedCount}</span>
                        </td>
                        <td>
                          <span style={{ color: '#f87171' }}>{stat.unexcusedCount}</span>
                        </td>
                        <td style={{ minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${rate}%`,
                                  height: '100%',
                                  background: rate >= 90 ? '#10b981' : rate >= 80 ? '#f59e0b' : '#ef4444',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>{rate}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${gradeBadge}`}>{grade}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
