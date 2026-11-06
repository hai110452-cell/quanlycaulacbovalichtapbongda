'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScheduleNotification } from '@/types';
import { api } from '@/services/api';

export function detectNotificationTab(title?: string, message?: string, defaultTab?: string): string {
  if (defaultTab) return defaultTab;
  const text = `${title || ''} ${message || ''}`.toLowerCase();

  // 1. Lịch đặt sân
  if (
    text.includes('đặt sân') ||
    text.includes('giữ sân') ||
    text.includes('phê duyệt ca') ||
    text.includes('từ chối đơn') ||
    text.includes('hủy ca') ||
    text.includes('ca sân') ||
    text.includes('khung giờ')
  ) {
    return 'booking-schedule';
  }
  // 2. Điểm danh
  if (text.includes('điểm danh') || text.includes('chuyên cần') || text.includes('có mặt')) {
    return 'attendance';
  }
  // 3. Lịch tập luyện
  if (
    text.includes('lịch tập') ||
    text.includes('tập luyện') ||
    text.includes('chiến thuật') ||
    text.includes('thể lực') ||
    text.includes('giao hữu') ||
    text.includes('giáo án')
  ) {
    return 'schedules';
  }
  // 4. Tài chính / Thu chi / Quỹ CLB / Phí cầu thủ
  if (
    text.includes('quỹ') ||
    text.includes('thu chi') ||
    text.includes('phí') ||
    text.includes('nộp phí') ||
    text.includes('nhắc nợ') ||
    text.includes('giao dịch') ||
    text.includes('thanh toán') ||
    text.includes('khoản thu') ||
    text.includes('khoản chi')
  ) {
    return 'finances';
  }
  // 5. Bảng tin thông báo
  if (text.includes('thông báo') || text.includes('bảng tin') || text.includes('chỉ đạo')) {
    return 'announcements';
  }
  // 6. Cầu thủ / Thành viên / HLV
  if (text.includes('cầu thủ') || text.includes('thành viên') || text.includes('hlv') || text.includes('huấn luyện viên')) {
    return 'members';
  }
  // 7. Tuyến đội
  if (text.includes('đội bóng') || text.includes('tuyến đội')) {
    return 'teams';
  }
  // 8. Sân bóng
  if (text.includes('sân bóng') || text.includes('tìm sân') || text.includes('giá sân')) {
    return 'fields';
  }
  return 'home';
}

