'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { api } from '@/services/api';

// ==========================================
// MOCK INITIAL DATA FOR 7 MODULES
// ==========================================

// 1. Quản lý Đội bóng
interface ClubTeam {
  id: string;
  name: string;
  level: string;
  headCoach: string;
  captain: string;
  memberCount: number;
  homePitch: string;
  establishedYear: number;
  description: string;
  status: 'Hoạt động' | 'Tạm nghỉ';
}

const initialTeams: ClubTeam[] = [
  {
    id: 'team-1',
    name: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    level: 'Đội hình 1 Chuyên nghiệp',
    headCoach: 'HLV. Nguyễn Văn Huấn',
    captain: 'Nguyễn Quang Hải (#19)',
    memberCount: 22,
    homePitch: 'Sân bóng Sao Vàng B (Sân 11)',
    establishedYear: 2021,
    description: 'Đội tuyển hạt nhân thi đấu các giải phong trào ngoại hạng và cúp khu vực miền Bắc.',
    status: 'Hoạt động',
  },
  {
    id: 'team-2',
    name: 'Sao Vàng FC - Tuyển Trẻ U21',
    level: 'Lứa tuổi U21 Đào tạo',
    headCoach: 'HLV. Trần Đình Trọng',
    captain: 'Lê Văn Đô (#7)',
    memberCount: 18,
    homePitch: 'Sân bóng Sao Vàng A (Sân 7)',
    establishedYear: 2023,
    description: 'Nòng cốt kế cận, rèn luyện kỹ thuật cơ bản và tích lũy kinh nghiệm thực chiến.',
    status: 'Hoạt động',
  },
  {
    id: 'team-3',
    name: 'Sao Vàng FC - Đội Trẻ U17',
    level: 'Lứa tuổi U17 Học viện',
    headCoach: 'HLV. Phạm Đức Huy',
    captain: 'Trần Minh Quân (#10)',
    memberCount: 16,
    homePitch: 'Sân bóng Sao Vàng A (Sân 7)',
    establishedYear: 2024,
    description: 'Đào tạo thể chất và tư duy chơi bóng hiện đại cho các tài năng trẻ.',
    status: 'Hoạt động',
  },
  {
    id: 'team-4',
    name: 'Sao Vàng FC - Futsal Team',
    level: 'Bóng đá trong nhà 5 người',
    headCoach: 'HLV. Vũ Trọng Khôi',
    captain: 'Đỗ Hùng Dũng (#8)',
    memberCount: 12,
    homePitch: 'Sân trong nhà Futsal Arena',
    establishedYear: 2023,
    description: 'Chuyên thi đấu giao lưu sân sàn gỗ trong nhà, rèn kỹ thuật xoay sở phạm vi hẹp.',
    status: 'Hoạt động',
  },
];

// 2. Quản lý Thành viên / Cầu thủ
interface ClubMember {
  id: string;
  name: string;
  jerseyNumber: number;
  position: 'Thủ môn' | 'Hậu vệ' | 'Tiền vệ' | 'Tiền đạo';
  teamId: string;
  teamName: string;
  phone: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  preferredFoot: string;
  status: 'Đang tập luyện' | 'Chấn thương' | 'Nghỉ phép';
  feePaidMonth: boolean;
}

