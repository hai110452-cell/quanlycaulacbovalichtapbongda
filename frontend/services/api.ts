import { ClubInfo, FootballField, Player, TrainingSchedule, AttendanceRecord } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
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
  getFieldBookings: (date?: string, fieldId?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (fieldId) params.append('fieldId', fieldId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ success: boolean; total: number; data: any[] }>(`/field-bookings${qs}`);
  },
  bookFieldSlot: (data: any) =>
    fetchJson<{ success: boolean; message: string; data: any; receiptCode?: string }>('/field-bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancelFieldBooking: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/field-bookings?id=${id}`, {
      method: 'DELETE',
    }),

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
  getFinances: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ success: boolean; total: number; data: any[] }>(`/finances${qs}`);
  },
  addFinance: (data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>('/finances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFinance: (id: string, data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>(`/finances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFinance: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/finances/${id}`, {
      method: 'DELETE',
    }),

  // Chi phí / Thu phí cầu thủ theo tháng & năm (Player Monthly & Yearly Fees)
  getPlayerFees: (year?: number, month?: number, playerId?: string) => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    if (playerId) params.append('playerId', playerId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ success: boolean; total: number; data: any[] }>(`/player-fees${qs}`);
  },
  updatePlayerFee: (data: {
    playerId: string;
    year: number;
    month: number;
    status: 'paid' | 'unpaid' | 'exempt';
    amount?: number;
    paidDate?: string;
    paymentMethod?: string;
    receiptNo?: string;
    notes?: string;
  }) =>
    fetchJson<{ success: boolean; message: string; data: any }>('/player-fees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};


