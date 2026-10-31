import { ClubInfo, FootballField, Player, TrainingSchedule, AttendanceRecord } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Lỗi kết nối API: ${res.statusText}`);
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

  // Người dùng & HLV
  getUsers: () => fetchJson<{ success: boolean; total: number; data: any[] }>('/users'),
  addUser: (data: any) =>
    fetchJson<{ success: boolean; message: string; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Thông báo
  getNotifications: () =>
    fetchJson<{ success: boolean; total: number; data: any[] }>('/notifications'),
  addNotification: (data: any) =>
    fetchJson<{ success: boolean; data: any }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteNotification: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  // Trận đấu
  getMatches: () =>
    fetchJson<{ success: boolean; total: number; data: any[] }>('/matches'),
};

