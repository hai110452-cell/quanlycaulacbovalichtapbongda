'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { api } from '@/services/api';
import { exportToCSV, printReport } from '@/lib/exportUtils';

// ==========================================
// MOCK INITIAL DATA FOR 7 MODULES
// ==========================================

// Phí sinh hoạt cầu thủ theo tháng & năm
export interface PlayerFeeItem {
  id: string;
  playerId: string;
  playerName?: string;
  jerseyNumber?: number;
  position?: string;
  year: number;
  month: number;
  status: 'paid' | 'unpaid' | 'exempt';
  amount: number;
  paidDate?: string;
  paymentMethod?: string;
  receiptNo?: string;
  notes?: string;
}

const generateDefaultPlayerFees = (mList: ClubMember[]): PlayerFeeItem[] => {
  const fees: PlayerFeeItem[] = [];
  const years = [2025, 2026];
  for (const m of mList) {
    for (const year of years) {
      for (let month = 1; month <= 12; month++) {
        let status: 'paid' | 'unpaid' | 'exempt' = 'paid';
        let paidDate: string | undefined = `${year}-${String(month).padStart(2, '0')}-10`;
        let paymentMethod: string | undefined = 'Chuyển khoản';
        let receiptNo: string | undefined = `REC-${year}${String(month).padStart(2, '0')}-${m.id.slice(-3)}`;

        if (year === 2026) {
          const charCode = m.id.charCodeAt(m.id.length - 1);
          const seed = (charCode + month) % 10;
          if (month <= 9) {
            status = seed === 0 ? 'unpaid' : 'paid';
          } else if (month === 10) {
            status = seed <= 2 ? 'unpaid' : 'paid';
          } else if (month === 11) {
            status = seed <= 4 ? 'unpaid' : 'paid';
          } else {
            status = seed === 9 ? 'paid' : 'unpaid';
          }
          if (status !== 'paid') {
            paidDate = undefined;
            paymentMethod = undefined;
            receiptNo = undefined;
          }
        }

        fees.push({
          id: `fee-${m.id}-${year}-${month}`,
          playerId: m.id,
          playerName: m.name,
          jerseyNumber: m.jerseyNumber,
          position: m.position,
          year,
          month,
          status,
          amount: 300000,
          paidDate,
          paymentMethod,
          receiptNo,
        });
      }
    }
  }
  return fees;
};

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
    jerseyNumber: 15,
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
    jerseyNumber: 2,
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
    jerseyNumber: 28,
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
  status?: 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã hoàn thành' | 'Đã hủy' | string;
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

// 8. Quản Lý Demo Sân & Đặt Sân Trực Tuyến Cho Khách Hàng
export interface FieldDemoFacility {
  id: string;
  name: string;
  type: string;
  surface: string;
  location: string;
  image: string;
  badge: string;
  distance: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  priceDisplay: string;
  dayPrice: number;
  nightPrice: number;
  capacity: string;
  specs: string[];
}

export interface FieldBookingSlot {
  id: string;
  fieldId: string;
  fieldName: string;
  bookingDate: string;
  slotId: string;
  slotTime: string;
  slotLabel: string;
  price: number;
  isBooked: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  teamName?: string | null;
  services?: string | null;
  notes?: string | null;
}

export const initialFieldFacilities: FieldDemoFacility[] = [
  {
    id: 'field-c1',
    name: 'Sân bóng C1 (Cụm 2 Sân Cỏ Nhân Tạo)',
    type: 'Cụm 2 sân bóng đá mini cỏ nhân tạo tiêu chuẩn',
    surface: 'Mặt cỏ nhân tạo cao cấp & Hệ thống đèn chiếu sáng đêm',
    location: '1B Y Ngông, Tân Tiến, Buôn Ma Thuột',
    image: '/san-c1.jpg',
    badge: '⭐ SÂN BÓNG ĐÁ C1 • 2 SÂN ĐẠT CHUẨN',
    distance: 'Trung tâm Buôn Ma Thuột',
    rating: 5,
    reviewCount: 320,
    tags: ['2 SAN CO NHAN TAO', 'DEN CHIEU SANG', '0983 830 955', '0906 424 006', 'THUE BONG', 'NUOC LOC'],
    priceDisplay: '250.000 – 350.000 đ / GIỜ',
    dayPrice: 250000,
    nightPrice: 350000,
    capacity: 'Cụm 2 sân mini đạt chuẩn',
    specs: [
      'Địa điểm: 1B Y Ngông, Tân Tiến, Buôn Ma Thuột',
      'Hotline đặt sân & hỗ trợ 24/7: 0983 830 955 / 0906 424 006',
      'Quy mô cơ sở: Cụm 2 sân bóng đá mini cỏ nhân tạo đạt chuẩn thi đấu',
      'Giờ hoạt động của sân: Thứ 2 – Chủ nhật: 24/24 (Mở cửa liên tục cả ngày lẫn đêm, kể cả Ngày Lễ)',
      'Giá thuê theo giờ: 250.000 – 350.000 VNĐ / giờ (Ban ngày: 250.000đ • Khung giờ tối có đèn: 350.000đ)',
      'Hệ thống dàn đèn LED cao áp công suất lớn chiếu sáng rực rỡ toàn bộ 2 sân ban đêm',
      'Khu vực khán đài, hàng ghế chờ thoáng mát cho cầu thủ và cổ động viên',
      'Cung cấp bóng thi đấu tiêu chuẩn, áo bib phân đội 2 màu, nước khoáng đầy đủ',
      'Phòng thay đồ sạch sẽ, bãi đỗ xe máy & ô tô rộng rãi, an ninh đảm bảo chu đáo',
    ],
  },
];

export const initialFieldBookingSlots: FieldBookingSlot[] = [
  {
    id: 'fb-c1-1',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-1',
    slotTime: '07:00 - 08:00',
    slotLabel: 'Ca 1 (Sáng sớm - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-2',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 2)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-2',
    slotTime: '08:00 - 09:00',
    slotLabel: 'Ca 2 (Sáng - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-3',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-3',
    slotTime: '09:00 - 10:00',
    slotLabel: 'Ca 3 (Sáng - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-4',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 2)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-4',
    slotTime: '10:00 - 11:00',
    slotLabel: 'Ca 4 (Trưa - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-5',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-5',
    slotTime: '11:00 - 12:00',
    slotLabel: 'Ca 5 (Trưa - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-6',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-6',
    slotTime: '14:00 - 15:00',
    slotLabel: 'Ca 6 (Đầu chiều - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-7',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 2)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-7',
    slotTime: '15:00 - 16:00',
    slotLabel: 'Ca 7 (Chiều - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-8',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-8',
    slotTime: '16:00 - 17:00',
    slotLabel: 'Ca 8 (Chiều - Ngày)',
    price: 250000,
    isBooked: false,
  },
  {
    id: 'fb-c1-9',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 2)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-9',
    slotTime: '17:00 - 18:00',
    slotLabel: 'Ca 9 (Chiều muộn bật đèn)',
    price: 350000,
    isBooked: false,
  },
  {
    id: 'fb-c1-10',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-10',
    slotTime: '18:00 - 19:00',
    slotLabel: 'Ca 10 (Giờ vàng tối có đèn)',
    price: 350000,
    isBooked: true,
    customerName: 'Trần Văn Nam',
    customerPhone: '0983 830 955',
    teamName: 'FC Buôn Ma Thuột',
    services: 'Thuê bóng thi đấu + Nước khoáng',
    notes: 'Trận giao hữu phong trào Sân C1',
  },
  {
    id: 'fb-c1-11',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 2)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-11',
    slotTime: '19:00 - 20:00',
    slotLabel: 'Ca 11 (Giờ vàng tối có đèn)',
    price: 350000,
    isBooked: true,
    customerName: 'Nguyễn Quốc Cường',
    customerPhone: '0906 424 006',
    teamName: 'FC Anh Em Tân Tiến',
    services: 'Áo bib + Nước giải khát',
    notes: 'Thi đấu giao lưu Sân C1',
  },
  {
    id: 'fb-c1-12',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 1)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-12',
    slotTime: '20:00 - 21:00',
    slotLabel: 'Ca 12 (Tối muộn bật đèn)',
    price: 350000,
    isBooked: false,
  },
  {
    id: 'fb-c1-13',
    fieldId: 'field-c1',
    fieldName: 'Sân bóng C1 (Sân 2)',
    bookingDate: '2026-11-01',
    slotId: 'slot-c1-13',
    slotTime: '21:00 - 22:00',
    slotLabel: 'Ca 13 (Đêm muộn có đèn)',
    price: 350000,
    isBooked: false,
  },
];

export const standardFacilitySlots: Record<string, { slotId: string; slotTime: string; slotLabel: string; price: number }[]> = {
  'field-c1': [
    { slotId: 'slot-c1-1', slotTime: '07:00 - 08:00', slotLabel: 'Ca 1 (Sáng sớm - Ngày)', price: 250000 },
    { slotId: 'slot-c1-2', slotTime: '08:00 - 09:00', slotLabel: 'Ca 2 (Sáng - Ngày)', price: 250000 },
    { slotId: 'slot-c1-3', slotTime: '09:00 - 10:00', slotLabel: 'Ca 3 (Sáng - Ngày)', price: 250000 },
    { slotId: 'slot-c1-4', slotTime: '10:00 - 11:00', slotLabel: 'Ca 4 (Trưa - Ngày)', price: 250000 },
    { slotId: 'slot-c1-5', slotTime: '11:00 - 12:00', slotLabel: 'Ca 5 (Trưa - Ngày)', price: 250000 },
    { slotId: 'slot-c1-6', slotTime: '14:00 - 15:00', slotLabel: 'Ca 6 (Đầu chiều - Ngày)', price: 250000 },
    { slotId: 'slot-c1-7', slotTime: '15:00 - 16:00', slotLabel: 'Ca 7 (Chiều - Ngày)', price: 250000 },
    { slotId: 'slot-c1-8', slotTime: '16:00 - 17:00', slotLabel: 'Ca 8 (Chiều - Ngày)', price: 250000 },
    { slotId: 'slot-c1-9', slotTime: '17:00 - 18:00', slotLabel: 'Ca 9 (Chiều muộn bật đèn)', price: 350000 },
    { slotId: 'slot-c1-10', slotTime: '18:00 - 19:00', slotLabel: 'Ca 10 (Giờ vàng tối có đèn)', price: 350000 },
    { slotId: 'slot-c1-11', slotTime: '19:00 - 20:00', slotLabel: 'Ca 11 (Giờ vàng tối có đèn)', price: 350000 },
    { slotId: 'slot-c1-12', slotTime: '20:00 - 21:00', slotLabel: 'Ca 12 (Tối muộn bật đèn)', price: 350000 },
    { slotId: 'slot-c1-13', slotTime: '21:00 - 22:00', slotLabel: 'Ca 13 (Đêm muộn có đèn)', price: 350000 },
  ],
  'field-mydinh': [
    { slotId: 'slot-md-1', slotTime: '07:00 - 08:00', slotLabel: 'Ca 1 (Sáng sớm - Ngày)', price: 250000 },
    { slotId: 'slot-md-2', slotTime: '08:00 - 09:00', slotLabel: 'Ca 2 (Sáng - Ngày)', price: 250000 },
    { slotId: 'slot-md-3', slotTime: '09:00 - 10:00', slotLabel: 'Ca 3 (Sáng - Ngày)', price: 250000 },
    { slotId: 'slot-md-4', slotTime: '10:00 - 11:00', slotLabel: 'Ca 4 (Trưa - Ngày)', price: 250000 },
    { slotId: 'slot-md-5', slotTime: '11:00 - 12:00', slotLabel: 'Ca 5 (Trưa - Ngày)', price: 250000 },
    { slotId: 'slot-md-6', slotTime: '14:00 - 15:00', slotLabel: 'Ca 6 (Đầu chiều - Ngày)', price: 250000 },
    { slotId: 'slot-md-7', slotTime: '15:00 - 16:00', slotLabel: 'Ca 7 (Chiều - Ngày)', price: 250000 },
    { slotId: 'slot-md-8', slotTime: '16:00 - 17:00', slotLabel: 'Ca 8 (Chiều - Ngày)', price: 250000 },
    { slotId: 'slot-md-9', slotTime: '17:00 - 18:00', slotLabel: 'Ca 9 (Chiều muộn bật đèn)', price: 350000 },
    { slotId: 'slot-md-10', slotTime: '18:00 - 19:00', slotLabel: 'Ca 10 (Giờ vàng tối có đèn)', price: 350000 },
    { slotId: 'slot-md-11', slotTime: '19:00 - 20:00', slotLabel: 'Ca 11 (Giờ vàng tối có đèn)', price: 350000 },
    { slotId: 'slot-md-12', slotTime: '20:00 - 21:00', slotLabel: 'Ca 12 (Tối muộn bật đèn)', price: 350000 },
    { slotId: 'slot-md-13', slotTime: '21:00 - 22:00', slotLabel: 'Ca 13 (Đêm muộn có đèn)', price: 350000 },
  ],
};

