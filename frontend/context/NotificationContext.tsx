'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScheduleNotification } from '@/types';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
}

interface NotificationContextType {
  notifications: ScheduleNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: 'new' | 'change' | 'cancel' | 'reminder', scheduleId?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const defaultInitialNotifications: ScheduleNotification[] = [
  {
    id: 'notif-1',
    title: 'Lịch tập chiến thuật mới',
    message: 'HLV vừa lên lịch tập phối hợp bóng ngắn và sút phạt lúc 18:00 Thứ Năm ngày 29/10/2026 tại Sân 7.',
    type: 'new',
    timestamp: '28/10/2026 10:15',
    read: false,
    scheduleId: 'sched-2',
  },
  {
    id: 'notif-2',
    title: 'Xác nhận lịch giao hữu cuối tuần',
    message: 'Trận giao hữu với Hà Nội Star FC diễn ra lúc 16:00 Thứ Bảy ngày 31/10/2026 tại Sân 11. Toàn đội có mặt sớm 45 phút.',
    type: 'new',
    timestamp: '27/10/2026 14:00',
    read: false,
    scheduleId: 'sched-3',
  },
  {
    id: 'notif-3',
    title: 'Điều chỉnh giờ rèn thể lực',
    message: 'Buổi tập ngày 27/10 được đẩy sớm lên 17:30 để rèn sức bền kết hợp khởi động thả lỏng.',
    type: 'change',
    timestamp: '26/10/2026 09:30',
    read: true,
    scheduleId: 'sched-1',
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Tải thông báo trực tiếp từ Neon DB qua /api/notifications
  const fetchNotificationsFromDB = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: ScheduleNotification[] = json.data.map((d: any) => ({
            id: d.id,
            title: d.title,
            message: d.message,
            type: d.type || 'new',
            timestamp: d.timestamp || (d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : ''),
            read: Boolean(d.read),
            scheduleId: d.scheduleId,
          }));
          setNotifications(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem('saovang_notifications', JSON.stringify(mapped));
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Lỗi kết nối /api/notifications, dùng cache:', err);
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

  const addNotification = async (
    title: string,
    message: string,
    type: 'new' | 'change' | 'cancel' | 'reminder' = 'new',
    scheduleId?: string
  ) => {
    const newNotif: ScheduleNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      read: false,
      scheduleId,
    };

    saveNotifications([newNotif, ...notifications]);

    // Show floating toast
    const toastId = `toast-${Date.now()}`;
    const toastType: ToastItem['type'] =
      type === 'cancel' ? 'danger' : type === 'change' ? 'warning' : 'success';
    setToasts((prev) => [...prev, { id: toastId, title, message, type: toastType }]);

    setTimeout(() => {
      dismissToast(toastId);
    }, 5000);

    // Đồng bộ lên Neon DB
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newNotif.id,
          title,
          message,
          type,
          timestamp: newNotif.timestamp,
          scheduleId,
        }),
      });
    } catch (e) {
      console.warn('Lỗi lưu thông báo vào Neon DB:', e);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    } catch (e) {
      console.warn('Lỗi cập nhật trạng thái đã đọc vào Neon DB:', e);
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
    } catch (e) {
      console.warn('Lỗi cập nhật tất cả đã đọc vào Neon DB:', e);
    }
  };

  const clearAll = async () => {
    saveNotifications([]);
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch (e) {
      console.warn('Lỗi xóa tất cả thông báo trên Neon DB:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Lỗi xóa thông báo trên Neon DB:', e);
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
      }}
    >
      {children}
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
          let bgColor = 'rgba(15, 23, 42, 0.95)';
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

          return (
            <div
              key={toast.id}
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                  <span>{icon}</span>
                  <span>{toast.title}</span>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
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