const initialMembers: ClubMember[] = [
  {
    id: 'player-001',
    name: 'Nguyễn Văn Khải',
    jerseyNumber: 1,
    position: 'Thủ môn',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0901111111',
    dateOfBirth: '1995-03-15',
    height: '1m86',
    weight: '80kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-004',
    name: 'Phạm Thanh Tùng',
    jerseyNumber: 3,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0904444444',
    dateOfBirth: '1997-05-30',
    height: '1m82',
    weight: '75kg',
    preferredFoot: 'Chân phải',
    status: 'Chấn thương',
    feePaidMonth: false,
  },
  {
    id: 'player-2',
    name: 'Đỗ Duy Mạnh',
    jerseyNumber: 4,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0912345678',
    dateOfBirth: '1996-09-29',
    height: '1m80',
    weight: '76kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-003',
    name: 'Lê Quốc Bảo',
    jerseyNumber: 4,
    position: 'Hậu vệ',
    teamId: 'team-2',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0903333333',
    dateOfBirth: '1996-11-08',
    height: '1m78',
    weight: '72kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-3',
    name: 'Đoàn Văn Hậu',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0923456789',
    dateOfBirth: '1999-04-19',
    height: '1m86',
    weight: '82kg',
    preferredFoot: 'Chân trái',
    status: 'Chấn thương',
    feePaidMonth: false,
  },
  {
    id: 'player-002',
    name: 'Trần Minh Tuấn',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0902222222',
    dateOfBirth: '1994-07-22',
    height: '1m79',
    weight: '74kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-005',
    name: 'Võ Hoàng Nam',
    jerseyNumber: 6,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0905555555',
    dateOfBirth: '1995-09-12',
    height: '1m74',
    weight: '69kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-008',
    name: 'Nguyễn Đức Thắng',
    jerseyNumber: 7,
    position: 'Tiền đạo',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0908888888',
    dateOfBirth: '1999-04-17',
    height: '1m76',
    weight: '71kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-006',
    name: 'Đặng Văn Long',
    jerseyNumber: 8,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0906666666',
    dateOfBirth: '1998-02-28',
    height: '1m75',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-009',
    name: 'Bùi Văn Kiên',
    jerseyNumber: 9,
    position: 'Tiền đạo',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0909999999',
    dateOfBirth: '1996-08-25',
    height: '1m81',
    weight: '77kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-007',
    name: 'Hoàng Minh Huy',
    jerseyNumber: 10,
    position: 'Tiền vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0907777777',
    dateOfBirth: '1993-12-01',
    height: '1m72',
    weight: '68kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-010',
    name: 'Trịnh Quang Hải',
    jerseyNumber: 11,
    position: 'Tiền đạo',
    teamId: 'team-2',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0910000000',
    dateOfBirth: '2000-01-14',
    height: '1m77',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    status: 'Nghỉ phép',
    feePaidMonth: false,
  },
  {
    id: 'player-011',
    name: 'Mai Xuân Trường',
    jerseyNumber: 13,
    position: 'Hậu vệ',
    teamId: 'team-3',
    teamName: 'Sao Vàng FC - Đội Trẻ U17',
    phone: '0911111111',
    dateOfBirth: '1997-06-19',
    height: '1m79',
    weight: '73kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-5',
    name: 'Nguyễn Hoàng Đức',
    jerseyNumber: 14,
    position: 'Tiền vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0945678901',
    dateOfBirth: '1998-01-11',
    height: '1m84',
    weight: '75kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-012',
    name: 'Lý Công Hoàng',
    jerseyNumber: 14,
    position: 'Tiền đạo',
    teamId: 'team-2',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0912222222',
    dateOfBirth: '1995-10-05',
    height: '1m78',
    weight: '72kg',
    preferredFoot: 'Chân phải',
    status: 'Chấn thương',
    feePaidMonth: false,
  },
  {
    id: 'player-4',
    name: 'Nguyễn Quang Hải',
    jerseyNumber: 19,
    position: 'Tiền vệ',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0934567890',
    dateOfBirth: '1997-04-12',
    height: '1m68',
    weight: '67kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-6',
    name: 'Nguyễn Tiến Linh',
    jerseyNumber: 22,
    position: 'Tiền đạo',
    teamId: 'team-1',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0956789012',
    dateOfBirth: '1997-10-20',
    height: '1m80',
    weight: '77kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-1793350671460',
    name: 'Trương Kỳ Gia Bảo',
    jerseyNumber: 23,
    position: 'Tiền vệ',
    teamId: 'team-4',
    teamName: 'Sao Vàng FC - Futsal Team',
    phone: '0988888888',
    dateOfBirth: '2000-01-01',
    height: '1m75',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-1793350674397',
    name: 'Lê Văn Đô',
    jerseyNumber: 24,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0967890123',
    dateOfBirth: '2001-08-07',
    height: '1m73',
    weight: '68kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
  {
    id: 'player-1793350676917',
    name: 'Trần Minh Quân',
    jerseyNumber: 25,
    position: 'Tiền đạo',
    teamId: 'team-3',
    teamName: 'Sao Vàng FC - Đội Trẻ U17',
    phone: '0978901234',
    dateOfBirth: '2007-03-15',
    height: '1m75',
    weight: '65kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
  },
];

// 3. Quản lý Huấn luyện viên
interface ClubCoach {
  id: string;
  name: string;
  role: string;
  license: string;
  assignedTeam: string;
  phone: string;
  email: string;
  experienceYears: number;
  specialty: string;
}

const initialCoaches: ClubCoach[] = [
  {
    id: 'coach-001',
    name: 'HLV. Nguyễn Văn Huấn',
    role: 'HLV Trưởng CLB',
    license: 'Bằng AFC Pro / UEFA A',
    assignedTeam: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    phone: '0912345678',
    email: 'huan.nv@saovangfc.vn',
    experienceYears: 12,
    specialty: 'Chiến thuật tổng lực, pressing tầm cao và phát triển cầu thủ',
  },
  {
    id: 'coach-002',
    name: 'HLV. Trần Đình Trọng',
    role: 'HLV Trưởng Tuyến Trẻ U21',
    license: 'Bằng AFC B',
    assignedTeam: 'Sao Vàng FC - Tuyến Trẻ U21',
    phone: '0923456781',
    email: 'trong.td@saovangfc.vn',
    experienceYears: 6,
    specialty: 'Kèm người 1v1, bọc lót và phòng ngự khu vực',
  },
  {
    id: 'coach-003',
    name: 'HLV. Phạm Đức Huy',
    role: 'HLV Đào tạo trẻ U17',
    license: 'Bằng AFC C',
    assignedTeam: 'Sao Vàng FC - Đội Trẻ U17',
    phone: '0934567812',
    email: 'huy.pd@saovangfc.vn',
    experienceYears: 5,
    specialty: 'Kỹ thuật cơ bản, thể lực nền tảng và tư duy bóng đá',
  },
  {
    id: 'coach-004',
    name: 'HLV. Vũ Trọng Khôi',
    role: 'HLV Đội Futsal',
    license: 'Bằng Futsal Level 2',
    assignedTeam: 'Sao Vàng FC - Futsal Team',
    phone: '0945678923',
    email: 'khoi.futsal@saovangfc.vn',
    experienceYears: 8,
    specialty: 'Kỹ thuật xử lý phạm vi hẹp và chiến thuật bóng đá mini',
  },
];

// 4. Quản lý Lịch tập
interface TrainingSchedule {
  id: string;
  title: string;
  teamName: string;
  type: 'Tập chiến thuật' | 'Tập thể lực' | 'Đấu tập nội bộ' | 'Thi đấu giao hữu';
  date: string;
  startTime: string;
  endTime: string;
  fieldName: string;
  coach: string;
  notes: string;
}

const initialSchedules: TrainingSchedule[] = [
  {
    id: 'sched-1',
    title: 'Rèn luyện thể lực và sức bền đầu tuần',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Tập thể lực',
    date: '2026-10-27',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Khởi động kỹ, mang giày đinh dăm AG, tập chạy biến tốc.',
  },
  {
    id: 'sched-001',
    title: 'Tập thể lực đầu tuần',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    type: 'Tập thể lực',
    date: '2026-10-28',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Chú trọng cardio và tốc độ',
  },
  {
    id: 'sched-002',
    title: 'Tập chiến thuật 4-3-3',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Tập chiến thuật',
    date: '2026-10-29',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Luyện sơ đồ chiến thuật mới',
  },
  {
    id: 'sched-2',
    title: 'Tập phối hợp bóng ngắn và sút phạt góc',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Tập chiến thuật',
    date: '2026-10-29',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân bóng Sao Vàng A (Sân 7)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Chia đội 7v7 tập phản công nhanh.',
  },
  {
    id: 'sched-003',
    title: 'Đấu tập nội bộ thứ 4',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Đấu tập nội bộ',
    date: '2026-10-30',
    startTime: '18:00',
    endTime: '20:30',
    fieldName: 'Sân Sao Vàng B',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Chia 2 đội: Đỏ vs Xanh',
  },
  {
    id: 'sched-3',
    title: 'Giao hữu thử nghiệm đội hình với Hà Nội Star FC',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Thi đấu giao hữu',
    date: '2026-10-31',
    startTime: '16:00',
    endTime: '18:30',
    fieldName: 'Sân bóng Sao Vàng B (Sân 11)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Mặc đồng phục thi đấu màu Đỏ, có mặt trước 45 phút.',
  },
  {
    id: 'sched-004',
    title: 'Tập thể lực cuối tuần',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Tập thể lực',
    date: '2026-11-01',
    startTime: '07:00',
    endTime: '09:00',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Buổi tập sáng sớm, mang giày đinh',
  },
  {
    id: 'sched-005',
    title: 'Tập kỹ thuật cá nhân',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    type: 'Tập chiến thuật',
    date: '2026-11-02',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân Mini Star',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Tập rê bóng và dứt điểm',
  },
  {
    id: 'sched-006',
    title: 'Giao hữu vs FC Rồng Xanh',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Thi đấu giao hữu',
    date: '2026-11-05',
    startTime: '16:00',
    endTime: '18:00',
    fieldName: 'Sân Thống Nhất',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Trận giao hữu hàng tháng, toàn đội tham gia',
  },
  {
    id: 'sched-007',
    title: 'Đấu tập nội bộ chủ nhật',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    type: 'Đấu tập nội bộ',
    date: '2026-11-08',
    startTime: '07:30',
    endTime: '10:00',
    fieldName: 'Sân Sao Vàng B',
    coach: 'HLV. Trần Đình Trọng',
    notes: 'Luyện set-piece và phạt góc',
  },
  {
    id: 'sched-008',
    title: 'Tập thể lực - Bài tập sức mạnh',
    teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
    type: 'Tập thể lực',
    date: '2026-11-10',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân Sao Vàng A',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Gym + field training',
  },
  {
    id: 'sched-009',
    title: 'Tập phòng thủ',
    teamName: 'Sao Vàng FC - Tuyến Trẻ U21',
    type: 'Tập chiến thuật',
    date: '2026-11-12',
    startTime: '17:00',
    endTime: '19:00',
    fieldName: 'Sân Rạch Miễu',
    coach: 'HLV. Trần Đình Trọng',
    notes: 'Tập pressing cao và chuyển trạng thái',
  },
  {
    id: 'sched-010',
    title: 'Giao hữu vs Hoàng Long FC',
    teamName: 'Sao Vàng FC - Futsal Team',
    type: 'Thi đấu giao hữu',
    date: '2026-11-15',
    startTime: '15:30',
    endTime: '17:30',
    fieldName: 'Sân Đại học Thể dục',
    coach: 'HLV. Vũ Trọng Khôi',
    notes: 'Trận quan trọng chuẩn bị cho giải cuối năm',
  },
];

// 5. Quản lý Điểm danh
interface AttendanceItem {
  id: string;
  memberId: string;
  memberName: string;
  jerseyNumber: number;
  position: string;
  status: 'Có mặt' | 'Đến muộn' | 'Vắng có phép' | 'Vắng không phép';
  note: string;
}

const initialAttendance: AttendanceItem[] = [
  { id: 'att-001-01', memberId: 'player-001', memberName: 'Nguyễn Văn Khải', jerseyNumber: 1, position: 'Thủ môn', status: 'Có mặt', note: 'Thể lực tốt' },
  { id: 'att-001-02', memberId: 'player-002', memberName: 'Trần Minh Tuấn', jerseyNumber: 5, position: 'Hậu vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-001-03', memberId: 'player-003', memberName: 'Lê Quốc Bảo', jerseyNumber: 4, position: 'Hậu vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-001-04', memberId: 'player-004', memberName: 'Phạm Thanh Tùng', jerseyNumber: 3, position: 'Hậu vệ', status: 'Vắng có phép', note: 'Chấn thương đầu gối' },
  { id: 'att-001-05', memberId: 'player-005', memberName: 'Võ Hoàng Nam', jerseyNumber: 6, position: 'Tiền vệ', status: 'Có mặt', note: 'Thể lực tốt' },
  { id: 'att-001-06', memberId: 'player-006', memberName: 'Đặng Văn Long', jerseyNumber: 8, position: 'Tiền vệ', status: 'Đến muộn', note: 'Kẹt xe (+25p)' },
  { id: 'att-001-07', memberId: 'player-007', memberName: 'Hoàng Minh Huy', jerseyNumber: 10, position: 'Tiền vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-001-08', memberId: 'player-008', memberName: 'Nguyễn Đức Thắng', jerseyNumber: 7, position: 'Tiền đạo', status: 'Có mặt', note: 'Sẵn sàng' },
  { id: 'att-001-09', memberId: 'player-009', memberName: 'Bùi Văn Kiên', jerseyNumber: 9, position: 'Tiền đạo', status: 'Vắng không phép', note: 'Không liên lạc được' },
  { id: 'att-001-10', memberId: 'player-010', memberName: 'Trịnh Quang Hải', jerseyNumber: 11, position: 'Tiền đạo', status: 'Vắng có phép', note: 'Công tác ngoại tỉnh' },
  { id: 'att-002-01', memberId: 'player-001', memberName: 'Nguyễn Văn Khải', jerseyNumber: 1, position: 'Thủ môn', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-02', memberId: 'player-002', memberName: 'Trần Minh Tuấn', jerseyNumber: 5, position: 'Hậu vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-03', memberId: 'player-003', memberName: 'Lê Quốc Bảo', jerseyNumber: 4, position: 'Hậu vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-04', memberId: 'player-005', memberName: 'Võ Hoàng Nam', jerseyNumber: 6, position: 'Tiền vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-05', memberId: 'player-006', memberName: 'Đặng Văn Long', jerseyNumber: 8, position: 'Tiền vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-06', memberId: 'player-007', memberName: 'Hoàng Minh Huy', jerseyNumber: 10, position: 'Tiền vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-07', memberId: 'player-008', memberName: 'Nguyễn Đức Thắng', jerseyNumber: 7, position: 'Tiền đạo', status: 'Đến muộn', note: 'Xử lý việc cá nhân (+10p)' },
  { id: 'att-002-08', memberId: 'player-009', memberName: 'Bùi Văn Kiên', jerseyNumber: 9, position: 'Tiền đạo', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-09', memberId: 'player-011', memberName: 'Mai Xuân Trường', jerseyNumber: 13, position: 'Hậu vệ', status: 'Có mặt', note: 'Đúng giờ' },
  { id: 'att-002-10', memberId: 'player-012', memberName: 'Lý Công Hoàng', jerseyNumber: 14, position: 'Tiền đạo', status: 'Vắng có phép', note: 'Chấn thương cơ đùi' },
];

// 6. Quản lý Phí sinh hoạt & Quỹ
interface FinanceTransaction {
  id: string;
  date: string;
  title: string;
  category: 'Thu' | 'Chi';
  amount: number;
  personInCharge: string;
  notes: string;
}

const initialTransactions: FinanceTransaction[] = [
  { id: 'fin-1', date: '2026-10-01', title: 'Thu phí sinh hoạt tháng 10 của các thành viên', category: 'Thu', amount: 6600000, personInCharge: 'Thủ quỹ CLB', notes: '22 thành viên x 300.000 VNĐ' },
  { id: 'fin-2', date: '2026-10-03', title: 'Thanh toán tiền thuê sân tập tháng 10 (Sân Sao Vàng A)', category: 'Chi', amount: 3500000, personInCharge: 'HLV Huấn', notes: '8 buổi tập x 437.500 VNĐ' },
  { id: 'fin-3', date: '2026-10-10', title: 'Tiền tài trợ từ Công ty Thể thao Động Lực', category: 'Thu', amount: 10000000, personInCharge: 'Ban Lãnh Đạo', notes: 'Tài trợ trang phục & bóng thi đấu' },
  { id: 'fin-4', date: '2026-10-15', title: 'Mua 10 quả bóng thi đấu tiêu chuẩn FIFA Quality Pro', category: 'Chi', amount: 2400000, personInCharge: 'Ban Hậu Cần', notes: 'Mua sắm trang bị tập luyện' },
  { id: 'fin-5', date: '2026-10-24', title: 'Chi phí nước uống, y tế trận giao hữu với Hà Nội Star FC', category: 'Chi', amount: 800000, personInCharge: 'Bác sĩ CLB', notes: 'Nước khoáng, điện giải và băng gạc y tế' },
];

// 7. Quản lý Thông báo
interface ClubAnnouncement {
  id: string;
  title: string;
  target: 'Toàn bộ câu lạc bộ' | 'Sao Vàng FC - Đội 1' | 'Tuyển Trẻ U21' | 'Ban Huấn Luyện';
  priority: 'Bình thường' | 'Quan trọng' | 'Khẩn cấp';
  date: string;
  author: string;
  content: string;
  pinned: boolean;
}

const initialAnnouncements: ClubAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Thông báo lịch thi đấu giao hữu cuối tuần với Hà Nội Star FC',
    target: 'Sao Vàng FC - Đội 1',
    priority: 'Quan trọng',
    date: '2026-10-28',
    author: 'HLV. Nguyễn Văn Huấn',
    content: 'Trận giao hữu diễn ra lúc 16:00 Thứ Bảy 07/11/2026 tại Sân Sao Vàng B. Toàn đội mặc trang phục màu Đỏ, có mặt trước 45 phút để họp chiến thuật.',
    pinned: true,
  },
  {
    id: 'ann-2',
    title: 'Nhắc nhở hoàn thành đóng quỹ và phí sinh hoạt Tháng 11/2026',
    target: 'Toàn bộ câu lạc bộ',
    priority: 'Bình thường',
    date: '2026-10-29',
    author: 'Ban Thư Ký CLB',
    content: 'Kính gửi toàn thể các thành viên, đề nghị hoàn tất nộp phí sinh hoạt 300.000 VNĐ trước ngày 05/11 để ban hậu cần thanh toán tiền thuê sân và bổ sung trang thiết bị.',
    pinned: false,
  },
  {
    id: 'ann-3',
    title: 'Kế hoạch kiểm tra y tế & thể lực định kỳ đợt 2 lứa trẻ U17 và U21',
    target: 'Tuyển Trẻ U21',
    priority: 'Quan trọng',
    date: '2026-10-27',
    author: 'Bộ phận Y tế & Thể lực',
    content: 'Các cầu thủ có mặt tại phòng y tế lúc 08:30 sáng Chủ Nhật để tiến hành đo chỉ số VO2Max, chiều cao cân nặng và tình trạng cơ xương khớp.',
    pinned: false,
  },
];

// ==========================================
// MAIN COMPONENT: MASTER DASHBOARD 7 MODULES
// ==========================================
function DashboardContent() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const searchParams = useSearchParams();

  // Active Tab: 7 requested modules
  type TabType = 'teams' | 'members' | 'coaches' | 'schedules' | 'attendance' | 'finances' | 'announcements';
  const [activeTab, setActiveTab] = useState<TabType>('teams');

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['teams', 'members', 'coaches', 'schedules', 'attendance', 'finances', 'announcements'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // States for 7 modules
  const [teams, setTeams] = useState<ClubTeam[]>(initialTeams);
  const [members, setMembers] = useState<ClubMember[]>(initialMembers);
  const [coaches, setCoaches] = useState<ClubCoach[]>(initialCoaches);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>(initialSchedules);
  const [attendance, setAttendance] = useState<AttendanceItem[]>(initialAttendance);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>(initialAnnouncements);

  // Neon DB Connection & Sync State
  const [isNeonConnected, setIsNeonConnected] = useState<boolean>(false);
  const [isLoadingNeon, setIsLoadingNeon] = useState<boolean>(true);
  const [neonStats, setNeonStats] = useState<{
    teams: number;
    players: number;
    schedules: number;
    attendances: number;
    notifications: number;
    users: number;
  }>({ teams: 0, players: 0, schedules: 0, attendances: 0, notifications: 0, users: 0 });

  // Nạp dữ liệu trực tiếp từ Neon Cloud PostgreSQL thông qua NestJS backend
  const loadNeonDatabase = async () => {
    setIsLoadingNeon(true);
    try {
      const [teamsRes, playersRes, schedulesRes, attendancesRes, notifsRes, usersRes] = await Promise.all([
        api.getTeams().catch(() => null),
        api.getPlayers().catch(() => null),
        api.getSchedules().catch(() => null),
        api.getAttendances().catch(() => null),
        api.getNotifications().catch(() => null),
        api.getUsers().catch(() => null),
      ]);

      let hasNeonData = false;

      // 0. Đội bóng từ Neon DB (4 đội bóng)
      if (teamsRes && Array.isArray(teamsRes.data) && teamsRes.data.length > 0) {
        hasNeonData = true;
        const mappedTeams: ClubTeam[] = teamsRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          level: t.level || 'Đội bóng trực thuộc CLB',
          headCoach: t.headCoach || t.head_coach || 'Chưa phân công',
          captain: t.captain || 'Chưa chỉ định',
          memberCount: Number(t.memberCount || t.member_count) || 0,
          homePitch: t.homePitch || t.home_pitch || 'Sân bóng Sao Vàng',
          establishedYear: Number(t.establishedYear || t.established_year) || 2024,
          description: t.description || '',
          status: t.status === 'Tạm nghỉ' ? 'Tạm nghỉ' : 'Hoạt động',
        }));
        setTeams(mappedTeams);
      }

      // 1. Cầu thủ từ Neon DB (20 cầu thủ)
      if (playersRes && Array.isArray(playersRes.data) && playersRes.data.length > 0) {
        hasNeonData = true;
        const mappedMembers: ClubMember[] = playersRes.data.map((p: any, idx: number) => {
          let pos: ClubMember['position'] = 'Tiền vệ';
          if (['Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'].includes(p.position)) {
            pos = p.position;
          }
          let st: ClubMember['status'] = 'Đang tập luyện';
          if (p.status === 'Chấn thương') st = 'Chấn thương';
          else if (p.status === 'Nghỉ phép') st = 'Nghỉ phép';

          const teamIdx = idx % 4;
          const defaultTeams = [
            { id: 'team-1', name: 'Sao Vàng FC - Đội 1 (Tuyển Chính)' },
            { id: 'team-2', name: 'Sao Vàng FC - Tuyến Trẻ U21' },
            { id: 'team-3', name: 'Sao Vàng FC - Đội Trẻ U17' },
            { id: 'team-4', name: 'Sao Vàng FC - Futsal Team' },
          ];

          return {
            id: p.id || `mem-${idx + 1}`,
            name: p.name,
            jerseyNumber: p.jerseyNumber || (idx + 1),
            position: pos,
            teamId: p.teamId || defaultTeams[teamIdx].id,
            teamName: p.teamName || defaultTeams[teamIdx].name,
            phone: p.phone || '0901234567',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '1998-05-15',
            height: p.height || '1m78',
            weight: p.weight || '72kg',
            preferredFoot: p.preferredFoot || 'Chân phải',
            status: st,
            feePaidMonth: p.feePaidMonth !== undefined ? p.feePaidMonth : (idx % 3 !== 0),
          };
        });
        setMembers(mappedMembers);
      }

      // 2. Lịch huấn luyện từ Neon DB (13 lịch tập)
      if (schedulesRes && Array.isArray(schedulesRes.data) && schedulesRes.data.length > 0) {
        hasNeonData = true;
        const mappedSchedules: TrainingSchedule[] = schedulesRes.data.map((s: any, idx: number) => {
          let typeVal: TrainingSchedule['type'] = 'Tập chiến thuật';
          if (['Tập chiến thuật', 'Tập thể lực', 'Thi đấu nội bộ', 'Thi đấu giao hữu'].includes(s.type)) {
            typeVal = s.type;
          }
          return {
            id: s.id,
            title: s.title || `Buổi tập kỹ chiến thuật #${idx + 1}`,
            teamName: s.teamName || (idx % 2 === 0 ? 'Sao Vàng FC - Đội 1 (Tuyển Chính)' : 'Sao Vàng FC - Tuyến Trẻ U21'),
            type: typeVal,
            date: s.date || '2026-11-01',
            startTime: s.startTime || '18:00',
            endTime: s.endTime || '20:00',
            fieldName: s.fieldName || 'Sân bóng Sao Vàng A (Sân 7)',
            coach: s.coach || 'HLV. Nguyễn Văn Huấn',
            notes: s.notes || 'Khởi động kỹ, mang giày phù hợp mặt sân cỏ nhân tạo.',
          };
        });
        setSchedules(mappedSchedules);
      }

      // 3. Điểm danh từ Neon DB (20 bản ghi điểm danh)
      if (attendancesRes && Array.isArray(attendancesRes.data) && attendancesRes.data.length > 0) {
        hasNeonData = true;
        const mappedAttendance: AttendanceItem[] = attendancesRes.data.map((a: any, idx: number) => {
          let st: AttendanceItem['status'] = 'Có mặt';
          if (['Có mặt', 'Vắng có phép', 'Vắng không phép', 'Đến muộn'].includes(a.status)) {
            st = a.status;
          }
          return {
            id: a.id || `att-${idx + 1}`,
            memberId: a.playerId || `mem-${idx + 1}`,
            memberName: a.playerName || 'Cầu thủ Sao Vàng FC',
            jerseyNumber: a.jerseyNumber || (idx + 1),
            position: a.position || 'Cầu thủ',
            status: st,
            note: a.note || (st === 'Có mặt' ? 'Thể lực tốt' : 'Theo dõi thêm'),
          };
        });
        setAttendance(mappedAttendance);
      }

      // 4. Thông báo từ Neon DB (10 thông báo)
      if (notifsRes && Array.isArray(notifsRes.data) && notifsRes.data.length > 0) {
        hasNeonData = true;
        const mappedAnnouncements: ClubAnnouncement[] = notifsRes.data.map((n: any, idx: number) => {
          return {
            id: n.id,
            title: n.title,
            target: (idx % 2 === 0 ? 'Toàn bộ câu lạc bộ' : 'Sao Vàng FC - Đội 1') as any,
            priority: (n.type === 'warning' ? 'Khẩn cấp' : n.type === 'update' ? 'Quan trọng' : 'Bình thường') as any,
            date: n.createdAt ? n.createdAt.split('T')[0] : '2026-10-30',
            author: 'Ban Quản Trị CLB',
            content: n.message || n.title,
            pinned: idx < 2,
          };
        });
        setAnnouncements(mappedAnnouncements);
      }

      // 5. Huấn luyện viên & Ban huấn luyện trực tiếp từ Neon DB
      if (usersRes && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        hasNeonData = true;
        const coachesFromDb = usersRes.data.filter((u: any) => u.role === 'coach');
        if (coachesFromDb.length > 0) {
          // Bảng phân công & chuyên môn theo danh sách HLV trong Neon DB
          const coachMetaMap: Record<string, { role: string; license: string; team: string; exp: number; spec: string }> = {
            'HLV. Nguyễn Văn Huấn': {
              role: 'HLV Trưởng CLB',
              license: 'Bằng AFC Pro / UEFA A',
              team: 'Sao Vàng FC - Đội 1 (Tuyển Chính)',
              exp: 12,
              spec: 'Chiến thuật tổng lực, pressing tầm cao và phát triển cầu thủ',
            },
            'HLV. Trần Đình Trọng': {
              role: 'HLV Trưởng Tuyến Trẻ U21',
              license: 'Bằng AFC B',
              team: 'Sao Vàng FC - Tuyến Trẻ U21',
              exp: 6,
              spec: 'Kèm người 1v1, bọc lót và phòng ngự khu vực',
            },
            'HLV. Phạm Đức Huy': {
              role: 'HLV Đào tạo trẻ U17',
              license: 'Bằng AFC C',
              team: 'Sao Vàng FC - Đội Trẻ U17',
              exp: 5,
              spec: 'Kỹ thuật cơ bản, thể lực nền tảng và tư duy bóng đá',
            },
            'HLV. Vũ Trọng Khôi': {
              role: 'HLV Đội Futsal',
              license: 'Bằng Futsal Level 2',
              team: 'Sao Vàng FC - Futsal Team',
              exp: 8,
              spec: 'Kỹ thuật xử lý phạm vi hẹp và chiến thuật bóng đá mini',
            },
          };

          const mappedCoaches: ClubCoach[] = coachesFromDb.map((c: any, idx: number) => {
            const meta = coachMetaMap[c.name] || {
              role: 'HLV Chuyên Môn',
              license: 'Bằng AFC B',
              team: idx % 2 === 0 ? 'Sao Vàng FC - Đội 1 (Tuyển Chính)' : 'Sao Vàng FC - Tuyến Trẻ U21',
              exp: 5 + (idx % 6),
              spec: 'Rèn luyện thể lực và kỹ chiến thuật bóng đá hiện đại',
            };
            return {
              id: c.id,
              name: c.name,
              role: meta.role,
              license: meta.license,
              assignedTeam: meta.team,
              phone: c.phone || '0912345678',
              email: c.email || 'hlv@saovangfc.vn',
              experienceYears: meta.exp,
              specialty: meta.spec,
            };
          });

          // Loại bỏ trùng tên và nạp trực tiếp danh sách HLV từ Neon Database
          const seen = new Set<string>();
          const dedupedCoaches = mappedCoaches.filter((c) => {
            if (seen.has(c.name)) return false;
            seen.add(c.name);
            return true;
          });

          setCoaches(dedupedCoaches);
        }
      }

      setIsNeonConnected(hasNeonData);
      setNeonStats({
        teams: (teamsRes?.data?.length) || 0,
        players: (playersRes?.data?.length) || 0,
        schedules: (schedulesRes?.data?.length) || 0,
        attendances: (attendancesRes?.data?.length) || 0,
        notifications: (notifsRes?.data?.length) || 0,
        users: (usersRes?.data?.length) || 0,
      });
    } catch (err) {
      console.warn('Lỗi kết nối Neon PostgreSQL API:', err);
      setIsNeonConnected(false);
    } finally {
      setIsLoadingNeon(false);
    }
  };

  useEffect(() => {
    loadNeonDatabase();
  }, []);

  // Filters & Searches
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTeamFilter, setMemberTeamFilter] = useState('Tất cả');
  const [scheduleTeamFilter, setScheduleTeamFilter] = useState('Tất cả');

  // Modals visibility
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddFinanceModal, setShowAddFinanceModal] = useState(false);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);

  // Forms
  const [newTeam, setNewTeam] = useState({ name: '', level: 'Đội hình 1 Chuyên nghiệp', headCoach: 'HLV. Nguyễn Văn Huấn', captain: '', memberCount: 15, homePitch: 'Sân bóng Sao Vàng A (Sân 7)', description: '' });
  const [newMember, setNewMember] = useState({ name: '', jerseyNumber: 9, position: 'Tiền đạo' as const, teamId: 'team-1', phone: '', dateOfBirth: '2000-01-01', height: '1m78', weight: '72kg', preferredFoot: 'Chân phải' });
  const [newCoach, setNewCoach] = useState({ name: '', role: 'HLV Thể lực', license: 'Bằng AFC B', assignedTeam: 'Sao Vàng FC - Đội 1 (Tuyển Chính)', phone: '', email: '', experienceYears: 5, specialty: 'Rèn luyện thể lực và sức bền' });
  const [newSchedule, setNewSchedule] = useState({ title: '', teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)', type: 'Tập chiến thuật' as const, date: '2026-11-06', startTime: '18:00', endTime: '20:00', fieldName: 'Sân bóng Sao Vàng A (Sân 7)', coach: 'HLV. Nguyễn Văn Huấn', notes: '' });
  const [newTransaction, setNewTransaction] = useState({ title: '', category: 'Thu' as const, amount: 1000000, personInCharge: 'Thủ quỹ CLB', notes: '' });
  const [newAnnouncement, setNewAnnouncement] = useState<{
    title: string;
    target: ClubAnnouncement['target'];
    priority: ClubAnnouncement['priority'];
    content: string;
  }>({
    title: '',
    target: 'Toàn bộ câu lạc bộ',
    priority: 'Bình thường',
    content: '',
  });

  // Conflict state for schedules
  const [scheduleConflict, setScheduleConflict] = useState<string | null>(null);

  // Validate conflict in real time
  useEffect(() => {
    if (!newSchedule.date || !newSchedule.startTime || !newSchedule.endTime) {
      setScheduleConflict(null);
      return;
    }
    if (newSchedule.endTime <= newSchedule.startTime) {
      setScheduleConflict('⚠️ Giờ kết thúc phải lớn hơn giờ bắt đầu!');
      return;
    }
    const conflict = schedules.find((s) => {
      if (s.date === newSchedule.date) {
        const overlap = newSchedule.startTime < s.endTime && newSchedule.endTime > s.startTime;
        if (overlap && s.fieldName.toLowerCase() === newSchedule.fieldName.toLowerCase()) {
          return true;
        }
      }
      return false;
    });
    if (conflict) {
      setScheduleConflict(`⚠️ TRÙNG SÂN TẬP: "${conflict.fieldName}" đã có lịch "${conflict.title}" (${conflict.startTime} - ${conflict.endTime})!`);
    } else {
      setScheduleConflict(null);
    }
  }, [newSchedule, schedules]);

  // Financial calculations
  const totalIncome = transactions.filter((t) => t.category === 'Thu').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.category === 'Chi').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;
  const paidMembersCount = members.filter((m) => m.feePaidMonth).length;

  // RBAC Permission Check cho 3 vai trò: Admin, HLV, Thành viên
  const isAdmin = user?.role === 'admin';
  const isCoach = user?.role === 'coach';
  const isPlayer = user?.role === 'player' || (!isAdmin && !isCoach);

  // Quyền quản trị CLB (Đội bóng, thành viên, HLV, tài chính): Chỉ Admin
  const canManageClub = isAdmin;

  // Quyền chuyên môn tập luyện (Lịch tập, điểm danh, thông báo): Admin & HLV
  const canManageTraining = isAdmin || isCoach;

  // Tương thích ngược:
  const canManage = canManageTraining;

  // Format currency
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // 1. Handlers for Teams
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name) return;
    const team: ClubTeam = {
      id: `team-${Date.now()}`,
      name: newTeam.name,
      level: newTeam.level,
      headCoach: newTeam.headCoach,
      captain: newTeam.captain || 'Chưa chỉ định',
      memberCount: Number(newTeam.memberCount) || 0,
      homePitch: newTeam.homePitch,
      establishedYear: 2026,
      description: newTeam.description || 'Đội bóng thuộc biên chế CLB Sao Vàng FC',
      status: 'Hoạt động',
    };
    setTeams([...teams, team]);
    addNotification('Thành lập đội bóng mới', `CLB vừa phê duyệt thành lập đội "${team.name}".`, 'new');
    setShowAddTeamModal(false);
    setNewTeam({ name: '', level: 'Đội hình 1 Chuyên nghiệp', headCoach: 'HLV. Nguyễn Văn Huấn', captain: '', memberCount: 15, homePitch: 'Sân bóng Sao Vàng A (Sân 7)', description: '' });

    // Lưu trực tiếp vào Neon Cloud PostgreSQL
    try {
      await api.addTeam(team);
      loadNeonDatabase();
    } catch (err) {
      console.warn('Lỗi lưu đội bóng vào Neon DB:', err);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn giải thể / xóa đội bóng này?')) {
      setTeams(teams.filter((t) => t.id !== id));
      try {
        await api.deleteTeam(id);
      } catch (err) {
        console.warn('Lỗi xóa đội bóng khỏi Neon DB:', err);
      }
    }
  };

  // 2. Handlers for Members
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;
    const targetTeam = teams.find((t) => t.id === newMember.teamId);
    const member: ClubMember = {
      id: `player-${Date.now()}`,
      name: newMember.name,
      jerseyNumber: Number(newMember.jerseyNumber),
      position: newMember.position,
      teamId: newMember.teamId,
      teamName: targetTeam ? targetTeam.name : 'Sao Vàng FC - Đội 1',
      phone: newMember.phone || '0900000000',
      dateOfBirth: newMember.dateOfBirth,
      height: newMember.height,
      weight: newMember.weight,
      preferredFoot: newMember.preferredFoot,
      status: 'Đang tập luyện',
      feePaidMonth: false,
    };
    setMembers([member, ...members]);
    addNotification('Thành viên mới gia nhập', `Cầu thủ ${member.name} (#${member.jerseyNumber}) vừa gia nhập ${member.teamName}.`, 'new');
    setShowAddMemberModal(false);
    setNewMember({ name: '', jerseyNumber: 9, position: 'Tiền đạo', teamId: 'team-1', phone: '', dateOfBirth: '2000-01-01', height: '1m78', weight: '72kg', preferredFoot: 'Chân phải' });

    // Lưu trực tiếp vào Neon Cloud PostgreSQL
    try {
      await api.addPlayer({
        name: member.name,
        jerseyNumber: member.jerseyNumber,
        position: member.position,
        phone: member.phone,
        dateOfBirth: member.dateOfBirth,
        status: member.status === 'Chấn thương' ? 'Chấn thương' : member.status === 'Nghỉ phép' ? 'Nghỉ phép' : 'Đang thi đấu',
      });
      loadNeonDatabase();
    } catch (err) {
      console.warn('Lỗi lưu cầu thủ vào Neon DB:', err);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách?')) {
      setMembers(members.filter((m) => m.id !== id));
      try {
        await api.deletePlayer(id);
      } catch (err) {
        console.warn('Lỗi xóa cầu thủ khỏi Neon DB:', err);
      }
    }
  };

  const toggleMemberFee = (id: string) => {
    if (!canManage) return;
    setMembers(members.map((m) => (m.id === id ? { ...m, feePaidMonth: !m.feePaidMonth } : m)));
  };

  // 3. Handlers for Coaches
  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoach.name) return;
    const coach: ClubCoach = {
      id: `coach-${Date.now()}`,
      name: newCoach.name,
      role: newCoach.role,
      license: newCoach.license,
      assignedTeam: newCoach.assignedTeam,
      phone: newCoach.phone || '0912345678',
      email: newCoach.email || `hlv.${Date.now()}@saovangfc.vn`,
      experienceYears: Number(newCoach.experienceYears) || 3,
      specialty: newCoach.specialty,
    };
    setCoaches([coach, ...coaches]);
    addNotification('Bổ nhiệm HLV mới', `CLB bổ nhiệm ${coach.name} phụ trách ${coach.assignedTeam}.`, 'new');
    setShowAddCoachModal(false);
    setNewCoach({ name: '', role: 'HLV Thể lực', license: 'Bằng AFC B', assignedTeam: 'Sao Vàng FC - Đội 1 (Tuyển Chính)', phone: '', email: '', experienceYears: 5, specialty: 'Rèn luyện thể lực và sức bền' });

    // Lưu trực tiếp HLV vào Neon DB
    try {
      await api.addUser({
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        role: 'coach',
        password: 'password123',
      });
      loadNeonDatabase();
    } catch (err) {
      console.warn('Lỗi lưu HLV vào Neon DB:', err);
    }
  };

  const handleDeleteCoach = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn xóa thông tin HLV này?')) {
      setCoaches(coaches.filter((c) => c.id !== id));
      try {
        await api.deleteUser(id);
      } catch (err) {
        console.warn('Lỗi xóa HLV khỏi Neon DB:', err);
      }
    }
  };


  // 4. Handlers for Schedules
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleConflict && scheduleConflict.startsWith('⚠️ TRÙNG SÂN')) {
      alert('Không thể tạo lịch do bị trùng sân tập!');
      return;
    }
    const schedule: TrainingSchedule = {
      id: `sched-${Date.now()}`,
      title: newSchedule.title || 'Buổi tập huấn luyện',
      teamName: newSchedule.teamName,
      type: newSchedule.type,
      date: newSchedule.date,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      fieldName: newSchedule.fieldName,
      coach: newSchedule.coach,
      notes: newSchedule.notes,
    };
    setSchedules([schedule, ...schedules]);
    addNotification('Lên lịch tập luyện mới', `Lịch tập "${schedule.title}" của ${schedule.teamName} lúc ${schedule.startTime} ngày ${schedule.date}.`, 'new');
    setShowAddScheduleModal(false);
    setNewSchedule({ title: '', teamName: 'Sao Vàng FC - Đội 1 (Tuyển Chính)', type: 'Tập chiến thuật', date: '2026-11-06', startTime: '18:00', endTime: '20:00', fieldName: 'Sân bóng Sao Vàng A (Sân 7)', coach: 'HLV. Nguyễn Văn Huấn', notes: '' });

    // Lưu trực tiếp vào Neon Cloud PostgreSQL
    try {
      await api.addSchedule({
        title: schedule.title,
        type: schedule.type,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        fieldName: schedule.fieldName,
        coach: schedule.coach,
        notes: schedule.notes,
      });
      loadNeonDatabase();
    } catch (err) {
      console.warn('Lỗi lưu lịch tập vào Neon DB:', err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn hủy / xóa buổi tập này?')) {
      setSchedules(schedules.filter((s) => s.id !== id));
      try {
        await api.deleteSchedule(id);
      } catch (err) {
        console.warn('Lỗi xóa lịch tập khỏi Neon DB:', err);
      }
    }
  };

  // 5. Handlers for Attendance
  const handleUpdateAttendance = (id: string, newStatus: AttendanceItem['status']) => {
    if (!canManage) return;
    setAttendance(attendance.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  };

  // 6. Handlers for Finances
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.title || newTransaction.amount <= 0) return;
    const trans: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: newTransaction.title,
      category: newTransaction.category,
      amount: Number(newTransaction.amount),
      personInCharge: newTransaction.personInCharge || 'Thủ quỹ',
      notes: newTransaction.notes || '',
    };
    setTransactions([trans, ...transactions]);
    addNotification('Giao dịch quỹ câu lạc bộ', `Ghi nhận khoản ${trans.category}: "${trans.title}" số tiền ${formatVND(trans.amount)}.`, 'new');
    setShowAddFinanceModal(false);
    setNewTransaction({ title: '', category: 'Thu', amount: 1000000, personInCharge: 'Thủ quỹ CLB', notes: '' });
  };

  // 7. Handlers for Announcements
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const item: ClubAnnouncement = {
      id: `notif-${Date.now()}`,
      title: newAnnouncement.title,
      target: newAnnouncement.target,
      priority: newAnnouncement.priority,
      date: new Date().toISOString().split('T')[0],
      author: user?.name || 'Ban Quản Trị CLB',
      content: newAnnouncement.content,
      pinned: newAnnouncement.priority === 'Khẩn cấp',
    };
    setAnnouncements([item, ...announcements]);
    addNotification('Thông báo câu lạc bộ mới', item.title, 'new');
    setShowAddAnnouncementModal(false);
    setNewAnnouncement({ title: '', target: 'Toàn bộ câu lạc bộ', priority: 'Bình thường', content: '' });

    // Lưu vào Neon PostgreSQL
    try {
      await api.addNotification({
        title: item.title,
        message: item.content,
        type: item.priority === 'Khẩn cấp' ? 'warning' : 'new',
      });
      loadNeonDatabase();
    } catch (err) {
      console.warn('Lỗi lưu thông báo vào Neon DB:', err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
      try {
        await api.deleteNotification(id);
      } catch (err) {
        console.warn('Lỗi xóa thông báo khỏi Neon DB:', err);
      }
    }
  };


  // Export CSV
  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchTeam = memberTeamFilter === 'Tất cả' || m.teamName === memberTeamFilter;
    const q = memberSearch.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || String(m.jerseyNumber).includes(q) || m.phone.includes(q);
    return matchTeam && matchSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 1. HERO BANNER - MÀU CHỦ ĐẠO XANH LÁ & TRẮNG */}
      <section className="relative overflow-hidden rounded-3xl green-card-hero p-6 sm:p-8 border border-emerald-400/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              SAO VÀNG FOOTBALL CLUB • TRUNG TÂM QUẢN TRỊ TOÀN DIỆN
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Quản Lý Đội Bóng, Thành Viên & Lịch Huấn Luyện
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base leading-relaxed">
              Hệ thống trung tâm hỗ trợ ban quản trị, huấn luyện viên và toàn thể thành viên quản lý đội ngũ, điều hành lịch tập, theo dõi điểm danh, thu chi quỹ sinh hoạt và trao đổi thông báo tức thì.
            </p>
          </div>

          {/* Quick Info Box in Green & White */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 sm:p-5 text-white shrink-0 min-w-[280px]">
            <div className="text-xs uppercase font-bold text-emerald-100 tracking-wider">Tình Hình Tổng Quan</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 rounded-xl p-2.5">
                <span className="text-emerald-200 block text-[11px]">Số Đội Bóng</span>
                <strong className="text-lg text-white font-extrabold">{teams.length} Đội</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <span className="text-emerald-200 block text-[11px]">Tổng Quân Số</span>
                <strong className="text-lg text-white font-extrabold">{members.length} Cầu thủ</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <span className="text-emerald-200 block text-[11px]">Ban Huấn Luyện</span>
                <strong className="text-lg text-white font-extrabold">{coaches.length} HLV</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <span className="text-emerald-200 block text-[11px]">Số Dư Quỹ CLB</span>
                <strong className="text-sm text-emerald-200 font-extrabold block truncate">{formatVND(currentBalance)}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THÔNG BÁO VAI TRÒ & PHÂN QUYỀN HỆ THỐNG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-5 rounded-2xl bg-[#022c22]/90 border border-emerald-500/40 text-xs text-emerald-100 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0 p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40">
            {isAdmin ? '🛡️' : isCoach ? '📋' : isPlayer ? '🏃' : '👋'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">
                {user ? `Vai trò: ${isAdmin ? 'Quản Trị Viên (Admin)' : isCoach ? 'Huấn Luyện Viên (HLV)' : 'Thành Viên / Cầu Thủ'}` : 'Chế Độ Xem Khách (Chưa đăng nhập)'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isCoach
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : user
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-white/20 text-white border border-white/40'
              }`}>
                {isAdmin ? 'Toàn Quyền' : isCoach ? 'Chuyên Môn & Điểm Danh' : user ? 'Chế Độ Xem & Tham Gia' : 'Khách Vãng Lai'}
              </span>
            </div>
            <p className="text-emerald-300/90 mt-0.5 text-[11.5px]">
              {isAdmin
                ? 'Bạn có toàn quyền thêm, sửa, xóa các đội bóng, nhân sự, lịch tập, tài chính và thông báo CLB.'
                : isCoach
                ? 'Bạn có quyền điều hành lịch tập luyện, thực hiện điểm danh các buổi tập và đăng thông báo.'
                : user
                ? 'Bạn có quyền theo dõi lịch tập luyện, danh sách đội bóng, kiểm tra điểm danh và đóng phí sinh hoạt.'
                : 'Bạn đang xem thông tin chung của CLB. Hãy Đăng Nhập hoặc Đăng Ký để mở khóa toàn bộ quyền hạn!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {user ? (
            <>
              <span className="text-[11px] text-emerald-400 font-bold">Tài khoản:</span>
              <span className="font-black text-white px-2.5 py-1 rounded-lg bg-emerald-800 border border-emerald-600">
                {user.name}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs border border-emerald-500">
                🔑 Đăng Nhập
              </Link>
              <Link href="/register" className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-950 font-bold rounded-lg text-xs shadow">
                📝 Đăng Ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODULE CONTENTS */}

      {/* ================= MODULE 1: QUẢN LÝ ĐỘI ================= */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>🛡️</span> Quản Lý Các Đội Bóng Thuộc Câu Lạc Bộ
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thêm, sửa, xóa và quản lý thông tin tổng quan, ban cán sự, HLV trưởng của từng đội bóng
              </p>
            </div>

            {canManageClub && (
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                <span>+</span>
                <span>Thêm Đội Bóng Mới</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-3xl border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 hover:border-emerald-600 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 p-6 relative overflow-hidden flex flex-col justify-between"
              >
                {/* DẢI MÀU ACCENT TRÊN ĐỈNH CARD */}
                <div className="h-2.5 bg-gradient-to-r from-[#022c22] via-emerald-600 to-emerald-400 -mx-6 -mt-6 mb-5"></div>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                        🛡️ {t.level}
                      </span>
                      <h4 className="font-black text-xl text-emerald-950 mt-2 tracking-tight">
                        {t.name}
                      </h4>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 font-extrabold border border-emerald-400 flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-medium">
                    {t.description}
                  </p>

                  {/* KHỐI THÔNG TIN 4 Ô NỀN XANH LÁ NHẠT - TRẮNG XEN KẼ */}
                  <div className="grid grid-cols-2 gap-3.5 text-xs bg-gradient-to-br from-emerald-50/90 via-emerald-50/50 to-white p-4 rounded-2xl border-2 border-emerald-200/90 shadow-inner">
                    <div className="space-y-0.5">
                      <span className="text-emerald-800 font-bold block text-[11px] flex items-center gap-1">
                        👔 HLV Trưởng:
                      </span>
                      <strong className="text-slate-900 font-extrabold block">{t.headCoach}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-emerald-800 font-bold block text-[11px] flex items-center gap-1">
                        👑 Đội Trưởng:
                      </span>
                      <strong className="text-slate-900 font-extrabold block">{t.captain}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-emerald-800 font-bold block text-[11px] flex items-center gap-1">
                        🏟️ Sân Tập Chính:
                      </span>
                      <strong className="text-slate-900 font-extrabold block">{t.homePitch}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-emerald-800 font-bold block text-[11px] flex items-center gap-1">
                        👥 Quân Số:
                      </span>
                      <strong className="text-emerald-700 font-black text-sm block">
                        {t.memberCount} thành viên
                      </strong>
                    </div>
                  </div>
                </div>

                {/* HÀNH ĐỘNG CUỐI CARD */}
                <div className="mt-5 pt-4 border-t-2 border-emerald-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMemberTeamFilter(t.name);
                      setActiveTab('members');
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 hover:from-emerald-800 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Xem danh sách cầu thủ</span>
                    <span>→</span>
                  </button>

                  {canManageClub && (
                    <button
                      onClick={() => handleDeleteTeam(t.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 font-bold text-xs transition-all cursor-pointer"
                    >
                      Xóa Đội
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 2: QUẢN LÝ THÀNH VIÊN ================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>🏃</span> Quản Lý Hồ Sơ Cầu Thủ & Thành Viên
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý chi tiết thông tin nhân sự, số áo, vị trí, chỉ số thể chất và đội trực thuộc
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleExportCSV(
                    'Danh_Sach_Thanh_Vien_SaoVangFC',
                    ['Họ Tên', 'Số Áo', 'Vị Trí', 'Đội Bóng', 'Điện Thoại', 'Ngày Sinh', 'Trạng Thái', 'Đóng Phí Tháng'],
                    members.map((m) => [m.name, m.jerseyNumber, m.position, m.teamName, m.phone, m.dateOfBirth, m.status, m.feePaidMonth ? 'Đã đóng' : 'Chưa đóng'])
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
              >
                📥 Xuất File CSV
              </button>

              {canManageClub && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Thêm Thành Viên</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Team Filter */}
          <div className="bg-white p-4 rounded-3xl border-2 border-emerald-400/90 shadow-lg shadow-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wide whitespace-nowrap">🛡️ Chọn Đội:</span>
              <select
                value={memberTeamFilter}
                onChange={(e) => setMemberTeamFilter(e.target.value)}
                className="bg-emerald-50/70 border-2 border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="Tất cả">Tất cả các đội</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm tên, số áo, số điện thoại..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full bg-emerald-50/50 border-2 border-emerald-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
              <span className="absolute right-3.5 top-2.5 text-emerald-700 text-xs">🔍</span>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-3xl border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="green-table-header font-black uppercase tracking-wider border-b-2 border-emerald-700 text-white">
                  <tr>
                    <th className="p-4">Số Áo</th>
                    <th className="p-4">Họ Và Tên</th>
                    <th className="p-4">Vị Trí</th>
                    <th className="p-4">Đội Trực Thuộc</th>
                    <th className="p-4">Điện Thoại</th>
                    <th className="p-4">Thể Chất</th>
                    <th className="p-4">Trạng Thái</th>
                    <th className="p-4 text-center">Phí Tháng</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 text-slate-700">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="odd:bg-white even:bg-emerald-50/30 hover:bg-emerald-100/60 transition-colors">
                      <td className="p-4 font-black text-emerald-800">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold flex items-center justify-center text-xs shadow-sm">
                          #{m.jerseyNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <strong className="text-slate-900 block font-bold text-sm">{m.name}</strong>
                        <span className="text-[11px] text-slate-400">Sinh: {m.dateOfBirth}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold">
                          {m.position}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{m.teamName}</td>
                      <td className="p-4 font-mono text-slate-600">{m.phone}</td>
                      <td className="p-4 text-slate-600">{m.height} • {m.weight} ({m.preferredFoot})</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            m.status === 'Chấn thương'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleMemberFee(m.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            m.feePaidMonth
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                          title="Click để đổi trạng thái đóng phí"
                        >
                          {m.feePaidMonth ? '✓ Đã đóng' : 'Chưa đóng'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Xem chi tiết"
                          >
                            👁️
                          </button>
                          {canManageClub && (
                            <button
                              onClick={() => handleDeleteMember(m.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                              title="Xóa thành viên"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 3: QUẢN LÝ HUẤN LUYỆN VIÊN ================= */}
      {activeTab === 'coaches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>📋</span> Quản Lý Huấn Luyện Viên & Phân Công Chuyên Môn
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi danh sách huấn luyện viên, văn bằng chứng chỉ và đội bóng được phân công phụ trách
              </p>
            </div>

            {canManageClub && (
              <button
                onClick={() => setShowAddCoachModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Thêm Huấn Luyện Viên</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {coaches.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 hover:border-emerald-600 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 p-5 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Dải màu accent trên đỉnh */}
                <div className="h-2 bg-gradient-to-r from-[#022c22] via-emerald-600 to-emerald-400 -mx-5 -mt-5 mb-4"></div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-600 to-green-500 text-white flex items-center justify-center text-2xl font-extrabold shadow-md shadow-emerald-700/30">
                      👨‍💼
                    </div>
                    <div>
                      <h4 className="font-black text-base text-emerald-950">{c.name}</h4>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300 inline-block mt-0.5">
                        {c.role}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-white border border-emerald-200/90 space-y-1.5 text-xs text-slate-700">
                    <p>🎓 <strong>Bằng cấp:</strong> <span className="font-semibold text-emerald-900">{c.license}</span></p>
                    <p>⚽ <strong>Phụ trách:</strong> <span className="text-emerald-700 font-extrabold">{c.assignedTeam}</span></p>
                    <p>⏳ <strong>Kinh nghiệm:</strong> <span className="font-bold">{c.experienceYears} năm</span></p>
                    <p>📞 <strong>SĐT:</strong> <span className="font-mono">{c.phone}</span></p>
                    <p>✉️ <strong>Email:</strong> <span className="text-[11px] text-slate-500">{c.email}</span></p>
                  </div>

                  <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/60 text-[11px] text-emerald-900 font-medium border border-emerald-200/60">
                    🎯 <strong>Sở trường:</strong> {c.specialty}
                  </div>
                </div>

                {canManageClub && (
                  <div className="mt-4 pt-3 border-t-2 border-emerald-100 text-right">
                    <button
                      onClick={() => handleDeleteCoach(c.id)}
                      className="px-3 py-1 rounded-lg border border-rose-300 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-400 font-bold transition-all cursor-pointer"
                    >
                      Xóa HLV
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 4: QUẢN LÝ LỊCH TẬP ================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>📅</span> Quản Lý Lịch Tập Luyện & Kiểm Tra Trùng Sân
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lên kế hoạch tập luyện, cập nhật thời gian, sân bãi và tự động ngăn chặn xung đột trùng lịch
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleExportCSV(
                    'Lich_Tap_SaoVangFC',
                    ['Tiêu Đề', 'Đội Bóng', 'Phân Loại', 'Ngày', 'Bắt Đầu', 'Kết Thúc', 'Sân Tập', 'HLV', 'Ghi Chú'],
                    schedules.map((s) => [s.title, s.teamName, s.type, s.date, s.startTime, s.endTime, s.fieldName, s.coach, s.notes])
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
              >
                📥 Xuất File CSV
              </button>

              {canManage && (
                <button
                  onClick={() => setShowAddScheduleModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Tạo Buổi Tập Mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Schedules List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-3xl border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 hover:border-emerald-600 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 p-5 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Dải accent trên đỉnh */}
                <div className="h-2 bg-gradient-to-r from-[#022c22] via-emerald-600 to-emerald-400 -mx-5 -mt-5 mb-4"></div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300">
                      ⚽ {s.type}
                    </span>
                    <span className="text-xs text-emerald-800 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      📅 {s.date}
                    </span>
                  </div>

                  <h4 className="font-black text-lg text-emerald-950 leading-snug mt-1">{s.title}</h4>
                  <div className="text-xs font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
                    <span>🛡️</span> {s.teamName}
                  </div>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-800 bg-gradient-to-br from-emerald-50/90 to-white p-3.5 rounded-2xl border border-emerald-200/90">
                    <p className="flex items-center justify-between">
                      <span className="text-emerald-800 font-bold">⏰ Giờ tập:</span>
                      <strong className="text-slate-900 font-black">{s.startTime} - {s.endTime}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-emerald-800 font-bold">🏟️ Sân tập:</span>
                      <strong className="text-emerald-900 font-extrabold">{s.fieldName}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-emerald-800 font-bold">👤 HLV:</span>
                      <span className="text-slate-900 font-bold">{s.coach}</span>
                    </p>
                  </div>

                  {s.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 font-medium">
                      📌 <strong>Nội dung:</strong> {s.notes}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t-2 border-emerald-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                    Sẵn sàng tập luyện
                  </span>

                  {canManage && (
                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="px-3 py-1 rounded-lg border border-rose-300 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-400 font-bold transition-all cursor-pointer"
                    >
                      Hủy Lịch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 5: QUẢN LÝ ĐIỂM DANH ================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>✅</span> Quản Lý Điểm Danh & Chuyên Cần Buổi Tập
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ghi nhận tình trạng có mặt, đi muộn hoặc vắng phép của từng thành viên trong buổi tập
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleExportCSV(
                    'Diem_Danh_SaoVangFC',
                    ['Số Áo', 'Họ Tên', 'Vị Trí', 'Trạng Thái', 'Ghi Chú'],
                    attendance.map((a) => [a.jerseyNumber, a.memberName, a.position, a.status, a.note])
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
              >
                📥 Xuất File CSV
              </button>

              {canManage && (
                <button
                  onClick={() => alert('Đã lưu dữ liệu điểm danh thành công!')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  💾 Lưu Điểm Danh
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 text-center border-2 border-emerald-300 shadow-md">
              <span className="text-xs text-emerald-800 font-extrabold uppercase tracking-wide block">Tổng Quân Số</span>
              <strong className="text-2xl text-slate-900 font-black mt-1 block">{attendance.length}</strong>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border-2 border-emerald-400 bg-emerald-50/50 shadow-md">
              <span className="text-xs text-emerald-800 font-extrabold uppercase tracking-wide block">🟢 Có Mặt</span>
              <strong className="text-2xl text-emerald-700 font-black mt-1 block">{attendance.filter((a) => a.status === 'Có mặt').length}</strong>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border-2 border-amber-300 bg-amber-50/50 shadow-md">
              <span className="text-xs text-amber-800 font-extrabold uppercase tracking-wide block">🟡 Đến Muộn</span>
              <strong className="text-2xl text-amber-700 font-black mt-1 block">{attendance.filter((a) => a.status === 'Đến muộn').length}</strong>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border-2 border-rose-300 bg-rose-50/50 shadow-md">
              <span className="text-xs text-rose-800 font-extrabold uppercase tracking-wide block">🔴 Vắng Mặt</span>
              <strong className="text-2xl text-rose-700 font-black mt-1 block">{attendance.filter((a) => a.status.startsWith('Vắng')).length}</strong>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-3xl border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="green-table-header font-black uppercase tracking-wider border-b-2 border-emerald-700 text-white">
                  <tr>
                    <th className="p-4">Số Áo</th>
                    <th className="p-4">Cầu Thủ</th>
                    <th className="p-4">Vị Trí</th>
                    <th className="p-4">Trạng Thái Điểm Danh</th>
                    <th className="p-4">Ghi Chú Huấn Luyện Viên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 text-slate-700">
                  {attendance.map((item) => (
                    <tr key={item.id} className="odd:bg-white even:bg-emerald-50/30 hover:bg-emerald-100/60 transition-colors">
                      <td className="p-4 font-black text-emerald-800">#{item.jerseyNumber}</td>
                      <td className="p-4 font-extrabold text-slate-900 text-sm">{item.memberName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {item.position}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={item.status}
                          disabled={!canManage}
                          onChange={(e) => handleUpdateAttendance(item.id, e.target.value as any)}
                          className="bg-white border-2 border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 disabled:opacity-80 shadow-sm"
                        >
                          <option value="Có mặt">🟢 Có mặt</option>
                          <option value="Đến muộn">🟡 Đến muộn</option>
                          <option value="Vắng có phép">🔵 Vắng có phép</option>
                          <option value="Vắng không phép">🔴 Vắng không phép</option>
                        </select>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{item.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 6: QUẢN LÝ PHÍ SINH HOẠT & QUỸ ================= */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>💰</span> Quản Lý Phí Sinh Hoạt & Quỹ Câu Lạc Bộ
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi thu chi, đóng góp quỹ đội bóng, tiền thuê sân bãi và tiến độ nộp phí của từng thành viên
              </p>
            </div>

            {canManageClub && (
              <button
                onClick={() => setShowAddFinanceModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Ghi Nhận Thu / Chi Mới</span>
              </button>
            )}
          </div>

          {/* 3 KPI Finance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 bg-gradient-to-br from-white via-white to-emerald-50/70 relative overflow-hidden">
              <div className="h-2 bg-emerald-600 -mx-6 -mt-6 mb-4"></div>
              <span className="text-xs uppercase font-black text-emerald-800 tracking-wider flex items-center gap-1.5">
                <span>📈</span> Tổng Các Khoản Thu
              </span>
              <div className="mt-2 text-3xl font-black text-emerald-700 tracking-tight">{formatVND(totalIncome)}</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Bao gồm quỹ thành viên đóng góp & tài trợ</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-rose-300 shadow-xl shadow-rose-950/5 bg-gradient-to-br from-white via-white to-rose-50/50 relative overflow-hidden">
              <div className="h-2 bg-rose-500 -mx-6 -mt-6 mb-4"></div>
              <span className="text-xs uppercase font-black text-rose-800 tracking-wider flex items-center gap-1.5">
                <span>📉</span> Tổng Các Khoản Chi
              </span>
              <div className="mt-2 text-3xl font-black text-rose-700 tracking-tight">{formatVND(totalExpense)}</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Tiền thuê sân bãi, bóng tập, trang thiết bị</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-xl shadow-emerald-950/10 bg-gradient-to-br from-white via-white to-emerald-100/50 relative overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-700 to-green-500 -mx-6 -mt-6 mb-4"></div>
              <span className="text-xs uppercase font-black text-emerald-900 tracking-wider flex items-center gap-1.5">
                <span>💰</span> Số Dư Quỹ CLB Hiện Tại
              </span>
              <div className="mt-2 text-3xl font-black text-emerald-800 tracking-tight">{formatVND(currentBalance)}</div>
              <p className="text-xs text-emerald-800 mt-2 font-bold flex items-center gap-1">
                <span>✓</span> Đã có {paidMembersCount}/{members.length} thành viên hoàn thành nộp phí
              </p>
            </div>
          </div>

          {/* Transactions History */}
          <div className="bg-white rounded-3xl border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 overflow-hidden">
            <div className="p-4 bg-emerald-50/80 border-b-2 border-emerald-200 flex items-center justify-between">
              <h4 className="font-black text-sm text-emerald-950 flex items-center gap-2">
                <span>📜</span> Sổ Thu Chi Chi Tiết Câu Lạc Bộ
              </h4>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                {transactions.length} giao dịch gần nhất
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="green-table-header font-black uppercase tracking-wider border-b-2 border-emerald-700 text-white">
                  <tr>
                    <th className="p-4">Ngày</th>
                    <th className="p-4">Nội Dung Thu / Chi</th>
                    <th className="p-4">Phân Loại</th>
                    <th className="p-4 text-right">Số Tiền (VNĐ)</th>
                    <th className="p-4">Người Thực Hiện</th>
                    <th className="p-4">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 text-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-slate-500">{t.date}</td>
                      <td className="p-4 font-bold text-slate-900">{t.title}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            t.category === 'Thu'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.category === 'Thu' ? '↓ Khoản Thu' : '↑ Khoản Chi'}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-right font-extrabold text-sm ${
                          t.category === 'Thu' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {t.category === 'Thu' ? '+' : '-'}{formatVND(t.amount)}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{t.personInCharge}</td>
                      <td className="p-4 text-slate-500">{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 7: QUẢN LÝ THÔNG BÁO ================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>📢</span> Đăng Tải & Quản Lý Thông Báo Câu Lạc Bộ
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Phát đi các thông điệp, chỉ đạo thi đấu và thông tin quan trọng tới toàn bộ hoặc từng đội bóng
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setShowAddAnnouncementModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Tạo Thông Báo Mới</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {announcements.map((a) => {
              const isUrgent = a.priority === 'Khẩn cấp';
              const isImportant = a.priority === 'Quan trọng';

              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-3xl p-6 border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 border-l-8 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 ${
                    isUrgent ? 'border-l-rose-500' : isImportant ? 'border-l-amber-500' : 'border-l-emerald-600'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b-2 border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-black border ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isImportant
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isUrgent ? '🚨 ' : isImportant ? '⚡ ' : '📢 '}
                        {a.priority}
                      </span>
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Gửi đến: <strong className="text-emerald-950 font-black">{a.target}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span>👤 {a.author}</span>
                      <span>📅 {a.date}</span>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-black text-lg text-emerald-950 mt-3.5 tracking-tight">{a.title}</h4>
                  <p className="text-xs text-slate-800 mt-2.5 leading-relaxed bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-200/90 font-medium">
                    {a.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD TEAM ================= */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>🛡️</span> Thêm Đội Bóng Thuộc Câu Lạc Bộ
              </h3>
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tên Đội Bóng</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sao Vàng FC - Đội Nữ / Đội Trẻ U19..."
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cấp Độ / Phân Hạng</label>
                  <select
                    value={newTeam.level}
                    onChange={(e) => setNewTeam({ ...newTeam, level: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Đội hình 1 Chuyên nghiệp">Đội hình 1 Chuyên nghiệp</option>
                    <option value="Lứa tuổi U21 Đào tạo">Lứa tuổi U21 Đào tạo</option>
                    <option value="Lứa tuổi U17 Học viện">Lứa tuổi U17 Học viện</option>
                    <option value="Bóng đá trong nhà Futsal">Bóng đá trong nhà Futsal</option>
                    <option value="Đội Phong trào Doanh nghiệp">Đội Phong trào Doanh nghiệp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sân Tập Chính</label>
                  <input
                    type="text"
                    value={newTeam.homePitch}
                    onChange={(e) => setNewTeam({ ...newTeam, homePitch: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">HLV Phụ Trách</label>
                  <select
                    value={newTeam.headCoach}
                    onChange={(e) => setNewTeam({ ...newTeam, headCoach: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đội Trưởng</label>
                  <input
                    type="text"
                    placeholder="Tên đội trưởng..."
                    value={newTeam.captain}
                    onChange={(e) => setNewTeam({ ...newTeam, captain: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mô Tả & Mục Tiêu Của Đội</label>
                <textarea
                  rows={2}
                  placeholder="Mục tiêu thi đấu, lịch trình sinh hoạt..."
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu Đội Bóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD MEMBER ================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>🏃</span> Thêm Thành Viên / Cầu Thủ Mới
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Họ Và Tên</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A..."
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Áo</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={newMember.jerseyNumber}
                    onChange={(e) => setNewMember({ ...newMember, jerseyNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vị Trí Thi Đấu</label>
                  <select
                    value={newMember.position}
                    onChange={(e) => setNewMember({ ...newMember, position: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Thủ môn">Thủ môn</option>
                    <option value="Hậu vệ">Hậu vệ</option>
                    <option value="Tiền vệ">Tiền vệ</option>
                    <option value="Tiền đạo">Tiền đạo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đội Trực Thuộc</label>
                  <select
                    value={newMember.teamId}
                    onChange={(e) => setNewMember({ ...newMember, teamId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={newMember.dateOfBirth}
                    onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chiều Cao</label>
                  <input
                    type="text"
                    value={newMember.height}
                    onChange={(e) => setNewMember({ ...newMember, height: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cân Nặng</label>
                  <input
                    type="text"
                    value={newMember.weight}
                    onChange={(e) => setNewMember({ ...newMember, weight: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chân Thuận</label>
                  <select
                    value={newMember.preferredFoot}
                    onChange={(e) => setNewMember({ ...newMember, preferredFoot: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Chân phải">Chân phải</option>
                    <option value="Chân trái">Chân trái</option>
                    <option value="Cả hai chân">Cả hai chân</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Thêm Thành Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD COACH ================= */}
      {showAddCoachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>📋</span> Thêm & Phân Công Huấn Luyện Viên
              </h3>
              <button
                onClick={() => setShowAddCoachModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoach} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Họ Và Tên HLV</label>
                <input
                  type="text"
                  required
                  placeholder="HLV. Nguyễn Văn..."
                  value={newCoach.name}
                  onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chức Vụ</label>
                  <select
                    value={newCoach.role}
                    onChange={(e) => setNewCoach({ ...newCoach, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="HLV Trưởng CLB">HLV Trưởng CLB</option>
                    <option value="HLV Đội Trẻ">HLV Đội Trẻ</option>
                    <option value="HLV Thể Lực">HLV Thể Lực</option>
                    <option value="HLV Thủ Môn">HLV Thủ Môn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bằng Cấp Huấn Luyện</label>
                  <input
                    type="text"
                    value={newCoach.license}
                    onChange={(e) => setNewCoach({ ...newCoach, license: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phân Công Phụ Trách Đội</label>
                <select
                  value={newCoach.assignedTeam}
                  onChange={(e) => setNewCoach({ ...newCoach, assignedTeam: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={newCoach.phone}
                    onChange={(e) => setNewCoach({ ...newCoach, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={newCoach.email}
                    onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Chuyên Môn & Sở Trường Huấn Luyện</label>
                <textarea
                  rows={2}
                  placeholder="Phương pháp huấn luyện, sở trường chiến thuật..."
                  value={newCoach.specialty}
                  onChange={(e) => setNewCoach({ ...newCoach, specialty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCoachModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu Huấn Luyện Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ADD SCHEDULE ================= */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>📅</span> Lên Lịch Huấn Luyện Mới
              </h3>
              <button
                onClick={() => setShowAddScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Real-time Conflict Alert Box */}
            {scheduleConflict && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold">
                {scheduleConflict}
              </div>
            )}

            <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tiêu Đề Giáo Án</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rèn luyện phối hợp bóng ngắn và sút phạt..."
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đội Tham Gia</label>
                  <select
                    value={newSchedule.teamName}
                    onChange={(e) => setNewSchedule({ ...newSchedule, teamName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phân Loại</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tập chiến thuật">Tập chiến thuật</option>
                    <option value="Tập thể lực">Tập thể lực</option>
                    <option value="Đấu tập nội bộ">Đấu tập nội bộ</option>
                    <option value="Thi đấu giao hữu">Thi đấu giao hữu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ngày Tập</label>
                  <input
                    type="date"
                    required
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Giờ Bắt Đầu</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Giờ Kết Thúc</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sân Tập</label>
                  <select
                    value={newSchedule.fieldName}
                    onChange={(e) => setNewSchedule({ ...newSchedule, fieldName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Sân bóng Sao Vàng A (Sân 7)">Sân bóng Sao Vàng A (Sân 7)</option>
                    <option value="Sân bóng Sao Vàng B (Sân 11)">Sân bóng Sao Vàng B (Sân 11)</option>
                    <option value="Sân trong nhà Futsal Arena">Sân trong nhà Futsal Arena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">HLV Phụ Trách</label>
                  <select
                    value={newSchedule.coach}
                    onChange={(e) => setNewSchedule({ ...newSchedule, coach: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nội Dung & Lưu Ý Buổi Tập</label>
                <textarea
                  rows={2}
                  placeholder="Khởi động, chia đội, trang phục thi đấu..."
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu Lịch Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: ADD FINANCE TRANSACTION ================= */}
      {showAddFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>💰</span> Ghi Nhận Khoản Thu / Chi Quỹ CLB
              </h3>
              <button
                onClick={() => setShowAddFinanceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nội Dung Thu / Chi</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mua nước khoáng giải khát, tiền tài trợ giải..."
                  value={newTransaction.title}
                  onChange={(e) => setNewTransaction({ ...newTransaction, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phân Loại Giao Dịch</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Thu">↓ Khoản Thu (Đóng quỹ, Tài trợ...)</option>
                    <option value="Chi">↑ Khoản Chi (Sân bãi, Nước, Y tế...)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Tiền (VNĐ)</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Người Phụ Trách Thực Hiện</label>
                <input
                  type="text"
                  value={newTransaction.personInCharge}
                  onChange={(e) => setNewTransaction({ ...newTransaction, personInCharge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ghi Chú & Hóa Đơn Chứng Từ</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú hóa đơn số..."
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFinanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: ADD ANNOUNCEMENT ================= */}
      {showAddAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>📢</span> Đăng Tải Thông Báo Mới
              </h3>
              <button
                onClick={() => setShowAddAnnouncementModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tiêu Đề Thông Báo</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề thông báo..."
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đối Tượng Nhận</label>
                  <select
                    value={newAnnouncement.target}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Toàn bộ câu lạc bộ">Toàn bộ câu lạc bộ</option>
                    <option value="Sao Vàng FC - Đội 1">Sao Vàng FC - Đội 1</option>
                    <option value="Tuyển Trẻ U21">Tuyển Trẻ U21</option>
                    <option value="Ban Huấn Luyện">Ban Huấn Luyện</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mức Độ Ưu Tiên</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Quan trọng">Quan trọng</option>
                    <option value="Khẩn cấp">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nội Dung Chi Tiết</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nội dung truyền đạt tới các thành viên..."
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Phát Thông Báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: VIEW MEMBER DETAILS ================= */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                  #{selectedMember.jerseyNumber}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedMember.name}</h3>
                  <p className="text-xs text-emerald-700 font-bold">{selectedMember.position} • {selectedMember.teamName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700">
              <p>📞 <strong>Điện thoại:</strong> {selectedMember.phone}</p>
              <p>🎂 <strong>Ngày sinh:</strong> {selectedMember.dateOfBirth}</p>
              <p>📏 <strong>Chiều cao:</strong> {selectedMember.height}</p>
              <p>⚖️ <strong>Cân nặng:</strong> {selectedMember.weight}</p>
              <p>👟 <strong>Chân thuận:</strong> {selectedMember.preferredFoot}</p>
              <p>🩺 <strong>Tình trạng:</strong> <span className="font-bold text-emerald-700">{selectedMember.status}</span></p>
              <p>💰 <strong>Phí sinh hoạt tháng:</strong> {selectedMember.feePaidMonth ? '🟢 Đã nộp đủ' : '🔴 Chưa đóng'}</p>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MasterDashboard() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Đang tải hệ thống quản lý Sao Vàng FC...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