export function getFeatureMetadata(tab: string) {
  switch (tab) {
    case 'booking-schedule':
      return { name: 'Lịch Đặt Sân', icon: '📅', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'schedules':
      return { name: 'Lịch Tập Luyện', icon: '⏱️', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'attendance':
      return { name: 'Điểm Danh', icon: '✅', color: 'bg-teal-100 text-teal-800 border-teal-300' };
    case 'finances':
      return { name: 'Thu Chi & Quỹ', icon: '💰', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'announcements':
      return { name: 'Bảng Tin', icon: '📢', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'members':
      return { name: 'Cầu Thủ & HLV', icon: '🏃', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case 'teams':
      return { name: 'Tuyến Đội', icon: '🛡️', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'fields':
      return { name: 'Sân Bóng', icon: '🏟️', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    default:
      return { name: 'Trang Chủ', icon: '🏠', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  tab?: string;
  link?: string;
}

interface NotificationContextType {
  notifications: ScheduleNotification[];
  unreadCount: number;
  addNotification: (
    title: string,
    message: string,
    type?: 'new' | 'change' | 'cancel' | 'reminder',
    scheduleId?: string,
    tab?: string,
    link?: string,
    sender?: string,
    priority?: 'normal' | 'important' | 'urgent'
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  navigateToFeature: (tab?: string, link?: string) => void;
  selectedNotification: ScheduleNotification | null;
  setSelectedNotification: (n: ScheduleNotification | null) => void;
  openNotificationDetail: (n: ScheduleNotification) => void;
  closeNotificationDetail: () => void;
}

const defaultInitialNotifications: ScheduleNotification[] = [
  {
    id: 'notif-1',
    title: 'Lịch tập chiến thuật mới',
    message: 'HLV trưởng vừa lên lịch tập phối hợp bóng ngắn và sút phạt lúc 18:00 Thứ Năm ngày 29/10/2026 tại Sân 7. Đề nghị các cầu thủ có mặt đúng giờ để điểm danh và nhận áo tập theo số áo.',
    type: 'new',
    timestamp: '28/10/2026 10:15',
    read: false,
    scheduleId: 'sched-2',
    tab: 'schedules',
    sender: 'HLV Trưởng Phạm Đức Huy',
    priority: 'important',
  },
  {
    id: 'notif-2',
    title: 'Xác nhận lịch giao hữu cuối tuần',
    message: 'Trận giao hữu với Hà Nội Star FC diễn ra lúc 16:00 Thứ Bảy ngày 31/10/2026 tại Sân 11. Toàn đội có mặt sớm 45 phút để khởi động và họp chiến thuật nhanh cùng ban huấn luyện.',
    type: 'new',
    timestamp: '27/10/2026 14:00',
    read: false,
    scheduleId: 'sched-3',
    tab: 'schedules',
    sender: 'Ban Quản Lý Sân C1',
    priority: 'urgent',
  },
  {
    id: 'notif-3',
    title: 'Điều chỉnh giờ rèn thể lực',
    message: 'Buổi tập ngày 27/10 được đẩy sớm lên 17:30 để rèn sức bền kết hợp khởi động thả lỏng. Các cầu thủ lưu ý chuẩn bị giày cỏ nhân tạo phù hợp.',
    type: 'change',
    timestamp: '26/10/2026 09:30',
    read: true,
    scheduleId: 'sched-1',
    tab: 'schedules',
    sender: 'HLV Thể Lực Vũ Trọng Khôi',
    priority: 'normal',
  },
  {
    id: 'notif-4',
    title: 'Nhắc nhở nộp quỹ và phí sinh hoạt tháng 11',
    message: 'Kính gửi các thành viên CLB: Hạn nộp tiền quỹ và phí duy trì hoạt động tháng 11/2026 đến hết ngày 05/11. Mọi người vui lòng thanh toán trực tiếp tại văn phòng điều hành hoặc chuyển khoản theo số tài khoản CLB.',
    type: 'reminder',
    timestamp: '01/11/2026 08:00',
    read: false,
    tab: 'finances',
    sender: 'Kế Toán / Thủ Quỹ CLB',
    priority: 'important',
  },
  {
    id: 'notif-5',
    title: 'Điểm danh buổi tập sáng nay đã hoàn tất',
    message: 'HLV đã cập nhật điểm danh và chuyên cần cho 20 cầu thủ. Có 13 thành viên có mặt, 3 đi muộn và 4 vắng phép. Vui lòng kiểm tra lại trạng thái chuyên cần trong hồ sơ cá nhân.',
    type: 'new',
    timestamp: '04/11/2026 09:30',
    read: false,
    tab: 'attendance',
    sender: 'Ban Huấn Luyện',
    priority: 'normal',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<ScheduleNotification | null>(null);

  // Tải thông báo trực tiếp từ Backend API
  const fetchNotificationsFromDB = async () => {
    try {
      const json = await api.getNotifications();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const mapped: ScheduleNotification[] = json.data.map((d: any) => ({
          id: d.id,
          title: d.title,
          message: d.message,
          type: d.type || 'new',
          timestamp: d.timestamp || (d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : ''),
          read: Boolean(d.read),
          scheduleId: d.scheduleId,
          tab: d.tab || detectNotificationTab(d.title, d.message),
          link: d.link,
        }));
        setNotifications(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem('saovang_notifications', JSON.stringify(mapped));
        }
        return;
      }
    } catch (err) {
      console.warn('Lỗi kết nối getNotifications, dùng cache:', err);
    }

    // Fallback sang localStorage nếu API ngoại tuyến hoặc trống
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('saovang_notifications');
        if (stored && stored !== 'undefined') {
          setNotifications(JSON.parse(stored));
        } else {
          setNotifications(defaultInitialNotifications);
        }
      } catch {
        setNotifications(defaultInitialNotifications);
      }
    }
  };

  useEffect(() => {
    fetchNotificationsFromDB();
  }, []);

  // Save to state & localStorage
  const saveNotifications = (newList: ScheduleNotification[]) => {
    setNotifications(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('saovang_notifications', JSON.stringify(newList));
      } catch (err) {
        console.error('Lỗi lưu notifications:', err);
      }
    }
  };

  const navigateToFeature = (tab?: string, link?: string) => {
    if (typeof window !== 'undefined') {
      if (link) {
        window.location.assign(link);
        return;
      }
      const targetTab = tab || 'home';
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: targetTab }));
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', targetTab);
        window.history.pushState({}, '', url.toString());
      } catch {}
    }
  };

  const addNotification = async (
    title: string,
    message: string,
    type: 'new' | 'change' | 'cancel' | 'reminder' = 'new',
    scheduleId?: string,
    tab?: string,
    link?: string,
    sender?: string,
    priority?: 'normal' | 'important' | 'urgent'
  ) => {
    const resolvedTab = tab || detectNotificationTab(title, message);
    const newNotif: ScheduleNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      read: false,
      scheduleId,
      tab: resolvedTab,
      link,
      sender: sender || 'Ban Quản Lý CLB Sân Bóng C1',
      priority: priority || 'normal',
    };

    saveNotifications([newNotif, ...notifications]);

    // Show floating toast
    const toastId = `toast-${Date.now()}`;
    const toastType: ToastItem['type'] =
      type === 'cancel' ? 'danger' : type === 'change' ? 'warning' : 'success';
    setToasts((prev) => [...prev, { id: toastId, title, message, type: toastType, tab: resolvedTab, link }]);

    setTimeout(() => {
      dismissToast(toastId);
    }, 6000);

    // Đồng bộ lên Backend API
    try {
      await api.addNotification({
        id: newNotif.id,
        title,
        message,
        type,
        timestamp: newNotif.timestamp,
        scheduleId,
      });
    } catch (e) {
      console.warn('Lỗi lưu thông báo vào Backend:', e);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
    try {
      await api.markNotificationRead(id, false);
    } catch (e) {
      console.warn('Lỗi cập nhật trạng thái đã đọc vào Backend:', e);
    }
  };

  const openNotificationDetail = (n: ScheduleNotification) => {
    markAsRead(n.id);
    setSelectedNotification(n);
  };

  const closeNotificationDetail = () => {
    setSelectedNotification(null);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    try {
      await api.markNotificationRead(undefined, true);
    } catch (e) {
      console.warn('Lỗi cập nhật tất cả đã đọc vào Backend:', e);
    }
  };

  const clearAll = async () => {
    saveNotifications([]);
    try {
      await api.markNotificationRead(undefined, true);
    } catch (e) {
      console.warn('Lỗi xóa tất cả thông báo trên Backend:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
    try {
      await api.deleteNotification(id);
    } catch (e) {
      console.warn('Lỗi xóa thông báo trên Backend:', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
        toasts,
        dismissToast,
        navigateToFeature,
        selectedNotification,
        setSelectedNotification,
        openNotificationDetail,
        closeNotificationDetail,
      }}
    >
      {children}

      {/* MODAL CHI TIẾT HIỂN THỊ THÔNG BÁO CHUYÊN SÂU */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={closeNotificationDetail}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-emerald-500 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] p-5 text-white flex items-center justify-between border-b-2 border-emerald-400/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
                  📢
                </div>
                <div>
                  <div className="text-[11px] font-black tracking-wider uppercase text-emerald-300">
                    Chi Tiết Thông Báo
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white line-clamp-1">
                    {selectedNotification.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeNotificationDetail}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer border border-white/20"
                title="Đóng (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const feat = getFeatureMetadata(selectedNotification.tab || detectNotificationTab(selectedNotification.title, selectedNotification.message));
                  return (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${feat.color} flex items-center gap-1`}>
                      <span>{feat.icon}</span>
                      <span>Mục: {feat.name}</span>
                    </span>
                  );
                })()}

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <span>📅</span>
                  <span>{selectedNotification.timestamp}</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                  <span>👤</span>
                  <span>{selectedNotification.sender || 'Ban Quản Lý CLB Sân Bóng C1'}</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span>✓</span>
                  <span>Đã đọc</span>
                </span>
              </div>

              {/* Title */}
              <div className="pt-1">
                <h4 className="text-lg sm:text-xl font-black text-slate-950 leading-snug">
                  {selectedNotification.title}
                </h4>
              </div>

              {/* Message Content Full */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  Nội Dung Chi Tiết Thông Báo
                </label>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-slate-50 border-2 border-emerald-200/90 text-sm sm:text-base text-slate-800 leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
                  {selectedNotification.message}
                </div>
              </div>

              {/* Feature Action Banner */}
              {(() => {
                const targetTab = selectedNotification.tab || detectNotificationTab(selectedNotification.title, selectedNotification.message);
                const feat = getFeatureMetadata(targetTab);
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-300 uppercase">
                        Tính Năng Liên Quan Trực Tiếp
                      </div>
                      <div className="text-sm font-black flex items-center gap-1.5 mt-0.5">
                        <span>{feat.icon}</span>
                        <span>{feat.name}</span>
                      </div>
                      <p className="text-[11px] text-emerald-100 mt-0.5">
                        Chuyển ngay tới giao diện để xem và xử lý dữ liệu
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        closeNotificationDetail();
                        navigateToFeature(targetTab, selectedNotification.link);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hover:scale-105"
                    >
                      <span>Mở tính năng ngay</span>
                      <span>→</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                  closeNotificationDetail();
                }}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>🗑️</span>
                <span>Xóa thông báo</span>
              </button>

              <button
                type="button"
                onClick={closeNotificationDetail}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast container floating on screen */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let borderColor = '#10b981';
          const bgColor = 'rgba(15, 23, 42, 0.95)';
          let icon = '🔔';
          if (toast.type === 'danger') {
            borderColor = '#ef4444';
            icon = '⚠️';
          } else if (toast.type === 'warning') {
            borderColor = '#f59e0b';
            icon = '⏰';
          } else if (toast.type === 'success') {
            borderColor = '#10b981';
            icon = '✓';
          }

          const feat = getFeatureMetadata(toast.tab || 'home');

          return (
            <div
              key={toast.id}
              onClick={() => {
                const found = notifications.find((n) => n.id === toast.id.replace('toast-', 'notif-') || n.title === toast.title);
                if (found) {
                  openNotificationDetail(found);
                } else {
                  openNotificationDetail({
                    id: toast.id,
                    title: toast.title,
                    message: toast.message,
                    type: toast.type === 'danger' ? 'cancel' : toast.type === 'warning' ? 'change' : 'new',
                    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    read: true,
                    tab: toast.tab,
                    link: toast.link,
                  });
                }
                dismissToast(toast.id);
              }}
              style={{
                pointerEvents: 'auto',
                background: bgColor,
                borderLeft: `4px solid ${borderColor}`,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                color: '#fff',
                animation: 'slideIn 0.3s ease-out forwards',
                cursor: 'pointer',
              }}
              title="Nhấn để xem chi tiết thông báo này"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                  <span>{icon}</span>
                  <span>{toast.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissToast(toast.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                {toast.message}
              </p>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#34d399' }}>
                <span>{feat.icon} {feat.name}</span>
                <span style={{ fontWeight: 'bold' }}>Xem chi tiết →</span>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
