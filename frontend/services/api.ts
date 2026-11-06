import { ClubInfo, FootballField, Player, TrainingSchedule, AttendanceRecord } from '../types';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Nếu đang chạy local trên trình duyệt (localhost hoặc 127.0.0.1)
    // Luôn ưu tiên dùng '/api' nội bộ của Next.js (có đầy đủ API và kết nối trực tiếp PostgreSQL)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
      return '/api';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://haiandbao.wispbyte.app/api';
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${cleanBase}${cleanUrl}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });

  // Nếu thao tác DELETE mà server trả về 404 (mục đã bị xóa trước đó hoặc chưa có trên DB), coi như xóa thành công
  if (options?.method === 'DELETE' && res.status === 404) {
    return { success: true, message: 'Mục không tồn tại hoặc đã được dọn dẹp trước đó' } as T;
  }

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson && errJson.message) {
        errorDetail = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
      }
    } catch {}
    throw new Error(`Lỗi kết nối API (${res.status}): ${errorDetail}`);
  }
  const text = await res.text();
  if (!text || text === 'undefined') {
    return {} as T;
  }
  return JSON.parse(text);
}

export const api = {
  // Xác thực Auth
  login: (txtID: string, txtPass: string) =>
    fetchJson<{ success: boolean; message: string; user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ txtID, txtPass }),
    }),
  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) =>
    fetchJson<{ success: boolean; message: string; user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // CLB
  getClub: () => fetchJson<{ success: boolean; data: ClubInfo }>('/clubs'),
  updateClub: (data: Partial<ClubInfo>) =>
    fetchJson<{ success: boolean; data: ClubInfo }>('/clubs', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Đội bóng (Teams)
  getTeams: () => fetchJson<{ success: boolean; total: number; data: any[] }>('/teams'),
  addTeam: (data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTeam: (id: string, data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTeam: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/teams/${id}`, {
      method: 'DELETE',
    }),

  // Cầu thủ
  getPlayers: (position?: string, search?: string) => {
    const params = new URLSearchParams();
    if (position) params.append('position', position);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ success: boolean; total: number; data: Player[] }>(`/players${qs}`);
  },
  addPlayer: (data: Partial<Player>) =>
    fetchJson<{ success: boolean; message: string; data: Player }>('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlayer: (id: string, data: Partial<Player>) =>
    fetchJson<{ success: boolean; message: string; data: Player }>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePlayer: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/players/${id}`, {
      method: 'DELETE',
    }),

  // Lịch tập
  getSchedules: (status?: string, date?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (date) params.append('date', date);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ success: boolean; total: number; data: TrainingSchedule[] }>(`/schedules${qs}`);
  },
  addSchedule: (data: Partial<TrainingSchedule>) =>
    fetchJson<{ success: boolean; message: string; data: TrainingSchedule }>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSchedule: (id: string, data: Partial<TrainingSchedule>) =>
    fetchJson<{ success: boolean; message: string; data: TrainingSchedule }>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSchedule: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    }),

  // Điểm danh
  getAttendances: (scheduleId?: string) => {
    const qs = scheduleId ? `?scheduleId=${scheduleId}` : '';
    return fetchJson<{ success: boolean; data: AttendanceRecord[] }>(`/attendances${qs}`);
  },
  saveAttendances: (records: Partial<AttendanceRecord>[]) =>
    fetchJson<{ success: boolean; message: string }>('/attendances', {
      method: 'POST',
      body: JSON.stringify(records),
    }),

  // Sân bóng
  getFields: () => fetchJson<{ success: boolean; data: FootballField[] }>('/fields'),
  addField: (data: Partial<FootballField>) =>
    fetchJson<{ success: boolean; message: string; data: FootballField }>('/fields', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateField: (id: string, data: Partial<FootballField>) =>
    fetchJson<{ success: boolean; message: string; data: FootballField }>(`/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteField: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/fields/${id}`, {
      method: 'DELETE',
    }),

  // Đặt sân trực tuyến & Demo sân khách hàng
  getFieldBookings: async (date?: string, fieldId?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (fieldId) params.append('fieldId', fieldId);
    const qs = params.toString() ? `?${params.toString()}` : '';

    let localList: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_field_bookings');
        if (raw) localList = JSON.parse(raw);
      } catch {}
    }

    try {
      const res = await fetchJson<{ success: boolean; total: number; data: any[] }>(`/field-bookings${qs}`);
      if (res && Array.isArray(res.data)) {
        // Hợp nhất dữ liệu từ Neon DB và LocalStorage (đồng bộ 2 chiều)
        const mergedMap = new Map<string, any>();
        res.data.forEach((item: any) => {
          const key = `${item.fieldId || item.field_id}_${item.bookingDate || item.booking_date}_${item.slotTime || item.slot_time}`;
          mergedMap.set(key, {
            ...item,
            id: item.id,
            fieldId: item.fieldId || item.field_id,
            fieldName: item.fieldName || item.field_name,
            bookingDate: item.bookingDate || item.booking_date,
            slotId: item.slotId || item.slot_id,
            slotTime: item.slotTime || item.slot_time,
            slotLabel: item.slotLabel || item.slot_label,
            price: Number(item.price) || 0,
            isBooked: Boolean(item.isBooked ?? item.is_booked),
            status: item.status || (Boolean(item.isBooked ?? item.is_booked) ? 'approved' : 'available'),
            customerName: item.customerName || item.customer_name || null,
            customerPhone: item.customerPhone || item.customer_phone || null,
            teamName: item.teamName || item.team_name || null,
            services: item.services || null,
            notes: item.notes || null,
          });
        });

        localList.forEach((localItem: any) => {
          const key = `${localItem.fieldId}_${localItem.bookingDate}_${localItem.slotTime}`;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, localItem);
          } else {
            mergedMap.set(key, { ...mergedMap.get(key), ...localItem });
          }
        });

        const combined = Array.from(mergedMap.values());
        let filtered = combined;
        if (date) filtered = filtered.filter((b: any) => (b.bookingDate || b.booking_date) === date);
        if (fieldId && fieldId !== 'all') filtered = filtered.filter((b: any) => (b.fieldId || b.field_id) === fieldId);

        return {
          success: true,
          total: filtered.length,
          data: filtered,
        };
      }
    } catch (err) {
      console.warn('Lỗi gọi API getFieldBookings, lấy dữ liệu từ localStorage fallback:', err);
    }

    // Fallback: Lấy từ localStorage
    let filteredLocal = localList;
    if (date) filteredLocal = filteredLocal.filter((b: any) => b.bookingDate === date);
    if (fieldId && fieldId !== 'all') filteredLocal = filteredLocal.filter((b: any) => b.fieldId === fieldId);
    return {
      success: true,
      total: filteredLocal.length,
      data: filteredLocal,
    };
  },
  bookFieldSlot: async (data: any) => {
    const receiptCode = `C1-BK-${Math.floor(100000 + Math.random() * 900000)}`;
    const slotPayload = {
      ...data,
      isBooked: true,
      status: 'pending',
      receiptCode,
    };

    // Luôn đồng bộ ngay vào localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_field_bookings');
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(
          (b: any) =>
            (data.id && b.id === data.id) ||
            (b.fieldId === data.fieldId && b.bookingDate === data.bookingDate && b.slotTime === data.slotTime),
        );
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...slotPayload };
        } else {
          list.push({ id: `fb-${Date.now()}`, ...slotPayload, createdAt: new Date().toISOString() });
        }
        localStorage.setItem('c1_field_bookings', JSON.stringify(list));
      } catch (e) {
        console.warn('Không thể ghi localStorage:', e);
      }
    }

    try {
      const res = await fetchJson<{ success: boolean; message: string; data: any; receiptCode?: string }>('/field-bookings', {
        method: 'POST',
        body: JSON.stringify(slotPayload),
      });
      return res;
    } catch (err: any) {
      console.warn('Lỗi gọi API bookFieldSlot, đã lưu cục bộ (Local Storage fallback):', err);
      return {
        success: true,
        message: 'Đặt sân thành công!',
        data: slotPayload,
        receiptCode,
      };
    }
  },
  cancelFieldBooking: async (id: string, fieldId?: string, date?: string, slotTime?: string) => {
    // Dọn dẹp trong localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_field_bookings');
        if (raw) {
          let list = JSON.parse(raw);
          list = list.filter(
            (b: any) =>
              b.id !== id &&
              b.slotId !== id &&
              !(fieldId && date && slotTime && b.fieldId === fieldId && b.bookingDate === date && b.slotTime === slotTime)
          );
          localStorage.setItem('c1_field_bookings', JSON.stringify(list));
        }
      } catch {}
    }

    const params = new URLSearchParams({ id });
    if (fieldId) params.append('fieldId', fieldId);
    if (date) params.append('date', date);
    if (slotTime) params.append('slotTime', slotTime);

    try {
      return await fetchJson<{ success: boolean; message: string }>(`/field-bookings?${params.toString()}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Lỗi gọi API cancelFieldBooking, hủy trong localStorage:', err);
      return { success: true, message: 'Đã hủy lịch đặt sân thành công' };
    }
  },
  approveFieldBooking: async (id: string, fieldId?: string, date?: string, slotTime?: string) => {
    // Cập nhật trạng thái duyệt trong localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_field_bookings');
        if (raw) {
          let list = JSON.parse(raw);
          list = list.map((b: any) => {
            const isMatch =
              b.id === id ||
              b.slotId === id ||
              (fieldId && date && slotTime && b.fieldId === fieldId && b.bookingDate === date && b.slotTime === slotTime);
            return isMatch ? { ...b, status: 'approved', isBooked: true } : b;
          });
          localStorage.setItem('c1_field_bookings', JSON.stringify(list));
        }
      } catch {}
    }

    const params = new URLSearchParams({ id, action: 'approve' });
    if (fieldId) params.append('fieldId', fieldId);
    if (date) params.append('date', date);
    if (slotTime) params.append('slotTime', slotTime);

    try {
      return await fetchJson<{ success: boolean; message: string }>(`/field-bookings?${params.toString()}`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('Lỗi gọi API approveFieldBooking, cập nhật trong localStorage:', err);
      return { success: true, message: 'Đã phê duyệt ca đặt sân thành công' };
    }
  },
  rejectFieldBooking: async (id: string, fieldId?: string, date?: string, slotTime?: string) => {
    // Xóa/từ chối ca trong localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_field_bookings');
        if (raw) {
          let list = JSON.parse(raw);
          list = list.filter(
            (b: any) =>
              b.id !== id &&
              b.slotId !== id &&
              !(fieldId && date && slotTime && b.fieldId === fieldId && b.bookingDate === date && b.slotTime === slotTime)
          );
          localStorage.setItem('c1_field_bookings', JSON.stringify(list));
        }
      } catch {}
    }

    const params = new URLSearchParams({ id, action: 'reject' });
    if (fieldId) params.append('fieldId', fieldId);
    if (date) params.append('date', date);
    if (slotTime) params.append('slotTime', slotTime);

    try {
      return await fetchJson<{ success: boolean; message: string }>(`/field-bookings?${params.toString()}`, {
        method: 'PUT',
      });
    } catch (err) {
      console.warn('Lỗi gọi API rejectFieldBooking, cập nhật trong localStorage:', err);
      return { success: true, message: 'Đã từ chối đơn đặt sân' };
    }
  },

  // Người dùng & HLV
  getUsers: () => fetchJson<{ success: boolean; total: number; data: any[] }>('/users'),
  addUser: (data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Thông báo
  getNotifications: () =>
    fetchJson<{ success: boolean; total: number; unreadCount: number; data: any[] }>('/notifications'),
  addNotification: (data: any) =>
    fetchJson<{ success: boolean; data: any }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markNotificationRead: (id?: string, markAllAsRead?: boolean) =>
    fetchJson<{ success: boolean; message: string }>('/notifications', {
      method: 'PUT',
      body: JSON.stringify({ id, markAllAsRead }),
    }),
  deleteNotification: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  // Trận đấu
  getMatches: () =>
    fetchJson<{ success: boolean; total: number; data: any[] }>('/matches'),
  addMatch: (data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteMatch: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/matches/${id}`, {
      method: 'DELETE',
    }),

  // Chi phí & Quỹ CLB (Finances)
  getFinances: async (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await fetchJson<{ success: boolean; total: number; data: any[] }>(`/finances${qs}`);
      if (res && Array.isArray(res.data)) return res;
    } catch (err) {
      console.warn('Lỗi getFinances, fallback localStorage:', err);
    }
    let list: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_finances');
        if (raw) list = JSON.parse(raw);
      } catch {}
    }
    return { success: true, total: list.length, data: list };
  },
  addFinance: async (data: any) => {
    try {
      return await fetchJson<{ success: boolean; message: string; data: any }>('/finances', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('Lỗi addFinance, lưu localStorage fallback:', err);
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('c1_finances');
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(data);
          localStorage.setItem('c1_finances', JSON.stringify(list));
        } catch {}
      }
      return { success: true, message: 'Đã lưu giao dịch', data };
    }
  },
  updateFinance: async (id: string, data: any) => {
    try {
      return await fetchJson<{ success: boolean; message: string; data: any }>(`/finances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: 'Đã cập nhật', data };
    }
  },
  deleteFinance: async (id: string) => {
    try {
      return await fetchJson<{ success: boolean; message: string }>(`/finances/${id}`, {
        method: 'DELETE',
      });
    } catch {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('c1_finances');
          if (raw) {
            let list = JSON.parse(raw);
            list = list.filter((item: any) => item.id !== id);
            localStorage.setItem('c1_finances', JSON.stringify(list));
          }
        } catch {}
      }
      return { success: true, message: 'Đã xóa giao dịch' };
    }
  },

  // Chi phí / Thu phí cầu thủ theo tháng & năm (Player Monthly & Yearly Fees)
  getPlayerFees: async (year?: number, month?: number, playerId?: string) => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    if (playerId) params.append('playerId', playerId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await fetchJson<{ success: boolean; total: number; data: any[] }>(`/player-fees${qs}`);
      if (res && Array.isArray(res.data)) return res;
    } catch (err) {
      console.warn('Lỗi getPlayerFees, fallback localStorage:', err);
    }
    let list: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('c1_player_fees');
        if (raw) list = JSON.parse(raw);
      } catch {}
    }
    return { success: true, total: list.length, data: list };
  },
  updatePlayerFee: async (data: {
    playerId: string;
    year: number;
    month: number;
    status: 'paid' | 'unpaid' | 'exempt';
    amount?: number;
    paidDate?: string;
    paymentMethod?: string;
    receiptNo?: string;
    notes?: string;
  }) => {
    try {
      return await fetchJson<{ success: boolean; message: string; data: any }>('/player-fees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('Lỗi updatePlayerFee, fallback localStorage:', err);
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('c1_player_fees');
          const list = raw ? JSON.parse(raw) : [];
          const idx = list.findIndex(
            (f: any) => f.playerId === data.playerId && f.year === data.year && f.month === data.month,
          );
          if (idx >= 0) list[idx] = { ...list[idx], ...data };
          else list.push(data);
          localStorage.setItem('c1_player_fees', JSON.stringify(list));
        } catch {}
      }
      return { success: true, message: 'Đã lưu trạng thái đóng quỹ', data };
    }
  },
};


