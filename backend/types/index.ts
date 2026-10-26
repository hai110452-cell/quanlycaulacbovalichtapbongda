export type Position = 'Thủ môn' | 'Hậu vệ' | 'Tiền vệ' | 'Tiền đạo';

export type PlayerStatus = 'Đang thi đấu' | 'Chấn thương' | 'Nghỉ phép';

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: Position;
  dateOfBirth: string;
  phone: string;
  status: PlayerStatus;
  avatarUrl?: string;
  joinedDate: string;
}

export type ScheduleType = 'Tập thể lực' | 'Tập chiến thuật' | 'Đấu tập nội bộ' | 'Thi đấu giao hữu';

export type ScheduleStatus = 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã hoàn thành' | 'Đã hủy';

export interface TrainingSchedule {
  id: string;
  title: string;
  type: ScheduleType;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  fieldId: string;
  fieldName: string;
  coach: string;
  status: ScheduleStatus;
  notes?: string;
}

export type AttendanceStatus = 'Có mặt' | 'Vắng có phép' | 'Vắng không phép' | 'Đến muộn';

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  playerId: string;
  playerName: string;
  status: AttendanceStatus;
  checkInTime?: string;
  note?: string;
}

export interface FootballField {
  id: string;
  name: string;
  location: string;
  fieldType: 'Sân 7 người' | 'Sân 11 người' | 'Sân futsal';
  surfaceType: 'Cỏ nhân tạo' | 'Cỏ tự nhiên' | 'Sàn gỗ';
  status: 'Khả dụng' | 'Bảo trì';
}

export interface ClubInfo {
  name: string;
  shortName: string;
  establishedYear: number;
  coach: string;
  captain: string;
  homeStadium: string;
  logoUrl?: string;
  description: string;
}

export type UserRole = 'admin' | 'coach' | 'player';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

