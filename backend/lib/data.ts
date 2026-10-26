import { ClubInfo, FootballField, Player, TrainingSchedule, AttendanceRecord } from '../types';

export const initialClubInfo: ClubInfo = {
  name: 'Câu Lạc Bộ Bóng Đá Sao Vàng FC',
  shortName: 'Sao Vàng FC',
  establishedYear: 2020,
  coach: 'HLV. Nguyễn Văn Huấn',
  captain: 'Nguyễn Quang Hải (Số 19)',
  homeStadium: 'Sân vận động Mỹ Đình Mini',
  description: 'Câu lạc bộ bóng đá phong trào chuyên nghiệp, rèn luyện thể lực và kỹ chiến thuật đỉnh cao.',
};

export const initialFields: FootballField[] = [
  {
    id: 'field-1',
    name: 'Sân bóng Sao Vàng A (Sân 7)',
    location: 'Số 12 Đường Cầu Diễn, Bắc Từ Liêm, Hà Nội',
    fieldType: 'Sân 7 người',
    surfaceType: 'Cỏ nhân tạo',
    status: 'Khả dụng',
  },
  {
    id: 'field-2',
    name: 'Sân bóng Sao Vàng B (Sân 11)',
    location: 'Khu liên hợp thể thao Quốc Gia, Mỹ Đình',
    fieldType: 'Sân 11 người',
    surfaceType: 'Cỏ tự nhiên',
    status: 'Khả dụng',
  },
  {
    id: 'field-3',
    name: 'Sân trong nhà Futsal Center',
    location: 'Quận Nam Từ Liêm, Hà Nội',
    fieldType: 'Sân futsal',
    surfaceType: 'Sàn gỗ',
    status: 'Bảo trì',
  },
];

export const initialPlayers: Player[] = [
  {
    id: 'player-1',
    name: 'Đặng Văn Lâm',
    jerseyNumber: 1,
    position: 'Thủ môn',
    dateOfBirth: '1993-08-13',
    phone: '0901234567',
    status: 'Đang thi đấu',
    joinedDate: '2022-01-10',
  },
  {
    id: 'player-2',
    name: 'Đỗ Duy Mạnh',
    jerseyNumber: 4,
    position: 'Hậu vệ',
    dateOfBirth: '1996-09-29',
    phone: '0912345678',
    status: 'Đang thi đấu',
    joinedDate: '2021-05-15',
  },
  {
    id: 'player-3',
    name: 'Đoàn Văn Hậu',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    dateOfBirth: '1999-04-19',
    phone: '0923456789',
    status: 'Chấn thương',
    joinedDate: '2021-08-20',
  },
  {
    id: 'player-4',
    name: 'Nguyễn Quang Hải',
    jerseyNumber: 19,
    position: 'Tiền vệ',
    dateOfBirth: '1997-04-12',
    phone: '0934567890',
    status: 'Đang thi đấu',
    joinedDate: '2020-03-01',
  },
  {
    id: 'player-5',
    name: 'Nguyễn Hoàng Đức',
    jerseyNumber: 14,
    position: 'Tiền vệ',
    dateOfBirth: '1998-01-11',
    phone: '0945678901',
    status: 'Đang thi đấu',
    joinedDate: '2021-02-14',
  },
  {
    id: 'player-6',
    name: 'Nguyễn Tiến Linh',
    jerseyNumber: 22,
    position: 'Tiền đạo',
    dateOfBirth: '1997-10-20',
    phone: '0956789012',
    status: 'Đang thi đấu',
    joinedDate: '2020-06-18',
  },
];

export const initialSchedules: TrainingSchedule[] = [
  {
    id: 'sched-1',
    title: 'Rèn luyện thể lực và sức bền đầu tuần',
    type: 'Tập thể lực',
    date: '2026-10-27',
    startTime: '17:30',
    endTime: '19:30',
    fieldId: 'field-1',
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
    fieldId: 'field-1',
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
    fieldId: 'field-2',
    fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
    coach: 'HLV. Nguyễn Văn Huấn',
    status: 'Sắp diễn ra',
    notes: 'Mặc đồng phục thi đấu màu Đỏ, có mặt trước 45 phút.',
  },
];

export const initialAttendances: AttendanceRecord[] = [
  {
    id: 'att-1',
    scheduleId: 'sched-1',
    playerId: 'player-1',
    playerName: 'Đặng Văn Lâm',
    status: 'Có mặt',
    checkInTime: '17:15',
  },
  {
    id: 'att-2',
    scheduleId: 'sched-1',
    playerId: 'player-2',
    playerName: 'Đỗ Duy Mạnh',
    status: 'Có mặt',
    checkInTime: '17:20',
  },
  {
    id: 'att-3',
    scheduleId: 'sched-1',
    playerId: 'player-3',
    playerName: 'Đoàn Văn Hậu',
    status: 'Vắng có phép',
    note: 'Đang phục hồi chấn thương dây chằng',
  },
  {
    id: 'att-4',
    scheduleId: 'sched-1',
    playerId: 'player-4',
    playerName: 'Nguyễn Quang Hải',
    status: 'Có mặt',
    checkInTime: '17:10',
  },
  {
    id: 'att-5',
    scheduleId: 'sched-1',
    playerId: 'player-5',
    playerName: 'Nguyễn Hoàng Đức',
    status: 'Có mặt',
    checkInTime: '17:25',
  },
  {
    id: 'att-6',
    scheduleId: 'sched-1',
    playerId: 'player-6',
    playerName: 'Nguyễn Tiến Linh',
    status: 'Đến muộn',
    checkInTime: '17:40',
    note: 'Kẹt xe đường vành đai',
  },
];

// In-memory state store for development (easily replace with Prisma/MySQL)
class DatabaseStore {
  club = { ...initialClubInfo };
  players = [...initialPlayers];
  schedules = [...initialSchedules];
  attendances = [...initialAttendances];
  fields = [...initialFields];
}

// Global singleton to persist during hot reload
const globalForDb = globalThis as unknown as { dbStore?: DatabaseStore };
export const db = globalForDb.dbStore ?? new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.dbStore = db;