// ==========================================
// MAIN COMPONENT: MASTER DASHBOARD 7 MODULES
// ==========================================
function DashboardContent() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const searchParams = useSearchParams();

  // Active Tab: Trang Chủ, Tìm Sân, Lịch Đặt Sân, Liên Hệ + Các module nội bộ (Admin)
  type TabType = 'home' | 'fields' | 'booking-schedule' | 'contact' | 'teams' | 'members' | 'coaches' | 'schedules' | 'attendance' | 'finances' | 'announcements' | 'results' | 'about';
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['home', 'fields', 'booking-schedule', 'contact', 'teams', 'members', 'coaches', 'schedules', 'attendance', 'finances', 'announcements', 'results', 'about'].includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('home');
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
    finances: number;
  }>({ teams: 0, players: 0, schedules: 0, attendances: 0, notifications: 0, users: 0, finances: 0 });

  // Nạp dữ liệu trực tiếp từ Neon Cloud PostgreSQL thông qua Next.js API nội bộ
  const loadNeonDatabase = async () => {
    setIsLoadingNeon(true);
    try {
      const [teamsRes, playersRes, schedulesRes, attendancesRes, notifsRes, usersRes, financesRes, feesRes, bookingsRes] = await Promise.all([
        api.getTeams().catch(() => null),
        api.getPlayers().catch(() => null),
        api.getSchedules().catch(() => null),
        api.getAttendances().catch(() => null),
        api.getNotifications().catch(() => null),
        api.getUsers().catch(() => null),
        api.getFinances().catch(() => null),
        api.getPlayerFees().catch(() => null),
        api.getFieldBookings().catch(() => null),
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
        const playerMap = new Map<string, any>();
        if (playersRes && Array.isArray(playersRes.data)) {
          playersRes.data.forEach((p: any) => {
            playerMap.set(p.id, p);
            playerMap.set(p.name, p);
          });
        }
        const mappedAttendance: AttendanceItem[] = attendancesRes.data.map((a: any, idx: number) => {
          let st: AttendanceItem['status'] = 'Có mặt';
          if (['Có mặt', 'Vắng có phép', 'Vắng không phép', 'Đến muộn'].includes(a.status)) {
            st = a.status;
          }
          const matchedPlayer = playerMap.get(a.playerId) || playerMap.get(a.playerName);
          return {
            id: a.id || `att-${idx + 1}`,
            memberId: a.playerId || `mem-${idx + 1}`,
            memberName: a.playerName || (matchedPlayer ? matchedPlayer.name : 'Cầu thủ Sao Vàng FC'),
            jerseyNumber: matchedPlayer ? matchedPlayer.jerseyNumber : (a.jerseyNumber || (idx + 1)),
            position: matchedPlayer ? matchedPlayer.position : (a.position || 'Tiền vệ'),
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

      // 6. Quản lý Thu chi & Quỹ CLB từ Neon DB
      if (financesRes && Array.isArray(financesRes.data) && financesRes.data.length > 0) {
        hasNeonData = true;
        const mappedFinances: FinanceTransaction[] = financesRes.data.map((f: any) => ({
          id: f.id,
          date: f.date,
          title: f.title,
          category: f.category === 'Chi' ? 'Chi' : 'Thu',
          amount: Number(f.amount) || 0,
          personInCharge: f.personInCharge || f.person_in_charge || 'Thủ quỹ CLB',
          notes: f.notes || '',
        }));
        setTransactions(mappedFinances);
      }

      // 7. Chi phí & thu phí cầu thủ hàng tháng/năm từ Neon DB
      if (feesRes && Array.isArray(feesRes.data) && feesRes.data.length > 0) {
        hasNeonData = true;
        setPlayerFees(feesRes.data);
      }

      // 8. Quản lý ca đặt sân & demo sân bóng từ Neon DB
      if (bookingsRes && Array.isArray(bookingsRes.data) && bookingsRes.data.length > 0) {
        hasNeonData = true;
        setFieldBookings(bookingsRes.data);
      }

      setIsNeonConnected(hasNeonData);
      setNeonStats({
        teams: (teamsRes?.data?.length) || 0,
        players: (playersRes?.data?.length) || 0,
        schedules: (schedulesRes?.data?.length) || 0,
        attendances: (attendancesRes?.data?.length) || 0,
        notifications: (notifsRes?.data?.length) || 0,
        users: (usersRes?.data?.length) || 0,
        finances: (financesRes?.data?.length) || 0,
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

  // 6. Quản Lý Chi Phí Cầu Thủ Hàng Tháng & Hàng Năm
  const [playerFees, setPlayerFees] = useState<PlayerFeeItem[]>(() => generateDefaultPlayerFees(initialMembers));
  const [selectedFeeYear, setSelectedFeeYear] = useState<number>(2026);
  const [selectedFeeMonth, setSelectedFeeMonth] = useState<number | 'all'>('all');
  const [feeTeamFilter, setFeeTeamFilter] = useState<string>('Tất cả');
  const [feeSearch, setFeeSearch] = useState<string>('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'exempt'>('all');
  const [financeSubTab, setFinanceSubTab] = useState<'player-fees' | 'ledger' | 'reports'>('player-fees');
  const [payFeeTarget, setPayFeeTarget] = useState<{
    member: ClubMember;
    month: number;
    year: number;
    amount: number;
    paymentMethod: string;
    notes: string;
  } | null>(null);
  const [selectedFeePlayer, setSelectedFeePlayer] = useState<ClubMember | null>(null);

  // 8. Quản Lý Demo Sân & Đặt Sân Trực Tuyến Cho Khách Hàng (Sân vận động Quốc gia Mỹ Đình)
  const [fieldFacilities] = useState<FieldDemoFacility[]>(initialFieldFacilities);
  const [fieldBookings, setFieldBookings] = useState<FieldBookingSlot[]>(initialFieldBookingSlots);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>('2026-11-01');
  const [bookingFieldFilter, setBookingFieldFilter] = useState<string>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [bookingTargetSlot, setBookingTargetSlot] = useState<FieldBookingSlot | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [customerBookingForm, setCustomerBookingForm] = useState<{
    customerName: string;
    customerPhone: string;
    teamName: string;
    needWater: boolean;
    needRef: boolean;
    needBibs: boolean;
    notes: string;
  }>({
    customerName: '',
    customerPhone: '',
    teamName: '',
    needWater: false,
    needRef: false,
    needBibs: false,
    notes: '',
  });
  const [bookingSuccessReceipt, setBookingSuccessReceipt] = useState<{
    receiptCode: string;
    slot: FieldBookingSlot;
    customerName: string;
    customerPhone: string;
    teamName: string;
    totalAmount: number;
    services: string[];
    bookedAt: string;
  } | null>(null);

  // Customer & Field States (Tìm sân, Đánh giá, Liên hệ, Yêu thích)
  const [favoriteFields, setFavoriteFields] = useState<string[]>(['field-c1']);
  const toggleFavoriteField = (id: string) => {
    setFavoriteFields((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [fieldLocationFilter, setFieldLocationFilter] = useState('all');

  // Đánh giá của khách hàng (Reviews) cho Sân bóng C1
  const [customerReviews, setCustomerReviews] = useState<{
    id: string;
    customerName: string;
    teamName: string;
    fieldName: string;
    rating: number;
    date: string;
    content: string;
    avatar: string;
    likes: number;
  }[]>([
    {
      id: 'rev-1',
      customerName: 'Trần Văn Nam',
      teamName: 'FC Sân C1 All Stars',
      fieldName: 'Sân bóng C1',
      rating: 5,
      date: '2026-10-31',
      content: 'Mặt cỏ nhân tạo tại Sân C1 rất êm ái, bám giày và không bị trơn trượt. Hệ thống dàn đèn cao áp ban đêm sáng rực rỡ như ban ngày, thi đấu cực kỳ hưng phấn!',
      avatar: '⚽',
      likes: 38,
    },
    {
      id: 'rev-2',
      customerName: 'Nguyễn Quốc Cường',
      teamName: 'FC Doanh Nghiệp C1',
      fieldName: 'Sân bóng C1',
      rating: 5,
      date: '2026-10-28',
      content: 'Không gian Sân C1 thoáng đãng, kích thước sân 7 chuẩn đá rất thoải mái. Ban quản lý thân thiện, đặt sân online nhận phiếu xác nhận ngay tức thì.',
      avatar: '👨‍💼',
      likes: 29,
    },
    {
      id: 'rev-3',
      customerName: 'Lê Hoàng Hải',
      teamName: 'FC Anh Em Phong Trào',
      fieldName: 'Sân bóng C1',
      rating: 5,
      date: '2026-10-25',
      content: 'Ban quản lý Sân C1 hỗ trợ nhiệt tình, áo bib 2 màu chia đội và bóng thi đấu mới tinh. Giá thuê chỉ 20.000 đ/giờ cực kỳ ưu đãi cho anh em đam mê bóng đá.',
      avatar: '🏃',
      likes: 21,
    },
    {
      id: 'rev-4',
      customerName: 'Võ Minh Tiến',
      teamName: 'CLB Cựu Cầu Thủ',
      fieldName: 'Sân bóng C1',
      rating: 5,
      date: '2026-10-20',
      content: 'Bãi đỗ xe máy và ô tô tại Sân C1 rất rộng rãi và an toàn, có bảo vệ trông xe. Hệ thống thoát nước tốt nên dù trời vừa mưa xong vẫn đá bình thường.',
      avatar: '⚡',
      likes: 17,
    },
  ]);

  const [newReviewForm, setNewReviewForm] = useState({
    customerName: '',
    teamName: '',
    fieldName: 'Sân bóng C1',
    rating: 5,
    content: '',
  });

  // Liên hệ khách hàng (Contact)
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    fieldInterest: 'Sân bóng C1',
    message: '',
  });
  const [contactSuccess, setContactSuccess] = useState(false);

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

    const tName = newTeam.name.trim();
    const dupTeam = teams.find((t) => t.name.trim().toLowerCase() === tName.toLowerCase());
    if (dupTeam) {
      alert(`❌ LỖI TRÙNG DỮ LIỆU: Đội bóng "${tName}" đã tồn tại! Vui lòng chọn tên khác.`);
      return;
    }

    const team: ClubTeam = {
      id: `team-${Date.now()}`,
      name: tName,
      level: newTeam.level,
      headCoach: newTeam.headCoach,
      captain: newTeam.captain || 'Chưa chỉ định',
      memberCount: Number(newTeam.memberCount) || 0,
      homePitch: newTeam.homePitch,
      establishedYear: 2026,
      description: newTeam.description || 'Đội bóng thuộc biên chế CLB Sao Vàng FC',
      status: 'Hoạt động',
    };

    try {
      await api.addTeam(team);
      setTeams([...teams, team]);
      addNotification('Thành lập đội bóng mới', `CLB vừa phê duyệt thành lập đội "${team.name}".`, 'new');
      setShowAddTeamModal(false);
      setNewTeam({ name: '', level: 'Đội hình 1 Chuyên nghiệp', headCoach: 'HLV. Nguyễn Văn Huấn', captain: '', memberCount: 15, homePitch: 'Sân bóng Sao Vàng A (Sân 7)', description: '' });
      loadNeonDatabase();
    } catch (err: any) {
      console.warn('Lỗi lưu đội bóng vào Neon DB:', err);
      alert(`❌ LỖI: ${err.message || 'Không thể tạo đội bóng do trùng dữ liệu hoặc lỗi máy chủ'}`);
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

    const jNum = Number(newMember.jerseyNumber);
    const nameClean = newMember.name.trim();
    const phoneClean = (newMember.phone || '').trim();

    // 1. Kiểm tra trùng số áo
    const dupJersey = members.find((m) => m.jerseyNumber === jNum);
    if (dupJersey) {
      alert(`❌ LỖI TRÙNG DỮ LIỆU: Số áo #${jNum} đã được đăng ký cho cầu thủ "${dupJersey.name}" (${dupJersey.teamName})!\nVui lòng chọn số áo khác.`);
      return;
    }

    // 2. Kiểm tra trùng họ tên
    const dupName = members.find((m) => m.name.trim().toLowerCase() === nameClean.toLowerCase());
    if (dupName) {
      alert(`❌ LỖI TRÙNG DỮ LIỆU: Cầu thủ mang tên "${nameClean}" đã có trong danh sách (${dupName.teamName})!\nVui lòng kiểm tra lại.`);
      return;
    }

    // 3. Kiểm tra trùng số điện thoại
    if (phoneClean) {
      const dupPhone = members.find((m) => m.phone && m.phone.trim() === phoneClean);
      if (dupPhone) {
        alert(`❌ LỖI TRÙNG DỮ LIỆU: Số điện thoại "${phoneClean}" đã thuộc về cầu thủ "${dupPhone.name}"!\nVui lòng kiểm tra lại.`);
        return;
      }
    }

    const targetTeam = teams.find((t) => t.id === newMember.teamId);
    const member: ClubMember = {
      id: `player-${Date.now()}`,
      name: nameClean,
      jerseyNumber: jNum,
      position: newMember.position,
      teamId: newMember.teamId,
      teamName: targetTeam ? targetTeam.name : 'Sao Vàng FC - Đội 1',
      phone: phoneClean || '0900000000',
      dateOfBirth: newMember.dateOfBirth,
      height: newMember.height,
      weight: newMember.weight,
      preferredFoot: newMember.preferredFoot,
      status: 'Đang tập luyện',
      feePaidMonth: false,
    };

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
      setMembers([member, ...members]);
      addNotification('Thành viên mới gia nhập', `Cầu thủ ${member.name} (#${member.jerseyNumber}) vừa gia nhập ${member.teamName}.`, 'new');
      setShowAddMemberModal(false);
      setNewMember({ name: '', jerseyNumber: 9, position: 'Tiền đạo', teamId: 'team-1', phone: '', dateOfBirth: '2000-01-01', height: '1m78', weight: '72kg', preferredFoot: 'Chân phải' });
      loadNeonDatabase();
    } catch (err: any) {
      console.warn('Lỗi lưu cầu thủ vào Neon DB:', err);
      alert(`❌ LỖI: ${err.message || 'Không thể lưu do trùng dữ liệu hoặc lỗi kết nối'}`);
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
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  const handleUpdateAttendance = async (id: string, newStatus: AttendanceItem['status']) => {
    if (!canManage) return;
    const updated = attendance.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setAttendance(updated);

    // Tự động lưu ngay vào Neon DB khi thay đổi lựa chọn (F5 không bị mất)
    try {
      const item = updated.find((a) => a.id === id);
      if (item) {
        await api.saveAttendances([
          {
            id: item.id,
            playerId: item.memberId,
            playerName: item.memberName,
            status: item.status,
            note: item.note || '',
            scheduleId: 'sched-001',
          },
        ]);
      }
    } catch (err) {
      console.warn('Lỗi tự động lưu điểm danh vào Neon DB:', err);
    }
  };

  const handleSaveAttendance = async () => {
    if (!canManage) return;
    setIsSavingAttendance(true);
    try {
      const records = attendance.map((a) => ({
        id: a.id,
        playerId: a.memberId,
        playerName: a.memberName,
        status: a.status,
        note: a.note || '',
        scheduleId: 'sched-001',
      }));
      await api.saveAttendances(records);
      addNotification('Điểm danh thành công', `Đã đồng bộ tình trạng điểm danh của ${records.length} cầu thủ vào Neon DB.`, 'new');
      alert('✅ ĐÃ LƯU DỮ LIỆU ĐIỂM DANH THÀNH CÔNG VÀO NEON DATABASE!');
      await loadNeonDatabase();
    } catch (err: any) {
      console.warn('Lỗi lưu điểm danh vào Neon DB:', err);
      alert(`❌ Lỗi lưu dữ liệu: ${err.message || 'Không thể kết nối máy chủ'}`);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // 6. Handlers for Finances (Chi phí & Quỹ)
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.title || newTransaction.amount <= 0) return;
    const trans: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: newTransaction.title.trim(),
      category: newTransaction.category,
      amount: Number(newTransaction.amount),
      personInCharge: newTransaction.personInCharge || 'Thủ quỹ CLB',
      notes: newTransaction.notes || '',
    };

    try {
      await api.addFinance(trans);
      setTransactions([trans, ...transactions]);
      addNotification('Giao dịch quỹ câu lạc bộ', `Ghi nhận khoản ${trans.category}: "${trans.title}" số tiền ${formatVND(trans.amount)}.`, 'new');
      setShowAddFinanceModal(false);
      setNewTransaction({ title: '', category: 'Thu', amount: 1000000, personInCharge: 'Thủ quỹ CLB', notes: '' });
      loadNeonDatabase();
    } catch (err: any) {
      console.warn('Lỗi lưu giao dịch vào Neon DB:', err);
      alert(`❌ LỖI: ${err.message || 'Không thể lưu giao dịch vào database'}`);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!canManage) return;
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi thu/chi này khỏi hệ thống?')) {
      setTransactions(transactions.filter((t) => t.id !== id));
      try {
        await api.deleteFinance(id);
      } catch (err) {
        console.warn('Lỗi xóa giao dịch khỏi Neon DB:', err);
      }
    }
  };

  // 6.1 Handlers for Player Monthly & Yearly Fees (Chi phí / Thu phí cầu thủ)
  const handleToggleFeeStatus = async (playerId: string, year: number, month: number) => {
    if (!canManage) return;
    const existing = playerFees.find((f) => f.playerId === playerId && f.year === year && f.month === month);
    const newStatus: 'paid' | 'unpaid' = existing?.status === 'paid' ? 'unpaid' : 'paid';
    const member = members.find((m) => m.id === playerId);
    const today = new Date().toISOString().split('T')[0];
    const receipt = `REC-${year}${String(month).padStart(2, '0')}-${playerId.slice(-3)}`;

    const updatedList = playerFees.map((f) => {
      if (f.playerId === playerId && f.year === year && f.month === month) {
        return {
          ...f,
          status: newStatus,
          paidDate: newStatus === 'paid' ? today : undefined,
          paymentMethod: newStatus === 'paid' ? 'Chuyển khoản' : undefined,
          receiptNo: newStatus === 'paid' ? receipt : undefined,
        };
      }
      return f;
    });

    if (!existing) {
      updatedList.push({
        id: `fee-${playerId}-${year}-${month}`,
        playerId,
        playerName: member?.name,
        jerseyNumber: member?.jerseyNumber,
        position: member?.position,
        year,
        month,
        status: newStatus,
        amount: 300000,
        paidDate: newStatus === 'paid' ? today : undefined,
        paymentMethod: newStatus === 'paid' ? 'Chuyển khoản' : undefined,
        receiptNo: newStatus === 'paid' ? receipt : undefined,
      });
    }

    setPlayerFees(updatedList);

    // Cập nhật feePaidMonth cho member nếu là tháng 11/2026
    if (month === 11 && year === 2026) {
      setMembers(members.map((m) => (m.id === playerId ? { ...m, feePaidMonth: newStatus === 'paid' } : m)));
    }

    try {
      await api.updatePlayerFee({
        playerId,
        year,
        month,
        status: newStatus,
        amount: 300000,
        paymentMethod: 'Chuyển khoản',
        paidDate: today,
        receiptNo: receipt,
      });
      addNotification(
        'Cập nhật phí cầu thủ',
        `Đã chuyển trạng thái nộp phí T${month}/${year} của ${member?.name || playerId} sang "${newStatus === 'paid' ? 'Đã đóng' : 'Chưa đóng'}".`,
        'new'
      );
    } catch (err) {
      console.warn('Lỗi cập nhật phí cầu thủ:', err);
    }
  };

  const handleSubmitPayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFeeTarget) return;

    const { member, month, year, amount, paymentMethod, notes } = payFeeTarget;
    const today = new Date().toISOString().split('T')[0];
    const receipt = `REC-${year}${String(month).padStart(2, '0')}-${member.id.slice(-3)}`;

    setPlayerFees((prev) => {
      const idx = prev.findIndex((f) => f.playerId === member.id && f.year === year && f.month === month);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          status: 'paid',
          amount,
          paidDate: today,
          paymentMethod,
          receiptNo: receipt,
          notes,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `fee-${member.id}-${year}-${month}`,
          playerId: member.id,
          playerName: member.name,
          jerseyNumber: member.jerseyNumber,
          position: member.position,
          year,
          month,
          status: 'paid',
          amount,
          paidDate: today,
          paymentMethod,
          receiptNo: receipt,
          notes,
        },
      ];
    });

    const transTitle = `Thu phí sinh hoạt T${month}/${year} - ${member.name} (#${member.jerseyNumber})`;
    const transItem: FinanceTransaction = {
      id: `fin-fee-${member.id}-${year}-${month}-${Date.now()}`,
      date: today,
      title: transTitle,
      category: 'Thu',
      amount,
      personInCharge: 'Thủ quỹ CLB',
      notes: `Biên lai: ${receipt} • Hình thức: ${paymentMethod}${notes ? ` • ${notes}` : ''}`,
    };
    setTransactions((prev) => [transItem, ...prev]);

    try {
      await api.updatePlayerFee({
        playerId: member.id,
        year,
        month,
        status: 'paid',
        amount,
        paidDate: today,
        paymentMethod,
        receiptNo: receipt,
        notes,
      });
      addNotification(
        'Đã thu phí sinh hoạt',
        `Ghi nhận thành công khoản thu ${formatVND(amount)} từ cầu thủ ${member.name} (T${month}/${year}).`,
        'new'
      );
    } catch (err) {
      console.warn('Lỗi ghi nhận thu phí:', err);
    }

    setPayFeeTarget(null);
  };

  const handleRemindUnpaid = (month: number | 'all', year: number) => {
    const targetMonth = month === 'all' ? 11 : month;
    const unpaidPlayers = members.filter((m) => {
      const fee = playerFees.find((f) => f.playerId === m.id && f.year === year && f.month === targetMonth);
      return fee ? fee.status === 'unpaid' : true;
    });

    if (unpaidPlayers.length === 0) {
      alert(`🎉 Toàn bộ cầu thủ đã hoàn thành đóng phí sinh hoạt Tháng ${targetMonth}/${year}.`);
      return;
    }

    addNotification(
      `Nhắc nộp phí CLB Tháng ${targetMonth}/${year}`,
      `Còn ${unpaidPlayers.length} cầu thủ chưa hoàn tất đóng quỹ tháng ${targetMonth}/${year}: ${unpaidPlayers.slice(0, 3).map((p) => p.name).join(', ')}${unpaidPlayers.length > 3 ? ` và ${unpaidPlayers.length - 3} cầu thủ khác` : ''}. Vui lòng nộp về thủ quỹ.`,
      'new'
    );
    alert(`📢 ĐÃ GỬI THÔNG BÁO NHẮC NỢ PHÍ TỚI ${unpaidPlayers.length} CẦU THỦ THÁNG ${targetMonth}/${year}!`);
  };

  const filteredMembersForFee = members.filter((m) => {
    if (feeTeamFilter !== 'Tất cả' && m.teamName !== feeTeamFilter && m.teamId !== feeTeamFilter) {
      return false;
    }
    if (feeSearch.trim()) {
      const q = feeSearch.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchNum = String(m.jerseyNumber).includes(q);
      if (!matchName && !matchNum) return false;
    }
    if (feeStatusFilter !== 'all') {
      const targetMonth = selectedFeeMonth === 'all' ? 11 : selectedFeeMonth;
      const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === targetMonth);
      const currentSt = f ? f.status : 'unpaid';
      if (feeStatusFilter === 'paid' && currentSt !== 'paid') return false;
      if (feeStatusFilter === 'unpaid' && currentSt !== 'unpaid') return false;
      if (feeStatusFilter === 'exempt' && currentSt !== 'exempt') return false;
    }
    return true;
  });

  const handleExportFeeCSV = () => {
    const isAll = selectedFeeMonth === 'all';
    const filename = isAll
      ? `Danh_Sach_Dong_Phi_Cau_Thu_Nam_${selectedFeeYear}`
      : `Danh_Sach_Dong_Phi_Cau_Thu_Thang_${selectedFeeMonth}_Nam_${selectedFeeYear}`;

    if (isAll) {
      const headers = [
        'STT',
        'Tên Cầu Thủ',
        'Số Áo',
        'Vị Trí',
        'Tuyến Đội',
        'T1',
        'T2',
        'T3',
        'T4',
        'T5',
        'T6',
        'T7',
        'T8',
        'T9',
        'T10',
        'T11',
        'T12',
        'Tổng Đã Nộp (VNĐ)',
        'Tiến Độ',
        'Trạng Thái',
      ];

      const rows = filteredMembersForFee.map((m, idx) => {
        const mFees = playerFees.filter((f) => f.playerId === m.id && f.year === selectedFeeYear);
        const monthsStatus = Array.from({ length: 12 }, (_, i) => {
          const f = mFees.find((x) => x.month === i + 1);
          return f ? (f.status === 'paid' ? 'Đã nộp (300k)' : f.status === 'exempt' ? 'Miễn phí' : 'Chưa nộp') : 'Chưa nộp';
        });
        const paidCount = mFees.filter((f) => f.status === 'paid').length;
        const totalPaid = paidCount * 300000;
        const overallStatus = paidCount >= 11 ? 'Đạt chuẩn' : paidCount >= 8 ? 'Tốt' : 'Còn nợ phí';

        return [
          idx + 1,
          m.name,
          m.jerseyNumber,
          m.position,
          m.teamName,
          ...monthsStatus,
          totalPaid,
          `${paidCount}/12`,
          overallStatus,
        ];
      });

      exportToCSV(filename, headers, rows);
    } else {
      const headers = ['STT', 'Tên Cầu Thủ', 'Số Áo', 'Vị Trí', 'Tuyến Đội', 'Tháng', 'Năm', 'Trạng Thái', 'Số Tiền (VNĐ)', 'Ngày Đóng', 'Phương Thức', 'Mã Biên Lai'];
      const rows = filteredMembersForFee.map((m, idx) => {
        const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === selectedFeeMonth);
        const isPaid = f?.status === 'paid';
        return [
          idx + 1,
          m.name,
          m.jerseyNumber,
          m.position,
          m.teamName,
          `Tháng ${selectedFeeMonth}`,
          selectedFeeYear,
          isPaid ? 'Đã đóng' : 'Chưa đóng',
          300000,
          f?.paidDate || '—',
          f?.paymentMethod || '—',
          f?.receiptNo || '—',
        ];
      });
      exportToCSV(filename, headers, rows);
    }
  };

  const handlePrintFeeReport = () => {
    const isAll = selectedFeeMonth === 'all';
    const title = isAll
      ? `BẢNG TỔNG HỢP THU PHÍ SINH HOẠT CẦU THỦ NĂM ${selectedFeeYear}`
      : `DANH SÁCH THU PHÍ SINH HOẠT CẦU THỦ THÁNG ${selectedFeeMonth}/${selectedFeeYear}`;

    const tableHeaders = isAll
      ? ['STT', 'Cầu Thủ', 'Số Áo', 'Tuyến Đội', 'T1-T6', 'T7-T12', 'Tổng Nộp (VNĐ)', 'Tiến Độ']
      : ['STT', 'Cầu Thủ', 'Số Áo', 'Tuyến Đội', 'Trạng Thái', 'Số Tiền', 'Ngày Nộp', 'Biên Lai'];

    const tableRows = filteredMembersForFee.map((m, idx) => {
      if (isAll) {
        const mFees = playerFees.filter((f) => f.playerId === m.id && f.year === selectedFeeYear);
        const paidCount = mFees.filter((f) => f.status === 'paid').length;
        const totalPaid = paidCount * 300000;
        const t1_6 = [1, 2, 3, 4, 5, 6].map((i) => (mFees.find((f) => f.month === i)?.status === 'paid' ? '✓' : '✕')).join(' ');
        const t7_12 = [7, 8, 9, 10, 11, 12].map((i) => (mFees.find((f) => f.month === i)?.status === 'paid' ? '✓' : '✕')).join(' ');
        return [idx + 1, m.name, `#${m.jerseyNumber}`, m.teamName, t1_6, t7_12, formatVND(totalPaid), `${paidCount}/12 tháng`];
      } else {
        const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === selectedFeeMonth);
        const isPaid = f?.status === 'paid';
        return [
          idx + 1,
          m.name,
          `#${m.jerseyNumber}`,
          m.teamName,
          isPaid ? 'Đã đóng' : 'Chưa đóng',
          '300.000 đ',
          f?.paidDate || '—',
          f?.receiptNo || '—',
        ];
      }
    });

    const totalCollected = playerFees
      .filter((f) => f.year === selectedFeeYear && (selectedFeeMonth === 'all' || f.month === selectedFeeMonth) && f.status === 'paid')
      .reduce((sum, f) => sum + (f.amount || 300000), 0);

    printReport({
      title,
      subtitle: 'CÂU LẠC BỘ BÓNG ĐÁ SAO VÀNG (SAO VANG FC) • BỘ PHẬN TÀI CHÍNH & THỦ QUỸ',
      filterInfo: `Năm tài chính: ${selectedFeeYear} • Tuyến đội: ${feeTeamFilter} • Định mức: 300.000 VNĐ / cầu thủ / tháng`,
      tableHeaders,
      tableRows,
      summary: [
        { label: 'Tổng số cầu thủ:', value: `${filteredMembersForFee.length} cầu thủ` },
        { label: 'Tổng kinh phí đã thu:', value: formatVND(totalCollected) },
      ],
    });
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

  // Handlers for Demo Sân & Đặt Sân Trực Tuyến
  const handleOpenBookingModal = (slot: FieldBookingSlot) => {
    setBookingTargetSlot(slot);
    setCustomerBookingForm({
      customerName: user ? user.name : '',
      customerPhone: user ? (user.phone || '') : '',
      teamName: '',
      needWater: false,
      needRef: false,
      needBibs: false,
      notes: '',
    });
  };

  const handleConfirmCustomerBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTargetSlot) return;

    const cName = customerBookingForm.customerName.trim();
    const cPhone = customerBookingForm.customerPhone.trim();

    if (!cName) {
      alert('⚠️ Vui lòng nhập Họ và tên người liên hệ đặt sân!');
      return;
    }
    if (!cPhone || cPhone.length < 8) {
      alert('⚠️ Vui lòng nhập Số điện thoại liên hệ hợp lệ để ban quản lý sân gọi điện xác nhận!');
      return;
    }

    // Tính phụ phí dịch vụ cộng thêm
    let extraFee = 0;
    const selectedServices: string[] = [];
    if (customerBookingForm.needWater) {
      extraFee += 50000;
      selectedServices.push('Nước suối Lavie (Thùng 24 chai)');
    }
    if (customerBookingForm.needRef) {
      extraFee += 200000;
      selectedServices.push('Tổ trọng tài điều hành trận');
    }
    if (customerBookingForm.needBibs) {
      extraFee += 40000;
      selectedServices.push('Bộ áo pitch 2 màu');
    }

    const totalAmount = bookingTargetSlot.price + extraFee;
    const servicesText = selectedServices.join(', ');

    setIsSubmittingBooking(true);
    try {
      const res = await api.bookFieldSlot({
        slotId: bookingTargetSlot.slotId,
        fieldId: bookingTargetSlot.fieldId,
        fieldName: bookingTargetSlot.fieldName,
        bookingDate: selectedBookingDate,
        slotTime: bookingTargetSlot.slotTime,
        slotLabel: bookingTargetSlot.slotLabel,
        price: totalAmount,
        customerName: cName,
        customerPhone: cPhone,
        teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
        services: servicesText,
        notes: customerBookingForm.notes.trim(),
      });

      const receiptNo = res?.receiptCode || `SVB-${Math.floor(100000 + Math.random() * 900000)}`;

      // Cập nhật state cục bộ
      setFieldBookings((prev) => {
        const existingIdx = prev.findIndex(
          (s) =>
            s.fieldId === bookingTargetSlot.fieldId &&
            s.bookingDate === selectedBookingDate &&
            s.slotTime === bookingTargetSlot.slotTime,
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            isBooked: true,
            customerName: cName,
            customerPhone: cPhone,
            teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
            services: servicesText,
            notes: customerBookingForm.notes.trim(),
            price: totalAmount,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `fb-${Date.now()}`,
              fieldId: bookingTargetSlot.fieldId,
              fieldName: bookingTargetSlot.fieldName,
              bookingDate: selectedBookingDate,
              slotId: bookingTargetSlot.slotId,
              slotTime: bookingTargetSlot.slotTime,
              slotLabel: bookingTargetSlot.slotLabel,
              price: totalAmount,
              isBooked: true,
              customerName: cName,
              customerPhone: cPhone,
              teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
              services: servicesText,
              notes: customerBookingForm.notes.trim(),
            },
          ];
        }
      });

      // Tạo thông báo mới cho ban quản lý CLB
      const newAnn: ClubAnnouncement = {
        id: `ann-${Date.now()}`,
        title: `⚽ Khách Đặt Sân: ${cName} - ${bookingTargetSlot.fieldName} (${bookingTargetSlot.slotTime})`,
        target: 'Toàn bộ câu lạc bộ',
        priority: 'Quan trọng',
        date: new Date().toISOString().split('T')[0],
        author: 'Hệ Thống Đặt Sân Tự Động',
        content: `Khách hàng ${cName} (SĐT: ${cPhone}, Đội: ${customerBookingForm.teamName || 'Khách lẻ'}) vừa hoàn tất đặt sân ${bookingTargetSlot.fieldName} vào khung giờ ${bookingTargetSlot.slotTime} ngày ${selectedBookingDate}. Tổng số tiền: ${formatVND(totalAmount)}. Dịch vụ kèm theo: ${servicesText || 'Không có'}.`,
        pinned: false,
      };
      setAnnouncements((prev) => [newAnn, ...prev]);

      addNotification(
        `Đặt sân thành công! ${bookingTargetSlot.fieldName} lúc ${bookingTargetSlot.slotTime} (${selectedBookingDate})`,
        'booking',
      );

      // Hiển thị Biên lai đặt sân cho khách hàng
      setBookingSuccessReceipt({
        receiptCode: receiptNo,
        slot: bookingTargetSlot,
        customerName: cName,
        customerPhone: cPhone,
        teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
        totalAmount,
        services: selectedServices,
        bookedAt: new Date().toLocaleString('vi-VN'),
      });

      setBookingTargetSlot(null);
    } catch (err: any) {
      alert(`❌ Lỗi đặt sân: ${err.message || 'Không thể kết nối đến máy chủ.'}`);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (slot: FieldBookingSlot) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn hủy lịch đặt sân ca "${slot.slotTime}" (${slot.fieldName}) ngày ${slot.bookingDate}?\nCa này sẽ được đưa trở lại trạng thái "Chưa có người đặt" để người khác có thể đặt chỗ.`,
      )
    ) {
      return;
    }

    try {
      await api.cancelFieldBooking(slot.id);
      setFieldBookings((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                isBooked: false,
                customerName: null,
                customerPhone: null,
                teamName: null,
                services: null,
                notes: null,
              }
            : s,
        ),
      );
      addNotification(`Đã hủy ca đặt sân ${slot.slotTime} thành công`, 'system');
      alert(`✓ Đã hủy ca đặt sân thành công! Ca ${slot.slotTime} ngày ${slot.bookingDate} hiện đã trống.`);
    } catch (err: any) {
      alert(`❌ Lỗi hủy ca đặt sân: ${err.message}`);
    }
  };

  // Tổng hợp tất cả các ca đặt sân cho ngày đang chọn (selectedBookingDate)
  const computedFacilitySlots = useMemo(() => {
    const facilitiesToShow =
      bookingFieldFilter === 'all'
        ? fieldFacilities
        : fieldFacilities.filter((f) => f.id === bookingFieldFilter);

    const result: FieldBookingSlot[] = [];

    facilitiesToShow.forEach((fac) => {
      const templateSlots = standardFacilitySlots[fac.id] || [];

      templateSlots.forEach((tpl) => {
        // Tìm xem ca này trong ngày đã chọn có bản ghi nào trong fieldBookings chưa
        const match = fieldBookings.find(
          (b) =>
            b.fieldId === fac.id &&
            b.bookingDate === selectedBookingDate &&
            b.slotTime === tpl.slotTime,
        );

        if (match) {
          result.push({
            ...match,
            fieldName: fac.name,
          });
        } else {
          // Ca chưa có người đặt (trống)
          result.push({
            id: `slot-${fac.id}-${selectedBookingDate}-${tpl.slotId}`,
            fieldId: fac.id,
            fieldName: fac.name,
            bookingDate: selectedBookingDate,
            slotId: tpl.slotId,
            slotTime: tpl.slotTime,
            slotLabel: tpl.slotLabel,
            price: tpl.price,
            isBooked: false,
            customerName: null,
            customerPhone: null,
            teamName: null,
            services: null,
            notes: null,
          });
        }
      });
    });

    // Lọc theo trạng thái Đã đặt / Còn trống nếu có filter
    if (bookingStatusFilter === 'available') {
      return result.filter((s) => !s.isBooked);
    }
    if (bookingStatusFilter === 'booked') {
      return result.filter((s) => s.isBooked);
    }
    return result;
  }, [fieldFacilities, fieldBookings, selectedBookingDate, bookingFieldFilter, bookingStatusFilter]);

  const bookingStatsForDate = useMemo(() => {
    let total = 0;
    let booked = 0;
    let available = 0;

    fieldFacilities.forEach((fac) => {
      const templateSlots = standardFacilitySlots[fac.id] || [];
      templateSlots.forEach((tpl) => {
        total++;
        const match = fieldBookings.find(
          (b) =>
            b.fieldId === fac.id &&
            b.bookingDate === selectedBookingDate &&
            b.slotTime === tpl.slotTime,
        );
        if (match && match.isBooked) {
          booked++;
        } else {
          available++;
        }
      });
    });

    return { total, booked, available };
  }, [fieldFacilities, fieldBookings, selectedBookingDate]);

  // Danh sách các ca sân phục vụ cho tab Tìm Sân (hỗ trợ lọc Đã Đặt, Chưa Đặt & Từ khóa tìm kiếm)
  const filteredSlotsForFieldsTab = useMemo(() => {
    let list = computedFacilitySlots;
    if (fieldSearchQuery.trim()) {
      const q = fieldSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.slotTime.toLowerCase().includes(q) ||
          s.slotLabel.toLowerCase().includes(q) ||
          s.fieldName.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [computedFacilitySlots, fieldSearchQuery]);

  // Xử lý nút ĐẶT SÂN trực tiếp trên Card sân (chuẩn giao diện ảnh mẫu Screenshot 2)
  const handleQuickBookFacility = (facility: FieldDemoFacility) => {
    setBookingFieldFilter(facility.id);
    const availableSlot = computedFacilitySlots.find(
      (s) => s.fieldId === facility.id && !s.isBooked,
    );
    if (availableSlot) {
      handleOpenBookingModal(availableSlot);
    } else {
      const fallbackSlot: FieldBookingSlot = {
        id: `slot-${facility.id}-${selectedBookingDate}-quick`,
        fieldId: facility.id,
        fieldName: facility.name,
        bookingDate: selectedBookingDate,
        slotId: 'slot-quick',
        slotTime: '08:00 - 09:00',
        slotLabel: 'Ca Sáng (08:00 - 09:00)',
        price: 20000,
        isBooked: false,
        customerName: null,
        customerPhone: null,
        teamName: null,
        services: null,
        notes: null,
      };
      handleOpenBookingModal(fallbackSlot);
    }
  };

  // Xử lý gửi đánh giá mới
  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewForm.customerName.trim() || !newReviewForm.content.trim()) {
      alert('Vui lòng nhập họ tên và nội dung đánh giá!');
      return;
    }
    const newRev = {
      id: `rev-${Date.now()}`,
      customerName: newReviewForm.customerName.trim(),
      teamName: newReviewForm.teamName.trim() || 'Khách đặt sân',
      fieldName: newReviewForm.fieldName,
      rating: Number(newReviewForm.rating) || 5,
      date: new Date().toISOString().split('T')[0],
      content: newReviewForm.content.trim(),
      avatar: '⭐',
      likes: 1,
    };
    setCustomerReviews((prev) => [newRev, ...prev]);
    setNewReviewForm({
      customerName: '',
      teamName: '',
      fieldName: 'Sân bóng C1',
      rating: 5,
      content: '',
    });
    alert('✓ Cảm ơn bạn! Đánh giá đã được gửi thành công.');
  };

  // Xử lý gửi thông tin liên hệ
  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      alert('Vui lòng điền họ tên và số điện thoại liên hệ!');
      return;
    }
    setContactSuccess(true);
    alert('✓ Cảm ơn bạn! Ban quản lý đã nhận được thông tin liên hệ và sẽ phản hồi sớm nhất.');
  };

  // Card hiển thị sân bóng giống 100% mẫu giao diện người dùng yêu cầu (Screenshot 2)
  const renderFieldCard = (facility: FieldDemoFacility) => {
    const isFav = favoriteFields.includes(facility.id);
    const isSelected = bookingFieldFilter === facility.id;

    return (
      <div
        key={facility.id}
        className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
          isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200/90'
        }`}
      >
        <div>
          {/* Ảnh thực tế của sân với Overlay Badge & Nút Yêu thích */}
          <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-900">
            <img
              src={facility.image}
              alt={facility.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Badge khoảng cách góc trên bên trái: ✈ 4.666 KM */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-black shadow-md border border-slate-200/70">
                <span className="text-slate-700 text-xs font-bold">✈</span>
                <span>{facility.distance || '4.666 KM'}</span>
              </span>
            </div>

            {/* Nút tim yêu thích góc trên bên phải: ❤️ */}
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteField(facility.id);
                }}
                className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-200/70 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title={isFav ? 'Đã thêm vào yêu thích' : 'Lưu sân yêu thích'}
              >
                <svg className="w-5 h-5 text-rose-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Thân card */}
          <div className="p-4 sm:p-5 space-y-3">
            {/* Dòng 1: Tên Sân + Điểm Đánh Giá ★ 5 */}
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-black text-slate-900 tracking-tight truncate" title={facility.name}>
                {facility.name}
              </h4>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f4f9ea] text-[#3f6212] font-black text-xs border border-[#e0f0cd] shrink-0">
                <span className="text-amber-500 text-xs">★</span>
                <span>{facility.rating || 5}</span>
              </span>
            </div>

            {/* Dòng 2: Địa chỉ với icon Ghim Đỏ 📍 */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 truncate">
              <span className="text-rose-500 text-sm shrink-0">📍</span>
              <span className="truncate">{facility.location}</span>
            </div>

            {/* Dòng 3: Các Tiện Ích / Dịch Vụ Đi Kèm (THUE BONG, NUOC LOC, AO) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(facility.tags && facility.tags.length > 0 ? facility.tags : ['THUE BONG', 'NUOC LOC', 'AO']).map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-3 py-1 rounded-full bg-[#f1f5f9] text-[#475569] text-xs font-black uppercase tracking-wider border border-slate-200/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dòng 4 (Chân Card): GIÁ TỪ + 20.000 đ / GIỜ & Nút ĐẶT SÂN → */}
        <div className="p-4 sm:p-5 pt-0">
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                GIÁ TỪ
              </span>
              <span className="text-[#0d6efd] font-black text-xl sm:text-2xl block tracking-tight">
                {facility.priceDisplay || '20.000 đ / GIỜ'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickBookFacility(facility)}
              className="px-5 py-2.5 rounded-2xl bg-[#2ea44f] hover:bg-[#238636] active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <span>ĐẶT SÂN</span>
              <span className="text-base font-black">→</span>
            </button>
          </div>
        </div>
      </div>
    );
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
      {/* 1. HERO BANNER & NEON STATUS BAR - CHỈ HIỂN THỊ CHO ADMIN / THÀNH VIÊN ĐÃ ĐĂNG NHẬP */}
      {user && (
        <>
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

          {/* THANH TRẠNG THÁI NEON CLOUD DATABASE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 px-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500/50 text-xs text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Cơ sở dữ liệu Neon Cloud PostgreSQL:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-black text-[11px] tracking-wide">
                    ● ĐÃ KẾT NỐI (ONLINE)
                  </span>
                </div>
                <p className="text-emerald-200/90 mt-0.5 text-[11.5px]">
                  Dữ liệu đồng bộ trực tiếp qua <strong>NestJS Backend (Port 5000/api)</strong> tới <strong>Neon PostgreSQL Cloud</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold text-emerald-200 self-stretch sm:self-auto justify-end">
              <span className="bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">🛡️ {neonStats.teams || teams.length} Đội</span>
              <span className="bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">🏃 {neonStats.players || members.length} Cầu thủ</span>
              <span className="bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">📅 {neonStats.schedules || schedules.length} Lịch tập</span>
              <span className="bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">✅ {neonStats.attendances || attendance.length} Điểm danh</span>
              <button
                onClick={() => loadNeonDatabase()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg border border-emerald-400 transition-all font-bold cursor-pointer"
                title="Đồng bộ lại dữ liệu mới nhất từ Neon DB"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>
        </>
      )}

      {/* THÔNG BÁO VAI TRÒ & PHÂN QUYỀN HỆ THỐNG - CHỈ HIỂN THỊ KHI THÀNH VIÊN ĐÃ ĐĂNG NHẬP */}
      {user && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-5 rounded-2xl bg-[#022c22]/90 border border-emerald-500/40 text-xs text-emerald-100 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0 p-2 rounded-xl bg-emerald-800/80 border border-emerald-500/40">
              {isAdmin ? '🛡️' : isCoach ? '📋' : '🏃'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  Vai trò: {isAdmin ? 'Quản Trị Viên (Admin)' : isCoach ? 'Huấn Luyện Viên (HLV)' : 'Cầu Thủ / Thành Viên'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : isCoach
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                }`}>
                  {isAdmin ? 'Toàn Quyền Quản Trị' : isCoach ? 'Chuyên Môn & Điểm Danh' : 'Cầu Thủ Thành Viên'}
                </span>
              </div>
              <p className="text-emerald-300/90 mt-0.5 text-[11.5px]">
                {isAdmin
                  ? 'Bạn có toàn quyền thêm, sửa, xóa các đội bóng, nhân sự, lịch tập, tài chính và thông báo CLB.'
                  : isCoach
                  ? 'Bạn có quyền điều hành lịch tập luyện, thực hiện điểm danh các buổi tập và đăng thông báo.'
                  : 'Bạn có quyền theo dõi lịch tập luyện, danh sách đội bóng, kiểm tra điểm danh và đóng phí sinh hoạt.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[11px] text-emerald-400 font-bold">Đang online:</span>
            <span className="font-black text-white px-2.5 py-1 rounded-lg bg-emerald-800 border border-emerald-600">
              {user.name}
            </span>
          </div>
        </div>
      )}

      {/* 3. MODULE CONTENTS */}

      {/* CHẶN TRUY CẬP CHO KHÁCH (CUSTOMER) KHI TRUY CẬP CÁC PHÂN HỆ QUẢN TRỊ NỘI BỘ */}
      {!user && ['teams', 'members', 'coaches', 'schedules', 'attendance', 'finances', 'announcements'].includes(activeTab) && (
        <div className="rounded-3xl bg-white border-2 border-emerald-400 p-8 sm:p-12 text-center shadow-2xl space-y-6 max-w-2xl mx-auto my-8 animate-in fade-in duration-200">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-4xl shadow-inner border border-emerald-300">
            🔒
          </div>
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider inline-block">
              Phân Hệ Nghiệp Vụ Quản Trị Nội Bộ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Yêu Cầu Đăng Nhập Cổng Quản Trị (/admin)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Các tính năng quản lý đội bóng, thành viên, huấn luyện viên, lịch tập, điểm danh, thu chi quỹ và thông báo nội bộ chỉ dành riêng cho Ban Quản Trị CLB. Người dùng khách hàng vui lòng sử dụng các tính năng: <strong>Trang Chủ</strong>, <strong>Tìm Sân</strong>, <strong>Lịch Đặt Sân</strong> và <strong>Liên Hệ</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/admin"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
            >
              <span>🛡️ Đăng Nhập Cổng Quản Trị (Admin)</span>
            </Link>
            <button
              onClick={() => setActiveTab('home')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
            >
              🏠 Quay Lại Trang Chủ
            </button>
          </div>
        </div>
      )}

      {/* ================= TRANG CHỦ / TỔNG QUAN CLB (CHO KHÁCH HÀNG & THÀNH VIÊN) ================= */}
      {activeTab === 'home' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* ================= 1. GIAO DIỆN SÂN BÓNG C1 - HIỂN THỊ ĐẦU TIÊN KHI VÀO TRANG WEB ================= */}
          <section id="field-booking-demo" className="space-y-6 pt-1">
            {/* HERO SHOWCASE: CARD SÂN BÓNG C1 ĐẶT Ở ĐẦU TIÊN CÙNG BẢNG ĐIỀU HÀNH ĐẶT SÂN NHANH */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* CỘT TRÁI (HIỂN THỊ ĐẦU TIÊN): CARD SÂN BÓNG CHUẨN 100% THEO HÌNH CHỤP GIAO DIỆN KHÁCH HÀNG */}
              <div className="lg:col-span-5 xl:col-span-4 w-full max-w-md mx-auto lg:mx-0 flex flex-col justify-center">
                {fieldFacilities.map((facility) => renderFieldCard(facility))}
              </div>

              {/* CỘT PHẢI: BANNER THÔNG TIN VÀ NÚT ĐẶT SÂN NHANH 07:00 - 22:00 GIÁ 20.000 Đ/GIỜ */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-6 sm:p-8 text-white border-2 border-emerald-400/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    🏟️ SÂN BÓNG ĐÁ C1 • ĐẶT SÂN TRỰC TUYẾN
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Sân bóng C1 (Cụm 2 Sân Cỏ Nhân Tạo)
                    </h2>
                    <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 leading-relaxed">
                      📍 <strong>1B Y Ngông, Tân Tiến, Buôn Ma Thuột</strong> • 📞 <strong>0983 830 955 / 0906 424 006</strong>
                    </p>
                    <p className="text-emerald-200/80 text-xs mt-1">
                      Cụm 2 sân bóng đá mini cỏ nhân tạo chất lượng cao, dàn đèn cao áp ban đêm sáng rực rỡ, bãi giữ xe rộng rãi, phục vụ nhiệt tình chu đáo.
                    </p>
                  </div>

                  {/* Thông số niêm yết chính thức: Thứ 2 – Chủ nhật: 24/24 & 250.000 - 350.000 đ/giờ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white/10 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-3.5">
                      <span className="text-[11px] font-bold text-emerald-300 block uppercase tracking-wider">🕒 Giờ Hoạt Động Của Sân</span>
                      <strong className="text-base sm:text-lg font-black text-white block mt-0.5">Thứ 2 – Chủ nhật: 24/24</strong>
                      <span className="text-[11px] text-emerald-100/80 block mt-0.5">Cụm 2 sân mở cửa phục vụ 24/7 cả ngày lẫn đêm</span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-3.5">
                      <span className="text-[11px] font-bold text-emerald-300 block uppercase tracking-wider">💰 Bảng Giá Thuê Niêm Yết</span>
                      <strong className="text-base sm:text-lg font-black text-emerald-300 block mt-0.5">250.000 – 350.000 đ/giờ</strong>
                      <span className="text-[11px] text-emerald-100/80 block mt-0.5">Ngày: 250k/h • Tối có đèn chiếu sáng: 350k/h</span>
                    </div>
                  </div>

                  {/* Thống kê ca trong ngày */}
                  <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                      <span className="text-slate-300">Tổng ca ngày {selectedBookingDate}:</span>
                      <strong className="text-white font-black">{bookingStatsForDate.total} Ca</strong>
                    </div>
                    <span className="text-slate-500">•</span>
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Còn trống:</span>
                      <strong className="text-emerald-300 font-black">{bookingStatsForDate.available} Ca</strong>
                    </div>
                    <span className="text-slate-500">•</span>
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      <span>Đã đặt:</span>
                      <strong className="text-rose-300 font-black">{bookingStatsForDate.booked} Ca</strong>
                    </div>
                  </div>
                </div>

                {/* Các nút hành động nhanh */}
                <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickBookFacility(fieldFacilities[0])}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#2ea44f] hover:bg-[#238636] active:scale-95 text-white font-black text-sm shadow-xl shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>⚡ ĐẶT SÂN NHANH (250k – 350k/h)</span>
                    <span>→</span>
                  </button>

                  <a
                    href="#booking-schedule-matrix"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>📅 Chọn 13 Khung Giờ Chi Tiết Bên Dưới</span>
                    <span>↓</span>
                  </a>
                </div>
              </div>
            </div>

            {/* PHẦN 2: BẢNG TRA CỨU & ĐẶT SÂN TRỰC TUYẾN THEO THỜI GIAN THỰC */}
            <div id="booking-schedule-matrix" className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-300 shadow-xl space-y-6">
              {/* Thanh điều khiển: Chọn Ngày + Bộ Lọc Sân + Bộ Lọc Trạng Thái */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                {/* 1. Bộ chọn Ngày thi đấu */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>📅</span> Chọn Ngày Đặt Sân:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: 'Hôm Nay (01/11)', val: '2026-11-01' },
                      { label: 'Ngày Mai (02/11)', val: '2026-11-02' },
                      { label: 'Ngày Kia (03/11)', val: '2026-11-03' },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setSelectedBookingDate(d.val)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          selectedBookingDate === d.val
                            ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                    <input
                      type="date"
                      value={selectedBookingDate}
                      onChange={(e) => setSelectedBookingDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Bộ lọc theo Sân & Trạng Thái Đặt */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Lọc Sân */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Lọc theo sân:</span>
                    <select
                      value={bookingFieldFilter}
                      onChange={(e) => setBookingFieldFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">🏟️ Sân bóng C1 (Tất cả ca)</option>
                      <option value="field-c1">⭐ Sân bóng C1</option>
                    </select>
                  </div>

                  {/* Lọc Trạng Thái Đặt */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Trạng thái ca:</span>
                    <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          bookingStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tất cả ca
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('available')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          bookingStatusFilter === 'available' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:text-emerald-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Chưa có người đặt
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('booked')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          bookingStatusFilter === 'booked' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:text-rose-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        Đã có người đặt
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lưới các Ca Sân (Live Booking Cards Grid) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="font-bold">
                    Hiển thị <strong>{computedFacilitySlots.length}</strong> ca đặt sân ngày <strong>{selectedBookingDate}</strong>
                  </span>
                  <div className="flex items-center gap-4 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      🟢 Chưa có người đặt (Còn trống - Đặt ngay)
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      🔴 Đã có người đặt (Đang bận)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {computedFacilitySlots.map((slot: FieldBookingSlot) => {
                    const isBooked = slot.isBooked;

                    return (
                      <div
                        key={slot.id}
                        className={`rounded-2xl p-4.5 border-2 transition-all flex flex-col justify-between ${
                          isBooked
                            ? 'bg-gradient-to-br from-rose-50/70 to-red-50/40 border-rose-300 shadow-sm'
                            : 'bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border-emerald-400/90 shadow-md hover:shadow-xl hover:border-emerald-600'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header card: Tên sân & Badge trạng thái */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                ⭐ Sân bóng C1 (Cỏ Nhân Tạo)
                              </span>
                              <h5 className="font-black text-slate-900 text-sm">{slot.fieldName}</h5>
                            </div>

                            {/* BADGE TRẠNG THÁI: ĐÃ ĐẶT vs CHƯA ĐẶT */}
                            {isBooked ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-black tracking-wide flex items-center gap-1 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                🔴 ĐÃ CÓ NGƯỜI ĐẶT
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-900 text-[11px] font-black tracking-wide flex items-center gap-1 shrink-0 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                🟢 CHƯA CÓ NGƯỜI ĐẶT
                              </span>
                            )}
                          </div>

                          {/* Khung giờ & Giá tiền lớn nổi bật */}
                          <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                {slot.slotLabel}
                              </span>
                              <strong className="text-base font-black text-slate-900 flex items-center gap-1 mt-0.5">
                                <span>⏰</span> {slot.slotTime}
                              </strong>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Giá Thuê Sân
                              </span>
                              <strong className={`text-base font-black ${isBooked ? 'text-slate-700' : 'text-emerald-700'}`}>
                                {formatVND(slot.price)}
                              </strong>
                            </div>
                          </div>

                          {/* Chi tiết ca đặt: Nếu đã đặt thì hiện thông tin người đặt */}
                          {isBooked ? (
                            <div className="p-2.5 rounded-xl bg-rose-100/60 border border-rose-200 text-xs text-rose-950 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-rose-700">Khách đặt:</span>
                                <strong className="font-extrabold">{slot.customerName || 'Khách vãng lai'}</strong>
                              </div>
                              {slot.teamName && (
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-rose-700">Đội bóng:</span>
                                  <strong className="font-extrabold truncate max-w-[160px]">{slot.teamName}</strong>
                                </div>
                              )}
                              {slot.services && (
                                <div className="text-[11px] text-rose-800 pt-0.5 border-t border-rose-200/60">
                                  🎁 Dịch vụ: {slot.services}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                              <span>✨</span> Ca sân đang trống hoàn toàn, hỗ trợ giữ chỗ online ngay không cần cọc trước!
                            </p>
                          )}
                        </div>

                        {/* Nút thao tác dưới cùng */}
                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                          {isBooked ? (
                            <>
                              <span className="text-xs text-slate-500 font-medium italic">
                                ⛔ Ca này đã kín lịch
                              </span>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(slot)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                                >
                                  Hủy Ca Đặt
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenBookingModal(slot)}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                            >
                              <span>⚡ ĐẶT SÂN NGAY</span>
                              <span>•</span>
                              <span>{formatVND(slot.price)}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ================= 2. CÁC PHÂN HỆ NỘI BỘ DÀNH CHO ADMIN / THÀNH VIÊN ĐÃ ĐĂNG NHẬP ================= */}
          {user && (
            <>
              {/* 1. HERO BANNER SỰ KIỆN KẾ TIẾP */}
              {(() => {
                const nextSchedule = schedules.find((s) => s.status !== 'Đã hoàn thành') || schedules[0];
                return (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 border-2 border-emerald-400/40 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                          ⚽ HOẠT ĐỘNG HUẤN LUYỆN & THI ĐẤU KẾ TIẾP
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {nextSchedule ? nextSchedule.title : 'Buổi Tập Chiến Thuật Đội Hình'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-emerald-100 font-semibold">
                          <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                            📅 {nextSchedule ? nextSchedule.date : '2026-11-01'}
                          </span>
                          <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                            ⏰ {nextSchedule ? `${nextSchedule.startTime} - ${nextSchedule.endTime}` : '18:00 - 20:00'}
                          </span>
                          <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                            📍 {nextSchedule ? nextSchedule.fieldName : 'Sân bóng Sao Vàng A'}
                          </span>
                          <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                            📋 {nextSchedule ? nextSchedule.coach : 'HLV. Nguyễn Văn Huấn'}
                          </span>
                        </div>
                        {nextSchedule?.notes && (
                          <p className="text-emerald-200/90 text-xs sm:text-sm italic">
                            💡 Ghi chú: &ldquo;{nextSchedule.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => setActiveTab('schedules')}
                          className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>📅 Xem Chi Tiết Lịch Tập</span>
                          <span>→</span>
                        </button>
                        {canManage && (
                          <button
                            onClick={() => setActiveTab('attendance')}
                            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm border border-emerald-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>✅ Điểm Danh Buổi Tập Này</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. THỐNG KÊ TỔNG QUAN 6 MODULE (6 WIDGETS ĐẸP MẮT) */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <div
                  onClick={() => setActiveTab('teams')}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">🛡️</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">4 Tuyến</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block mt-2">{teams.length} Đội Bóng</strong>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">Biên chế CLB</span>
                  <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:underline">
                    Quản lý đội →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('members')}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">🏃</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Sẵn sàng</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block mt-2">{members.length} Cầu Thủ</strong>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">Hồ sơ hoàn chỉnh</span>
                  <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:underline">
                    Xem cầu thủ →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('coaches')}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">📋</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Bằng AFC</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block mt-2">{coaches.length} HLV</strong>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">Ban huấn luyện</span>
                  <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:underline">
                    Xem HLV →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('schedules')}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">📅</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Lịch tập</span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block mt-2">{schedules.length} Buổi Tập</strong>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">Chiến thuật & thể lực</span>
                  <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:underline">
                    Lịch chi tiết →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('attendance')}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">✅</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {Math.round((attendance.filter((a) => a.status === 'Có mặt').length / (attendance.length || 1)) * 100)}%
                    </span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block mt-2">
                    {attendance.filter((a) => a.status === 'Có mặt').length}/{attendance.length}
                  </strong>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">Cầu thủ có mặt</span>
                  <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:underline">
                    Điểm danh →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('finances')}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">💰</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Số dư</span>
                  </div>
                  <strong className="text-lg font-black text-emerald-700 block mt-2 truncate">
                    {formatVND(currentBalance)}
                  </strong>
                  <span className="text-xs text-slate-500 font-semibold block mt-0.5">Quỹ sinh hoạt CLB</span>
                  <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:underline">
                    Thu chi quỹ →
                  </span>
                </div>
              </div>

              {/* 3. PHÍM TẮT HÀNH ĐỘNG NHANH (QUICK ACTIONS BAR) */}
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>⚡</span> Phím Tắt Thao Tác Nhanh (Nội Bộ)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {canManageClub && (
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 transition-all font-extrabold text-xs flex flex-col items-center gap-1.5 shadow-sm cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
                      <span>Thêm Cầu Thủ</span>
                    </button>
                  )}
                  {canManageTraining && (
                    <button
                      onClick={() => setShowAddScheduleModal(true)}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 transition-all font-extrabold text-xs flex flex-col items-center gap-1.5 shadow-sm cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">📅</span>
                      <span>Lên Lịch Tập Mới</span>
                    </button>
                  )}
                  {canManageTraining && (
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 transition-all font-extrabold text-xs flex flex-col items-center gap-1.5 shadow-sm cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">✅</span>
                      <span>Điểm Danh Ngay</span>
                    </button>
                  )}
                  {canManageClub && (
                    <button
                      onClick={() => setShowAddFinanceModal(true)}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 transition-all font-extrabold text-xs flex flex-col items-center gap-1.5 shadow-sm cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">💵</span>
                      <span>Ghi Nhận Thu / Chi</span>
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={() => setShowAddAnnouncementModal(true)}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 transition-all font-extrabold text-xs flex flex-col items-center gap-1.5 shadow-sm cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">📢</span>
                      <span>Đăng Thông Báo</span>
                    </button>
                  )}
                  {canManageClub && (
                    <button
                      onClick={() => setShowAddTeamModal(true)}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 transition-all font-extrabold text-xs flex flex-col items-center gap-1.5 shadow-sm cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">🛡️</span>
                      <span>Thành Lập Đội Mới</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 4. CÁC ĐỘI BÓNG TRỰC THUỘC (TEAMS SPOTLIGHT) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🏆</span> Các Tuyến Đội Bóng Trực Thuộc CLB Sao Vàng FC
                </h3>
                <p className="text-xs text-slate-500">Cơ cấu tổ chức và ban huấn luyện phụ trách từng tuyến thi đấu</p>
              </div>
              <button
                onClick={() => setActiveTab('teams')}
                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả đội bóng</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl p-5 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xl">
                        ⚽
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-[10px]">
                        {t.status}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{t.name}</h4>
                    <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">{t.level}</span>
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2">{t.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">HLV Trưởng:</span>
                        <strong className="text-slate-800">{t.headCoach}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Đội Trưởng:</span>
                        <strong className="text-slate-800">{t.captain}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Quân số:</span>
                        <strong className="text-emerald-700 font-black">{t.memberCount} Cầu thủ</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMemberTeamFilter(t.name);
                      setActiveTab('members');
                    }}
                    className="w-full mt-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm"
                  >
                    Xem Cầu Thủ Đội Này →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. HAI CỘT: BẢNG TIN HOẠT ĐỘNG & KẾT QUẢ THI ĐẤU */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CỘT 1: THÔNG BÁO QUAN TRỌNG GẦN ĐÂY */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <span>📢</span> Thông Báo Mới Nhất Từ Ban Quản Trị
                  </h4>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Xem tất cả →
                  </button>
                </div>

                <div className="space-y-3">
                  {announcements.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            a.priority === 'Khẩn cấp'
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : a.priority === 'Quan trọng'
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          }`}
                        >
                          {a.priority}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">{a.date}</span>
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">{a.title}</h5>
                      <p className="text-slate-600 text-xs mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Tác giả: Ban Điều Hành Sao Vàng FC</span>
                <span className="font-bold text-emerald-700">Tổng cộng {announcements.length} thông báo</span>
              </div>
            </div>

            {/* CỘT 2: KẾT QUẢ TRẬN ĐẤU & CHIẾN TÍCH GẦN NHẤT */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <span>⚽</span> Kết Quả Thi Đấu & Chiến Tích Gần Đây
                  </h4>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Phong độ cao
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-bold">10/10/2026 • Sân Sao Vàng A</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">THẮNG</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Sao Vàng FC</span>
                      <span className="text-lg font-black text-emerald-700 px-3 py-0.5 rounded-xl bg-white border border-emerald-300">3 - 1</span>
                      <span className="font-black text-slate-900 text-sm">FC Rồng Đỏ</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1.5">
                      ⚽ Bàn thắng: Hoàng Minh Huy (15&apos;, 45&apos;), Nguyễn Đức Thắng (78&apos;) • MVP: Hoàng Minh Huy
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-bold">17/10/2026 • Sân Thống Nhất</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">HÒA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Sao Vàng FC</span>
                      <span className="text-lg font-black text-amber-700 px-3 py-0.5 rounded-xl bg-white border border-amber-300">2 - 2</span>
                      <span className="font-black text-slate-900 text-sm">Hổ Biển FC</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1.5">
                      ⚽ Bàn thắng: Bùi Văn Kiên (22&apos;), Hoàng Minh Huy (60&apos;) • MVP: Bùi Văn Kiên
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-bold">28/09/2026 • Sân Phú Thọ</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">THẮNG</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Sao Vàng FC</span>
                      <span className="text-lg font-black text-emerald-700 px-3 py-0.5 rounded-xl bg-white border border-emerald-300">1 - 0</span>
                      <span className="font-black text-slate-900 text-sm">Sông Hồng Utd</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1.5">
                      ⚽ Bàn thắng: Nguyễn Đức Thắng (88&apos;) • MVP: Thủ môn Nguyễn Văn Khải
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Giải bóng đá phong trào & Cúp khu vực</span>
                <span className="font-bold text-emerald-700">Tỷ lệ thắng 75%</span>
              </div>
            </div>
          </div>

          {/* 6. BẢN SẮC & TRUYỀN THỐNG CLB */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block">
                ⭐ BẢN SẮC & TINH THẦN SAO VÀNG FC
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                &ldquo;Đoàn Kết - Kỷ Luật - Tinh Thần Thể Thao Cống Hiến&rdquo;
              </h3>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                Được thành lập từ năm 2015, Sao Vàng FC là mái nhà chung kết nối đam mê bóng đá, rèn luyện thể chất và xây dựng phong cách thi đấu hiện đại, công bằng. Chúng tôi tự hào phát triển toàn diện từ lứa tuổi trẻ U17, U21 đến đội 1 chuyên nghiệp và đội bóng đá trong nhà Futsal.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => setActiveTab('members')}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Gia Nhập CLB →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB KHÁCH HÀNG 1: TÌM SÂN (TÌM KIẾM SÂN ĐÃ ĐẶT VÀ CHƯA ĐẶT) ================= */}
      {activeTab === 'fields' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Tìm Sân: Tìm kiếm sân đã đặt & chưa đặt */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                  <span>🔍</span> TÌM KIẾM SÂN ĐÃ ĐẶT VÀ CHƯA ĐẶT
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Tra Cứu Sân & Tình Trạng Ca Đặt Theo Thời Gian Thực
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Lọc và tìm kiếm nhanh các ca sân <strong>🟢 Chưa đặt (Còn trống)</strong> để đặt sân giữ chỗ tức thì hoặc xem ca sân <strong>🔴 Đã đặt</strong> trong ngày. Khung giờ hoạt động <strong>07:00 – 22:00</strong> với giá niêm yết cố định <strong>20.000 VNĐ / 1 Giờ</strong>.
                </p>
              </div>

              {/* Ô Tìm kiếm theo giờ & Nút xem toàn bộ lịch */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="relative min-w-[280px]">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={fieldSearchQuery}
                    onChange={(e) => setFieldSearchQuery(e.target.value)}
                    placeholder="Tìm theo giờ (vd: 08:00, 19:00, sáng, tối)..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  />
                  {fieldSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFieldSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('booking-schedule')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>📅 Xem Bảng Lịch Đặt Sân</span>
                </button>
              </div>
            </div>

            {/* BỘ LỌC TÌM KIẾM TRẠNG THÁI SÂN (ĐÃ ĐẶT VÀ CHƯA ĐẶT) & BỘ CHỌN NGÀY */}
            <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* 1. Bộ lọc trạng thái: Tất Cả / Chưa Đặt / Đã Đặt */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <span>⚡</span> Trạng thái sân:
                </span>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    bookingStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ⚪ Tất Cả Ca ({bookingStatsForDate.total})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('available')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bookingStatusFilter === 'available'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  🟢 Chưa Đặt - Còn Trống ({bookingStatsForDate.available})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('booked')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bookingStatusFilter === 'booked'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  🔴 Đã Đặt - Đang Bận ({bookingStatsForDate.booked})
                </button>
              </div>

              {/* 2. Bộ chọn ngày */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <span>📅</span> Ngày:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Hôm Nay (01/11)', val: '2026-11-01' },
                    { label: 'Ngày Mai (02/11)', val: '2026-11-02' },
                    { label: 'Ngày Kia (03/11)', val: '2026-11-03' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setSelectedBookingDate(d.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedBookingDate === d.val
                          ? 'bg-emerald-700 text-white font-extrabold shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                  <input
                    type="date"
                    value={selectedBookingDate}
                    onChange={(e) => setSelectedBookingDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KHU VỰC HIỂN THỊ KẾT QUẢ TÌM KIẾM: CARD SÂN + DANH SÁCH CA ĐÃ ĐẶT / CHƯA ĐẶT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI: CARD SÂN VẬN ĐỘNG QUỐC GIA MỸ ĐÌNH (CHUẨN 100% ẢNH MẪU) KÈM HUY HIỆU TRẠNG THÁI */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="w-full max-w-md mx-auto lg:mx-0">
                {fieldFacilities.map((facility) => renderFieldCard(facility))}
              </div>

              {/* Box tóm tắt tình trạng ca sân của ngày đang chọn */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>📊</span> Tình Trạng Ngày {selectedBookingDate}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">07:00 – 22:00</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                    <span className="text-[11px] font-bold text-emerald-700 block">🟢 Chưa Đặt</span>
                    <strong className="text-lg font-black text-emerald-800">{bookingStatsForDate.available} Ca</strong>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
                    <span className="text-[11px] font-bold text-rose-700 block">🔴 Đã Đặt</span>
                    <strong className="text-lg font-black text-rose-800">{bookingStatsForDate.booked} Ca</strong>
                  </div>
                </div>
                <div className="text-[11.5px] text-slate-500 text-center font-medium">
                  Đơn giá niêm yết: <strong className="text-emerald-700 font-bold">20.000 VNĐ / 1 Giờ</strong>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ TÌM KIẾM CÁC CA ĐÃ ĐẶT VÀ CHƯA ĐẶT */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-lg space-y-4">
              {/* Tiêu đề & Đếm số ca tìm được */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    {bookingStatusFilter === 'available' && <span className="text-emerald-600">🟢 Các Ca Chưa Đặt (Còn Trống)</span>}
                    {bookingStatusFilter === 'booked' && <span className="text-rose-600">🔴 Các Ca Đã Có Người Đặt</span>}
                    {bookingStatusFilter === 'all' && <span>⚪ Toàn Bộ 13 Ca Hoạt Động (07:00 – 22:00)</span>}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ngày thi đấu: <strong>{selectedBookingDate}</strong> {fieldSearchQuery && <span>• Lọc từ khóa: "{fieldSearchQuery}"</span>}
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 self-start sm:self-auto shrink-0">
                  Tìm thấy {filteredSlotsForFieldsTab.length} ca
                </span>
              </div>

              {/* Danh sách các ca kết quả */}
              {filteredSlotsForFieldsTab.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                  <span className="text-3xl block">🔍</span>
                  <h4 className="text-sm font-black text-slate-800">Không tìm thấy ca nào phù hợp!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Không có ca nào khớp với bộ lọc "{bookingStatusFilter === 'available' ? 'Chưa đặt' : bookingStatusFilter === 'booked' ? 'Đã đặt' : 'Tất cả'}" cho ngày {selectedBookingDate}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStatusFilter('all');
                      setFieldSearchQuery('');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer hover:bg-emerald-600"
                  >
                    Xem tất cả 13 ca trong ngày
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
                  {filteredSlotsForFieldsTab.map((slot) => {
                    const isAvailable = !slot.isBooked;
                    return (
                      <div
                        key={slot.id}
                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                          isAvailable
                            ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-300 hover:border-emerald-500 hover:shadow-md'
                            : 'bg-gradient-to-br from-rose-50/50 to-white border-rose-200 opacity-90'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-500">
                              {slot.slotLabel}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                              {isAvailable ? '🟢 Chưa Đặt' : '🔴 Đã Đặt'}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">
                              {slot.slotTime}
                            </h4>
                            <span className="text-emerald-700 font-black text-sm">
                              {formatVND(slot.price || 20000)} / giờ
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {isAvailable ? (
                              <span className="text-emerald-700 font-bold">✓ Sẵn sàng nhận đặt sân ngay</span>
                            ) : (
                              <span className="text-rose-700 font-semibold">
                                Khách đặt: <strong>{slot.customerName || 'Đã có khách giữ chỗ'}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={() => handleOpenBookingModal(slot)}
                              className="w-full py-2.5 rounded-xl bg-[#2ea44f] hover:bg-[#238636] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                            >
                              <span>⚡ ĐẶT SÂN NGAY</span>
                              <span>→</span>
                            </button>
                          ) : (
                            <div className="w-full py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs text-center border border-slate-200">
                              🔒 Khung giờ đã kín
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB KHÁCH HÀNG 2: LỊCH ĐẶT SÂN ================= */}
      {activeTab === 'booking-schedule' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Lịch Đặt Sân */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider inline-block">
                  📅 HỆ THỐNG ĐẶT SÂN THEO THỜI GIAN THỰC (NEON DB)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Lịch Đặt Sân & Tình Trạng Ca Còn Trống
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Xem ngay danh sách các ca đá bóng sáng, chiều và đêm muộn. Trực quan hóa tình trạng <strong>🟢 Chưa có người đặt</strong> (đặt giữ chỗ ngay) và <strong>🔴 Đã có người đặt</strong>.
                </p>
              </div>

              {/* Quick Summary Badges */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">Tổng số ca</span>
                  <strong className="text-lg font-black text-emerald-800">{bookingStatsForDate.total} Ca</strong>
                </div>
                <div className="bg-emerald-100/70 rounded-2xl p-3 border border-emerald-300 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 block">Còn trống</span>
                  <strong className="text-lg font-black text-emerald-900">{bookingStatsForDate.available} Ca</strong>
                </div>
                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 text-center">
                  <span className="text-[11px] font-bold text-rose-600 block">Đã đặt</span>
                  <strong className="text-lg font-black text-rose-800">{bookingStatsForDate.booked} Ca</strong>
                </div>
              </div>
            </div>

            {/* Bộ điều khiển chọn ngày & bộ lọc */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Chọn Ngày */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-1">Chọn ngày:</span>
                {[
                  { label: 'Hôm Nay (01/11)', val: '2026-11-01' },
                  { label: 'Ngày Mai (02/11)', val: '2026-11-02' },
                  { label: 'Ngày Kia (03/11)', val: '2026-11-03' },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setSelectedBookingDate(d.val)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedBookingDate === d.val
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
                <input
                  type="date"
                  value={selectedBookingDate}
                  onChange={(e) => setSelectedBookingDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Lọc Sân & Trạng Thái */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={bookingFieldFilter}
                  onChange={(e) => setBookingFieldFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">🏟️ Sân bóng C1 (Tất cả ca)</option>
                  <option value="field-c1">⭐ Sân bóng C1</option>
                </select>

                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">🔍 Tất cả trạng thái</option>
                  <option value="available">🟢 Chỉ ca còn trống</option>
                  <option value="booked">🔴 Chỉ ca đã có người đặt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danh sách các ca sân */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {computedFacilitySlots.map((slot) => {
              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                    slot.isBooked
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-emerald-200 hover:border-emerald-500 hover:shadow-lg'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-xs text-slate-700 truncate">{slot.fieldName}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          slot.isBooked
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {slot.isBooked ? '🔴 ĐÃ CÓ NGƯỜI ĐẶT' : '🟢 CHƯA CÓ NGƯỜI ĐẶT'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">{slot.slotTime}</h4>
                      <span className="text-[11px] font-bold text-slate-500">({slot.slotLabel})</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase">Giá thuê niêm yết:</span>
                      <strong className="text-base font-black text-emerald-700">{formatVND(slot.price)}</strong>
                    </div>

                    {slot.isBooked && (
                      <div className="mt-2 p-2.5 rounded-xl bg-white/80 border border-rose-200 text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="text-slate-400">Người đặt:</span>{' '}
                          <strong className="text-slate-800">{slot.customerName || 'Khách giữ chỗ'}</strong>
                        </div>
                        {slot.teamName && (
                          <div>
                            <span className="text-slate-400">Đội bóng:</span>{' '}
                            <span className="text-slate-700 font-bold">{slot.teamName}</span>
                          </div>
                        )}
                        {slot.services && (
                          <div className="text-[11px] text-slate-500">
                            <span className="text-slate-400">Dịch vụ:</span> {slot.services}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2">
                    {slot.isBooked ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs text-center cursor-not-allowed"
                        >
                          Đã có người giữ chỗ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(slot)}
                          className="px-3 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                          title="Hủy đặt ca này để giải phóng lịch"
                        >
                          Hủy ca
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenBookingModal(slot)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>ĐẶT CA NÀY NGAY</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB KHÁCH HÀNG 3: LIÊN HỆ ================= */}
      {activeTab === 'contact' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Liên Hệ */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-md">
            <div className="space-y-2 max-w-2xl">
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider inline-block">
                📞 HỖ TRỢ KHÁCH HÀNG & ĐẶT SÂN
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Liên Hệ Ban Quản Lý Sân Bóng C1
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chúng tôi sẵn sàng giải đáp mọi thắc mắc, tư vấn đặt sân theo tháng, đăng ký giao lưu câu lạc bộ hoặc tổ chức các giải đấu thể thao chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột 1: Thông Tin Liên Hệ & Cụm Sân */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>📍</span> Thông Tin Trực Tiếp Ban Quản Lý
                </h3>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xl shrink-0">🏟️</span>
                    <div>
                      <strong className="text-slate-900 block font-extrabold">Sân Bóng C1 (Cụm 2 Sân Cỏ Nhân Tạo)</strong>
                      <p className="text-slate-600 text-xs mt-0.5">1B Y Ngông, Phường Tân Tiến, TP. Buôn Ma Thuột</p>
                      <p className="text-emerald-700 text-xs font-bold mt-0.5">Quy mô: 2 sân bóng • Giá thuê: 250.000 – 350.000 đ/giờ</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xl shrink-0">📞</span>
                    <div>
                      <strong className="text-slate-900 block font-extrabold">Hotline Ban Quản Lý & Zalo Đặt Sân</strong>
                      <p className="text-emerald-800 font-black text-sm mt-0.5">0983 830 955 • 0906 424 006</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xl shrink-0">⏰</span>
                    <div>
                      <strong className="text-slate-900 block font-extrabold">Giờ Hoạt Động Của Sân</strong>
                      <p className="text-emerald-800 font-extrabold text-xs mt-0.5">Thứ 2 – Chủ nhật: 24/24 (Mở cửa 24/7 tất cả các ngày trong tuần)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xl shrink-0">💵</span>
                    <div>
                      <strong className="text-slate-900 block font-extrabold">Đơn Giá Thuê Sân Niêm Yết</strong>
                      <p className="text-emerald-800 font-black text-sm mt-0.5">250.000 – 350.000 VNĐ / giờ (Khung giờ ngày: 250k • Giờ tối có đèn: 350k)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-xl shrink-0">⚽</span>
                    <div>
                      <strong className="text-slate-900 block font-extrabold">Dịch Vụ Phục Vụ Tại Sân</strong>
                      <p className="text-slate-600 text-xs mt-0.5">Bóng thi đấu Molten, Áo bib 2 màu chia đội, Nước khoáng ướp lạnh, Trọng tài bắt giải</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2: Form Gửi Thắc Mắc & Yêu Cầu */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>✉️</span> Gửi Yêu Cầu Tư Vấn / Đặt Lịch Định Kỳ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điền thông tin bên dưới, nhân viên phụ trách sẽ gọi điện phản hồi trong vòng 15 phút.
                </p>
              </div>

              {contactSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs space-y-1">
                  <strong className="block font-black text-sm">✓ Yêu cầu đã được gửi thành công!</strong>
                  <p>Cảm ơn bạn {contactForm.name}, ban quản lý sân sẽ chủ động liên hệ qua số điện thoại {contactForm.phone}.</p>
                </div>
              )}

              <form onSubmit={handleSubmitContact} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên của bạn: *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="VD: Trần Văn Hùng"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại liên hệ: *</label>
                    <input
                      type="tel"
                      required
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="VD: 0988123456"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email (nếu có):</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="VD: hung@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sân bóng quan tâm:</label>
                  <select
                    value={contactForm.fieldInterest}
                    onChange={(e) => setContactForm({ ...contactForm, fieldInterest: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {fieldFacilities.map((f) => (
                      <option key={f.id} value={f.name}>{f.name} - {f.location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung yêu cầu / thắc mắc:</label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="VD: Tôi muốn đặt cố định sân vào tối Thứ 3 và Thứ 5 hàng tuần từ 19:00 đến 20:30..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>GỬI YÊU CẦU CHO BAN QUẢN LÝ</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 1: QUẢN LÝ ĐỘI ================= */}
      {user && activeTab === 'teams' && (
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
      {user && activeTab === 'members' && (
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
      {user && activeTab === 'coaches' && (
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
      {user && activeTab === 'schedules' && (
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
      {user && activeTab === 'attendance' && (
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
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSavingAttendance ? '⏳ Đang lưu Neon DB...' : '💾 Lưu Điểm Danh'}
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
      {user && activeTab === 'finances' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
                <span>💰</span>
                <span>TÀI CHÍNH & QUỸ CÂU LẠC BỘ</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                Quản Lý Thu Chi & Phí Cầu Thủ Hàng Tháng / Năm
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi chi tiết tiến độ nộp phí của từng cầu thủ theo 12 tháng, năm tài chính và sổ thu chi tổng hợp
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {financeSubTab === 'player-fees' && (
                <>
                  <button
                    onClick={handleExportFeeCSV}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-emerald-300 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Xuất bảng thu phí ra file CSV chuẩn tiếng Việt"
                  >
                    <span>📊</span>
                    <span>Xuất CSV</span>
                  </button>
                  <button
                    onClick={handlePrintFeeReport}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    title="In bảng tổng hợp thu phí câu lạc bộ"
                  >
                    <span>🖨️</span>
                    <span>In Báo Cáo</span>
                  </button>
                  {canManage && (
                    <button
                      onClick={() => handleRemindUnpaid(selectedFeeMonth, selectedFeeYear)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Gửi thông báo nhắc nộp phí tới các cầu thủ còn nợ"
                    >
                      <span>📢</span>
                      <span>Nhắc Nợ Phí</span>
                    </button>
                  )}
                </>
              )}

              {financeSubTab === 'ledger' && canManageClub && (
                <button
                  onClick={() => setShowAddFinanceModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span>
                  <span>Ghi Nhận Thu / Chi Mới</span>
                </button>
              )}
            </div>
          </div>

          {/* SUB-TABS PHÂN HỆ TÀI CHÍNH */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFinanceSubTab('player-fees')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                financeSubTab === 'player-fees'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📑</span>
              <span>1. Bảng Thu Phí Cầu Thủ Hàng Tháng & Năm</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-black">
                {members.length} Cầu thủ
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFinanceSubTab('ledger')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                financeSubTab === 'ledger'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📜</span>
              <span>2. Sổ Thu Chi Chi Tiết CLB</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-black">
                {transactions.length} Giao dịch
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFinanceSubTab('reports')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                financeSubTab === 'reports'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📊</span>
              <span>3. Báo Cáo Phân Tích & Quỹ CLB</span>
            </button>
          </div>

          {/* ================= TAB 1: BẢNG THU PHÍ CẦU THỦ THEO THÁNG & NĂM ================= */}
          {financeSubTab === 'player-fees' && (
            <div className="space-y-6">
              {/* 4 Thẻ KPI Phí Cầu Thủ */}
              {(() => {
                const yearFees = playerFees.filter((f) => f.year === selectedFeeYear);
                const totalPaidAmount = yearFees
                  .filter((f) => f.status === 'paid')
                  .reduce((sum, f) => sum + (f.amount || 300000), 0);
                const totalPossibleSlots = members.length * 12;
                const totalTargetAmount = totalPossibleSlots * 300000;
                const totalDebtAmount = Math.max(0, totalTargetAmount - totalPaidAmount);
                const paidSlotCount = yearFees.filter((f) => f.status === 'paid').length;
                const percentComplete = totalPossibleSlots > 0 ? Math.round((paidSlotCount / totalPossibleSlots) * 100) : 0;

                const currentMonthPaidCount = members.filter((m) => {
                  const targetM = selectedFeeMonth === 'all' ? 11 : selectedFeeMonth;
                  const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === targetM);
                  return f?.status === 'paid';
                }).length;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-5 border-2 border-emerald-400 shadow-lg relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50">
                      <div className="h-2 bg-emerald-600 -mx-5 -mt-5 mb-3"></div>
                      <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                        <span>💵</span> Định Mức Phí Sinh Hoạt
                      </span>
                      <div className="mt-1 text-2xl font-black text-emerald-950">300.000 VNĐ</div>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        / cầu thủ / tháng (3.600.000đ / năm)
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500 shadow-lg relative overflow-hidden bg-gradient-to-br from-white to-emerald-50">
                      <div className="h-2 bg-emerald-600 -mx-5 -mt-5 mb-3"></div>
                      <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                        <span>📈</span> Đã Thu Năm {selectedFeeYear}
                      </span>
                      <div className="mt-1 text-2xl font-black text-emerald-700">
                        {formatVND(totalPaidAmount)}
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1 font-bold">
                        ✓ {paidSlotCount}/{totalPossibleSlots} lượt tháng đã nộp
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border-2 border-rose-300 shadow-lg relative overflow-hidden bg-gradient-to-br from-white to-rose-50/40">
                      <div className="h-2 bg-rose-500 -mx-5 -mt-5 mb-3"></div>
                      <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider flex items-center gap-1.5">
                        <span>⏳</span> Còn Nợ Trong Năm {selectedFeeYear}
                      </span>
                      <div className="mt-1 text-2xl font-black text-rose-700">
                        {formatVND(totalDebtAmount)}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        Cần tiếp tục thu nộp quỹ CLB
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border-2 border-teal-400 shadow-lg relative overflow-hidden bg-gradient-to-br from-white to-teal-50">
                      <div className="h-2 bg-teal-600 -mx-5 -mt-5 mb-3"></div>
                      <span className="text-[11px] font-black uppercase text-teal-800 tracking-wider flex items-center gap-1.5">
                        <span>🎯</span> Tỷ Lệ Hoàn Thành Năm
                      </span>
                      <div className="mt-1 text-2xl font-black text-teal-700 flex items-baseline gap-2">
                        <span>{percentComplete}%</span>
                        <span className="text-xs font-bold text-slate-500">
                          (Tháng {selectedFeeMonth === 'all' ? 11 : selectedFeeMonth}: {currentMonthPaidCount}/{members.length})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentComplete}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* THANH ĐIỀU KHIỂN & BỘ LỌC CHI TIẾT */}
              <div className="bg-white rounded-3xl border-2 border-emerald-300 p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Chọn Năm tài chính */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      📅 Năm Tài Chính:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[2026, 2025, 2024].map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setSelectedFeeYear(y)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            selectedFeeYear === y
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {y} {y === 2026 ? '(Hiện tại)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lọc Tuyến Đội & Trạng Thái */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-700">Đội:</span>
                      <select
                        value={feeTeamFilter}
                        onChange={(e) => setFeeTeamFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-bold focus:border-emerald-600 outline-none text-xs"
                      >
                        <option value="Tất cả">Tất cả tuyến đội ({members.length})</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-700">Trạng thái:</span>
                      <select
                        value={feeStatusFilter}
                        onChange={(e) => setFeeStatusFilter(e.target.value as any)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-bold focus:border-emerald-600 outline-none text-xs"
                      >
                        <option value="all">Tất cả tình trạng</option>
                        <option value="paid">🟢 Đã nộp đủ</option>
                        <option value="unpaid">🔴 Còn nợ phí</option>
                      </select>
                    </div>

                    {/* Tìm kiếm */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm tên / số áo cầu thủ..."
                        value={feeSearch}
                        onChange={(e) => setFeeSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs font-semibold focus:border-emerald-600 outline-none w-44 sm:w-56"
                      />
                      <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                    </div>
                  </div>
                </div>

                {/* Thanh chọn Tháng: Cả Năm hoặc Tháng 1 -> 12 */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-emerald-950 mr-1">Chế độ xem:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFeeMonth('all')}
                    className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                      selectedFeeMonth === 'all'
                        ? 'bg-emerald-800 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ⭐ Cả Năm (Ma Trận 12 Tháng)
                  </button>

                  <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mNum) => {
                    const isSelected = selectedFeeMonth === mNum;
                    const paidInThisMonth = members.filter((m) => {
                      const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === mNum);
                      return f?.status === 'paid';
                    }).length;

                    return (
                      <button
                        key={mNum}
                        type="button"
                        onClick={() => setSelectedFeeMonth(mNum)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title={`Xem chi tiết Tháng ${mNum}/${selectedFeeYear} (${paidInThisMonth}/${members.length} đã nộp)`}
                      >
                        <span>T{mNum}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                          isSelected ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {paidInThisMonth}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= VIEW 1: MA TRẬN 12 THÁNG (FULL YEAR MATRIX) ================= */}
              {selectedFeeMonth === 'all' ? (
                <div className="bg-white rounded-3xl border-2 border-emerald-400 shadow-xl overflow-hidden">
                  <div className="p-4 bg-emerald-50/90 border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-sm text-emerald-950 flex items-center gap-2">
                        <span>📊</span> Bảng Ma Trận Phí Sinh Hoạt Cầu Thủ 12 Tháng - Năm {selectedFeeYear}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Nhấn trực tiếp vào từng ô tháng để chuyển đổi trạng thái nộp hoặc nhấn &quot;Thu phí&quot; để ghi nhận chi tiết
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-800 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Đã nộp đủ (✓)
                      </span>
                      <span className="flex items-center gap-1 text-rose-700 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Chưa đóng / Nợ (✕)
                      </span>
                      <span className="text-slate-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        Hiển thị: <strong>{filteredMembersForFee.length}</strong> cầu thủ
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="green-table-header font-black uppercase tracking-wider border-b-2 border-emerald-700 text-white">
                        <tr>
                          <th className="p-3 text-center">STT</th>
                          <th className="p-3 min-w-[180px]">Cầu Thủ</th>
                          <th className="p-3 min-w-[140px]">Tuyến Đội</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i + 1} className="p-2.5 text-center min-w-[54px]">
                              T{i + 1}
                            </th>
                          ))}
                          <th className="p-3 text-right min-w-[120px]">Tổng Đã Đóng</th>
                          <th className="p-3 text-center min-w-[100px]">Tiến Độ</th>
                          <th className="p-3 text-center min-w-[130px]">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 text-slate-700">
                        {filteredMembersForFee.length === 0 ? (
                          <tr>
                            <td colSpan={18} className="p-10 text-center text-slate-400">
                              Không tìm thấy cầu thủ nào phù hợp với bộ lọc hiện tại.
                            </td>
                          </tr>
                        ) : (
                          filteredMembersForFee.map((m, idx) => {
                            const mFees = playerFees.filter((f) => f.playerId === m.id && f.year === selectedFeeYear);
                            const paidCount = mFees.filter((f) => f.status === 'paid').length;
                            const totalPaid = paidCount * 300000;
                            const isGood = paidCount >= 10;

                            return (
                              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                                      #{m.jerseyNumber}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-slate-900 hover:text-emerald-700 cursor-pointer" onClick={() => setSelectedFeePlayer(m)}>
                                        {m.name}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-medium">{m.position}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block line-clamp-1 max-w-[150px]">
                                    {m.teamName.replace('Sao Vàng FC - ', '')}
                                  </span>
                                </td>

                                {/* 12 Cột tháng */}
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((mNum) => {
                                  const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === mNum);
                                  const isPaid = f ? f.status === 'paid' : false;

                                  return (
                                    <td key={mNum} className="p-1.5 text-center">
                                      <button
                                        type="button"
                                        disabled={!canManage}
                                        onClick={() => handleToggleFeeStatus(m.id, selectedFeeYear, mNum)}
                                        className={`w-full py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-0.5 border cursor-pointer ${
                                          isPaid
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 shadow-sm'
                                            : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                        } ${!canManage ? 'cursor-default opacity-90' : ''}`}
                                        title={
                                          isPaid
                                            ? `Tháng ${mNum}/${selectedFeeYear}: ĐÃ NỘP 300.000 VNĐ (${f?.paidDate || 'Đã nộp'}) • Nhấn để đổi`
                                            : `Tháng ${mNum}/${selectedFeeYear}: CHƯA NỘP • Nhấn để đánh dấu đã nộp`
                                        }
                                      >
                                        <span>{isPaid ? '✓' : '✕'}</span>
                                      </button>
                                    </td>
                                  );
                                })}

                                {/* Tổng đã đóng */}
                                <td className="p-3 text-right font-black text-emerald-800 text-xs">
                                  {formatVND(totalPaid)}
                                </td>

                                {/* Tiến độ */}
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                      isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {paidCount}/12 Tháng
                                    </span>
                                    <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${isGood ? 'bg-emerald-600' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.round((paidCount / 12) * 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>

                                {/* Thao tác */}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {canManage && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPayFeeTarget({
                                            member: m,
                                            month: 11,
                                            year: selectedFeeYear,
                                            amount: 300000,
                                            paymentMethod: 'Chuyển khoản',
                                            notes: '',
                                          })
                                        }
                                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                                        title="Ghi nhận thu phí nhanh cho cầu thủ này"
                                      >
                                        + Thu Phí
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedFeePlayer(m)}
                                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                      title="Xem hồ sơ thu chi & biên lai cá nhân"
                                    >
                                      👁️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ================= VIEW 2: CHI TIẾT 1 THÁNG CỤ THỂ ================= */
                <div className="bg-white rounded-3xl border-2 border-emerald-400 shadow-xl overflow-hidden">
                  <div className="p-4 bg-emerald-50/90 border-b-2 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-sm text-emerald-950 flex items-center gap-2">
                        <span>📋</span> Danh Sách Chi Tiết Thu Phí Cầu Thủ Tháng {selectedFeeMonth} Năm {selectedFeeYear}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Định mức: <strong>300.000 VNĐ / cầu thủ</strong> • Hạn nộp định kỳ ngày 10 hàng tháng
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFeeMonth('all')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300"
                      >
                        ← Quay lại xem Ma trận 12 Tháng
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="green-table-header font-black uppercase tracking-wider border-b-2 border-emerald-700 text-white">
                        <tr>
                          <th className="p-4 text-center">STT</th>
                          <th className="p-4">Cầu Thủ</th>
                          <th className="p-4">Tuyến Đội</th>
                          <th className="p-4 text-center">Trạng Thái</th>
                          <th className="p-4 text-right">Số Tiền (VNĐ)</th>
                          <th className="p-4">Ngày Đóng</th>
                          <th className="p-4">Phương Thức</th>
                          <th className="p-4">Mã Biên Lai</th>
                          <th className="p-4 text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 text-slate-700">
                        {filteredMembersForFee.map((m, idx) => {
                          const f = playerFees.find(
                            (x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === selectedFeeMonth
                          );
                          const isPaid = f?.status === 'paid';

                          return (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                                    #{m.jerseyNumber}
                                  </div>
                                  <div>
                                    <p
                                      className="font-extrabold text-slate-900 hover:text-emerald-700 cursor-pointer"
                                      onClick={() => setSelectedFeePlayer(m)}
                                    >
                                      {m.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{m.position}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-700">{m.teamName}</td>
                              <td className="p-4 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1 ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}
                                >
                                  <span>{isPaid ? '✓' : '✕'}</span>
                                  <span>{isPaid ? 'Đã Nộp Đủ' : 'Chưa Đóng / Nợ'}</span>
                                </span>
                              </td>
                              <td className="p-4 text-right font-black text-emerald-800 text-sm">
                                {formatVND(300000)}
                              </td>
                              <td className="p-4 font-mono text-slate-600">{f?.paidDate || '—'}</td>
                              <td className="p-4 font-semibold text-slate-700">
                                {f?.paymentMethod ? (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                                    {f.paymentMethod === 'Chuyển khoản' ? '💳 CK' : '💵 Tiền mặt'}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-500">{f?.receiptNo || '—'}</td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {canManage && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleFeeStatus(
                                          m.id,
                                          selectedFeeYear,
                                          selectedFeeMonth as number
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                        isPaid
                                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                      }`}
                                    >
                                      {isPaid ? 'Đánh dấu Chưa nộp' : '✓ Xác nhận Đã nộp'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFeePlayer(m)}
                                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    title="Xem chi tiết tài chính cầu thủ"
                                  >
                                    👁️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: SỔ THU CHI CHI TIẾT CLB (GENERAL LEDGER) ================= */}
          {financeSubTab === 'ledger' && (
            <div className="space-y-6">
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
                    <span>✓</span> Đã có {paidMembersCount}/{members.length} thành viên hoàn thành nộp phí tháng
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
                        {canManage && <th className="p-4 text-center">Thao Tác</th>}
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
                          {canManage && (
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa giao dịch khỏi Neon Database"
                              >
                                🗑️
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: BÁO CÁO PHÂN TÍCH TÀI CHÍNH ================= */}
          {financeSubTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Biểu đồ thu nộp 12 tháng năm 2026 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <span>📊</span> Tiến Độ Thu Phí 12 Tháng Năm {selectedFeeYear}
                    </h4>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Tỷ lệ đạt
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mNum) => {
                      const paidCount = members.filter((m) => {
                        const f = playerFees.find((x) => x.playerId === m.id && x.year === selectedFeeYear && x.month === mNum);
                        return f?.status === 'paid';
                      }).length;
                      const percent = Math.round((paidCount / members.length) * 100);

                      return (
                        <div key={mNum} className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-slate-700 w-16">Tháng {mNum}:</span>
                          <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percent >= 80 ? 'bg-emerald-600' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="font-black text-slate-800 w-24 text-right">
                            {paidCount}/{members.length} ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* So sánh năm 2025 vs 2026 & Tình hình quỹ */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-xl space-y-4">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-emerald-100">
                      <span>⚖️</span> So Sánh Thu Quỹ Cầu Thủ 2 Năm Gần Nhất
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-bold text-slate-500">Năm 2025 (Đã kết toán)</p>
                        <p className="text-xl font-black text-slate-800 mt-1">72.000.000 đ</p>
                        <p className="text-[11px] text-emerald-700 font-bold mt-1">✓ 100% hoàn thành</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300">
                        <p className="text-xs font-bold text-emerald-800">Năm 2026 (Đang tiến hành)</p>
                        <p className="text-xl font-black text-emerald-800 mt-1">
                          {formatVND(
                            playerFees
                              .filter((f) => f.year === 2026 && f.status === 'paid')
                              .reduce((s, f) => s + (f.amount || 300000), 0)
                          )}
                        </p>
                        <p className="text-[11px] text-emerald-800 font-bold mt-1">⚡ Tiến độ 11/12 tháng</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 shadow-xl space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      🛡️ ĐÁNH GIÁ SỨC KHỎE TÀI CHÍNH CLB
                    </span>
                    <h4 className="font-black text-lg text-white">Quỹ Dự Phòng Đảm Bảo Hoạt Động Ổn Định</h4>
                    <p className="text-xs text-emerald-100 leading-relaxed">
                      Quỹ câu lạc bộ duy trì số dư dương với tỷ lệ thu nộp của cầu thủ đạt trên 80%. Đảm bảo đầy đủ kinh phí chi trả thuê sân bãi, thiết bị tập luyện và y tế phục hồi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODULE 7: QUẢN LÝ THÔNG BÁO ================= */}
      {user && activeTab === 'announcements' && (
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

      {/* ================= CHUYÊN TRANG: KẾT QUẢ & PHONG ĐỘ ================= */}
      {activeTab === 'results' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] rounded-3xl p-6 sm:p-8 text-white border-2 border-emerald-400/40 shadow-xl">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block mb-1">
              📊 THỐNG KÊ CHIẾN TÍCH & PHONG ĐỘ THI ĐẤU
            </span>
            <h3 className="text-2xl font-black text-white">Kết Quả Các Trận Đấu & Phong Độ Toàn Đội</h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
              Tổng hợp kết quả các trận giao hữu, giải bóng đá phong trào ngoại hạng và cúp khu vực của các tuyến đội Sao Vàng FC.
            </p>
          </div>

          {/* 4 Thẻ KPI Phong Độ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-md">
              <span className="text-xs text-slate-500 font-bold block">Tỷ Lệ Chiến Thắng</span>
              <strong className="text-2xl font-black text-emerald-700 block mt-1">75%</strong>
              <span className="text-[11px] text-emerald-600 font-semibold">6 Thắng / 1 Hòa / 1 Thua</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-md">
              <span className="text-xs text-slate-500 font-bold block">Tổng Bàn Thắng</span>
              <strong className="text-2xl font-black text-emerald-700 block mt-1">21 Bàn</strong>
              <span className="text-[11px] text-slate-500 font-semibold">Trung bình 2.6 bàn/trận</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-md">
              <span className="text-xs text-slate-500 font-bold block">Trận Sạch Lưới</span>
              <strong className="text-2xl font-black text-emerald-700 block mt-1">4 Trận</strong>
              <span className="text-[11px] text-slate-500 font-semibold">Hàng thủ kỷ luật cao</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-md">
              <span className="text-xs text-slate-500 font-bold block">Cầu Thủ Ghi Bàn Số 1</span>
              <strong className="text-base font-black text-emerald-700 block mt-1">Hoàng Minh Huy (#10)</strong>
              <span className="text-[11px] text-emerald-600 font-semibold">7 Bàn thắng & 4 Kiến tạo</span>
            </div>
          </div>

          {/* Danh sách các trận đấu gần nhất */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-4">
            <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
              <span>⚽</span> Chi Tiết Các Trận Đấu Gần Đây
            </h4>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500 font-bold">10/10/2026 • Giải Ngoại Hạng Phong Trào • Sân Sao Vàng A</span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">THẮNG</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 font-black text-base text-slate-900">
                    <span>⚽ Sao Vàng FC</span>
                  </div>
                  <div className="text-xl font-black text-emerald-700 px-4 py-1 rounded-2xl bg-white border-2 border-emerald-300 shadow-inner">
                    3 - 1
                  </div>
                  <div className="flex items-center gap-2 font-black text-base text-slate-700">
                    <span>FC Rồng Đỏ</span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs mt-2 pt-2 border-t border-emerald-200/60">
                  ⚽ <strong>Bàn thắng:</strong> Hoàng Minh Huy (15&apos;, 45&apos;), Nguyễn Đức Thắng (78&apos;) • <strong>MVP:</strong> Hoàng Minh Huy
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-white border-2 border-amber-300 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500 font-bold">17/10/2026 • Giao Hữu Thử Nghiệm • Sân Thống Nhất</span>
                  <span className="px-3 py-0.5 rounded-full bg-amber-500 text-white font-black text-[11px]">HÒA</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 font-black text-base text-slate-900">
                    <span>⚽ Sao Vàng FC</span>
                  </div>
                  <div className="text-xl font-black text-amber-700 px-4 py-1 rounded-2xl bg-white border-2 border-amber-300 shadow-inner">
                    2 - 2
                  </div>
                  <div className="flex items-center gap-2 font-black text-base text-slate-700">
                    <span>Hổ Biển FC</span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs mt-2 pt-2 border-t border-amber-200/60">
                  ⚽ <strong>Bàn thắng:</strong> Bùi Văn Kiên (22&apos;), Hoàng Minh Huy (60&apos;) • <strong>MVP:</strong> Bùi Văn Kiên
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 shadow-sm">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500 font-bold">28/09/2026 • Cúp Mùa Thu • Sân Phú Thọ</span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">THẮNG</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 font-black text-base text-slate-900">
                    <span>⚽ Sao Vàng FC</span>
                  </div>
                  <div className="text-xl font-black text-emerald-700 px-4 py-1 rounded-2xl bg-white border-2 border-emerald-300 shadow-inner">
                    1 - 0
                  </div>
                  <div className="flex items-center gap-2 font-black text-base text-slate-700">
                    <span>Sông Hồng Utd</span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs mt-2 pt-2 border-t border-emerald-200/60">
                  ⚽ <strong>Bàn thắng:</strong> Nguyễn Đức Thắng (88&apos;) • <strong>MVP:</strong> Thủ môn Nguyễn Văn Khải
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHUYÊN TRANG: VỀ CLB SAO VÀNG ================= */}
      {activeTab === 'about' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl p-8 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white border-2 border-emerald-400 shadow-xl">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block mb-2">
              ⭐ BẢN SẮC, TRUYỀN THỐNG & SỨ MỆNH
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              &ldquo;Đoàn Kết - Kỷ Luật - Tinh Thần Thể Thao Cống Hiến&rdquo;
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-3 leading-relaxed max-w-3xl">
              Thành lập từ năm 2015, Sao Vàng FC là mái nhà chung kết nối niềm đam mê sân cỏ, đào tạo thể chất toàn diện và bồi dưỡng đạo đức thể thao cho các thế hệ cầu thủ trẻ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-md space-y-2">
              <span className="text-3xl">🏆</span>
              <h4 className="font-black text-base text-slate-900">Mục Tiêu Phát Triển</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Xây dựng mô hình bóng đá phong trào bài bản, chuyên nghiệp, tiến tới tham dự các giải quốc gia và phát triển học viện đào tạo trẻ U17 - U21.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-md space-y-2">
              <span className="text-3xl">🏟️</span>
              <h4 className="font-black text-base text-slate-900">Cơ Sở Vật Chất</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống sân bóng Sao Vàng A (Sân 7), Sân B (Sân 11) đạt chuẩn cỏ nhân tạo FIFA Quality cùng phòng thể lực VO2Max và y tế phục hồi.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-md space-y-2">
              <span className="text-3xl">🤝</span>
              <h4 className="font-black text-base text-slate-900">Văn Hóa Câu Lạc Bộ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tôn trọng đồng đội, trọng tài và đối thủ. Chơi bóng nhiệt huyết, kỷ luật chiến thuật và lan tỏa tinh thần sống khỏe, sống đẹp.
              </p>
            </div>
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

      {/* ================= MODAL 8: GHI NHẬN THU PHÍ CẦU THỦ ================= */}
      {payFeeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-emerald-400 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
                  💳
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">Ghi Nhận Thu Phí Cầu Thủ</h3>
                  <p className="text-xs text-emerald-700 font-bold">
                    {payFeeTarget.member.name} (#{payFeeTarget.member.jerseyNumber}) • {payFeeTarget.member.teamName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayFeeTarget(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayFee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tháng Thu</label>
                  <select
                    value={payFeeTarget.month}
                    onChange={(e) => setPayFeeTarget({ ...payFeeTarget, month: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Năm Tài Chính</label>
                  <select
                    value={payFeeTarget.year}
                    onChange={(e) => setPayFeeTarget({ ...payFeeTarget, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value={2026}>Năm 2026</option>
                    <option value={2025}>Năm 2025</option>
                    <option value={2024}>Năm 2024</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Tiền Thu (VNĐ)</label>
                  <input
                    type="number"
                    min={10000}
                    step={10000}
                    required
                    value={payFeeTarget.amount}
                    onChange={(e) => setPayFeeTarget({ ...payFeeTarget, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-black text-emerald-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hình Thức Thanh Toán</label>
                  <select
                    value={payFeeTarget.paymentMethod}
                    onChange={(e) => setPayFeeTarget({ ...payFeeTarget, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Chuyển khoản">💳 Chuyển khoản (VietQR / Internet Banking)</option>
                    <option value="Tiền mặt">💵 Tiền mặt (Trực tiếp cho Thủ quỹ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ghi Chú & Mã Tham Chiếu</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chuyển khoản, lý do giảm trừ..."
                  value={payFeeTarget.notes}
                  onChange={(e) => setPayFeeTarget({ ...payFeeTarget, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                💡 <strong>Tự động đồng bộ:</strong> Khoản thu này sẽ lập tức được cập nhật vào Ma trận nộp phí và tự động ghi thêm 1 giao dịch thu vào <strong>Sổ Thu Chi Neon DB</strong> của CLB.
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayFeeTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black shadow-md cursor-pointer"
                >
                  Xác Nhận & Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 9: HỒ SƠ TÀI CHÍNH & LỊCH SỬ NỘP PHÍ CỦA CẦU THỦ ================= */}
      {selectedFeePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white border-2 border-emerald-400 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-500 text-white font-black flex items-center justify-center text-xl shadow-md">
                  #{selectedFeePlayer.jerseyNumber}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{selectedFeePlayer.name}</h3>
                  <p className="text-xs text-emerald-800 font-bold">
                    {selectedFeePlayer.position} • {selectedFeePlayer.teamName} • SĐT: {selectedFeePlayer.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeePlayer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thống kê cá nhân cầu thủ */}
            {(() => {
              const pFees2026 = playerFees.filter((f) => f.playerId === selectedFeePlayer.id && f.year === 2026);
              const pPaid2026 = pFees2026.filter((f) => f.status === 'paid').length;
              const pTotal2026 = pPaid2026 * 300000;
              const pDebt2026 = Math.max(0, 12 * 300000 - pTotal2026);

              return (
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <p className="text-slate-500 font-bold">Đã Đóng Năm 2026</p>
                    <p className="text-lg font-black text-emerald-800 mt-1">{formatVND(pTotal2026)}</p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">({pPaid2026}/12 Tháng)</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                    <p className="text-slate-500 font-bold">Còn Nợ Năm 2026</p>
                    <p className="text-lg font-black text-rose-700 mt-1">{formatVND(pDebt2026)}</p>
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">({12 - pPaid2026} Tháng chưa nộp)</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-500 font-bold">Năm 2025 (Lịch sử)</p>
                    <p className="text-lg font-black text-slate-800 mt-1">3.600.000 đ</p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">✓ Hoàn tất 12/12</p>
                  </div>
                </div>
              );
            })()}

            {/* Chi tiết từng tháng năm 2026 */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center justify-between">
                <span>📅 Chi Tiết Thu Phí 12 Tháng Năm 2026</span>
                <span className="text-[11px] font-bold text-slate-500">Định mức: 300.000đ/tháng</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((mNum) => {
                  const f = playerFees.find((x) => x.playerId === selectedFeePlayer.id && x.year === 2026 && x.month === mNum);
                  const isPaid = f?.status === 'paid';

                  return (
                    <div
                      key={mNum}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                        isPaid
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-rose-50/70 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">Tháng {mNum}/2026</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            isPaid
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {isPaid ? 'Đã nộp' : 'Nợ'}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        {isPaid ? (
                          <>
                            <p className="font-mono text-[10px] text-emerald-800">📅 {f?.paidDate || '2026-10-10'}</p>
                            <p className="text-[10px] text-slate-500">Biên lai: {f?.receiptNo || 'REC-2026'}</p>
                          </>
                        ) : (
                          <p className="text-rose-600 font-bold">Chưa hoàn tất</p>
                        )}
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleToggleFeeStatus(selectedFeePlayer.id, 2026, mNum)}
                          className="mt-2 text-[10px] font-bold text-center py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          {isPaid ? 'Chuyển sang Nợ' : '✓ Đánh dấu Đã Nộp'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPayFeeTarget({
                    member: selectedFeePlayer,
                    month: 11,
                    year: 2026,
                    amount: 300000,
                    paymentMethod: 'Chuyển khoản',
                    notes: '',
                  });
                  setSelectedFeePlayer(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                + Ghi Nhận Thu Phí Cho Cầu Thủ Này
              </button>

              <button
                type="button"
                onClick={() => setSelectedFeePlayer(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 9: ĐẶT SÂN TRỰC TUYẾN CHO KHÁCH HÀNG ================= */}
      {bookingTargetSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white border-2 border-emerald-400 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
                  ⚽
                </span>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    Đặt Sân Bóng Đá Trực Tuyến
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">Sân bóng C1 • 1B Y Ngông, Buôn Ma Thuột • Thứ 2 – Chủ nhật: 24/24 • Giá: 250k – 350k/h</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingTargetSlot(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin ca sân đang chọn */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white space-y-2 border border-emerald-400/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  Ca Đặt Được Chọn
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black">
                  🟢 CHƯA CÓ NGƯỜI ĐẶT
                </span>
              </div>
              <h4 className="text-lg font-black text-white">{bookingTargetSlot.fieldName}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-emerald-100">
                <div className="bg-white/10 px-2.5 py-1.5 rounded-xl">
                  <span className="block text-[10px] text-emerald-300 font-bold">Ngày Thi Đấu</span>
                  <strong className="text-white">📅 {selectedBookingDate}</strong>
                </div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-xl">
                  <span className="block text-[10px] text-emerald-300 font-bold">Khung Giờ Ca (1 Giờ)</span>
                  <strong className="text-white">⏰ {bookingTargetSlot.slotTime}</strong>
                </div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-xl col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-emerald-300 font-bold">Đơn Giá Thuê</span>
                  <strong className="text-emerald-300 font-black">{formatVND(bookingTargetSlot.price)}</strong>
                </div>
              </div>
            </div>

            {/* Form Điền Thông Tin Khách Hàng */}
            <form onSubmit={handleConfirmCustomerBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 flex items-center gap-1">
                    <span>👤</span> Họ và tên người đặt sân <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={customerBookingForm.customerName}
                    onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 flex items-center gap-1">
                    <span>📞</span> Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912 345 678"
                    value={customerBookingForm.customerPhone}
                    onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, customerPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 flex items-center gap-1">
                  <span>🛡️</span> Tên đội bóng / Cơ quan (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: FC Anh Em Bắc Từ Liêm, Công ty Viettel..."
                  value={customerBookingForm.teamName}
                  onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, teamName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Dịch vụ tiện ích cộng thêm */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] block">
                  🎁 Dịch Vụ Tiện Ích Cộng Thêm (Tùy chọn):
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={customerBookingForm.needWater}
                        onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, needWater: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800">Thùng nước khoáng Lavie ướp lạnh (24 chai)</span>
                    </div>
                    <span className="font-black text-emerald-700">+50.000 đ</span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={customerBookingForm.needRef}
                        onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, needRef: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800">Thuê tổ trọng tài bắt trận (Chuẩn VFF)</span>
                    </div>
                    <span className="font-black text-emerald-700">+200.000 đ</span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={customerBookingForm.needBibs}
                        onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, needBibs: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800">Bộ áo pitch phân biệt 2 màu thi đấu</span>
                    </div>
                    <span className="font-black text-emerald-700">+40.000 đ</span>
                  </label>
                </div>
              </div>

              {/* Ghi chú thêm */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 flex items-center gap-1">
                  <span>📝</span> Yêu cầu đặc biệt hoặc ghi chú cho ban quản lý sân
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cần mượn 2 bóng thi đấu Molten, bật đèn chiếu sáng sớm 10 phút..."
                  value={customerBookingForm.notes}
                  onChange={(e) => setCustomerBookingForm({ ...customerBookingForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Tạm tính chi phí thanh toán */}
              {(() => {
                let extra = 0;
                if (customerBookingForm.needWater) extra += 50000;
                if (customerBookingForm.needRef) extra += 200000;
                if (customerBookingForm.needBibs) extra += 40000;
                const total = bookingTargetSlot.price + extra;

                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">TỔNG CHI PHÍ TẠM TÍNH:</span>
                      <span className="text-xs text-slate-600">Thanh toán tại quầy lễ tân khi đến nhận sân</span>
                    </div>
                    <strong className="text-xl font-black text-emerald-800">{formatVND(total)}</strong>
                  </div>
                );
              })()}

              {/* Nút hành động */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingTargetSlot(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-lg shadow-emerald-700/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBooking ? (
                    <span>⏳ Đang xử lý giữ sân...</span>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Xác Nhận Đặt Sân Giữ Chỗ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 10: BIÊN LAI / PHIẾU ĐẶT SÂN THÀNH CÔNG ================= */}
      {bookingSuccessReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-emerald-500 p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-black mx-auto ring-8 ring-emerald-50 animate-bounce">
                🎉
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Đặt Sân Thành Công!
              </h3>
              <p className="text-xs text-slate-600">
                Lịch đá bóng của bạn đã được ghi nhận vào hệ thống và chuyển trạng thái sang <strong className="text-rose-600 font-bold">🔴 Đã có người đặt</strong>.
              </p>
            </div>

            {/* Phiếu biên lai xác nhận */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-dashed border-emerald-300 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <span className="font-bold text-slate-500">Mã Đặt Sân:</span>
                <span className="font-mono font-black text-emerald-800 text-sm px-2 py-0.5 rounded bg-white border border-emerald-300">
                  {bookingSuccessReceipt.receiptCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sân bóng:</span>
                <strong className="text-slate-900 font-extrabold">{bookingSuccessReceipt.slot.fieldName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngày thi đấu:</span>
                <strong className="text-slate-900 font-extrabold">{selectedBookingDate}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Khung giờ:</span>
                <strong className="text-emerald-800 font-extrabold">{bookingSuccessReceipt.slot.slotTime}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Người đặt:</span>
                <strong className="text-slate-900">{bookingSuccessReceipt.customerName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <strong className="text-slate-900">{bookingSuccessReceipt.customerPhone}</strong>
              </div>
              {bookingSuccessReceipt.teamName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Đội bóng:</span>
                  <strong className="text-slate-900">{bookingSuccessReceipt.teamName}</strong>
                </div>
              )}
              {bookingSuccessReceipt.services.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Dịch vụ thêm:</span>
                  <strong className="text-emerald-700 text-right">{bookingSuccessReceipt.services.join(', ')}</strong>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-sm">
                <span className="font-black text-slate-700">Tổng thanh toán:</span>
                <strong className="font-black text-emerald-800 text-base">
                  {formatVND(bookingSuccessReceipt.totalAmount)}
                </strong>
              </div>
            </div>

            {/* Hướng dẫn nhận sân */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">📌 Hướng dẫn khách hàng khi đến sân:</p>
              <p>• Quý khách có mặt trước giờ thi đấu 15 phút tại bàn lễ tân để nhận sân và bóng thi đấu.</p>
              <p>• Hotline hỗ trợ & đổi lịch: <strong>0983 830 955 / 0906 424 006</strong> (Ban Quản Lý Sân Bóng C1 - 1B Y Ngông, Tân Tiến, Buôn Ma Thuột).</p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span>
                <span>In Phiếu Này</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingSuccessReceipt(null)}
                className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
              >
                Hoàn Tất & Đóng
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
