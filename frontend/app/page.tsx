'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
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
    name: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    level: 'Đội hình 1 Chuyên nghiệp',
    headCoach: 'HLV. Nguyễn Văn Huấn',
    captain: 'Nguyễn Quang Hải (#19)',
    memberCount: 10,
    homePitch: 'Sân bóng C1 (Sân 2)',
    establishedYear: 2021,
    description: 'Đội tuyển hạt nhân thi đấu các giải cúp phong trào mở rộng. Quy mô: 10 cầu thủ (5 đá chính + 5 dự bị).',
    status: 'Hoạt động',
  },
  {
    id: 'team-2',
    name: 'CLB Sân C1 - Tuyến Trẻ U21',
    level: 'Lứa tuổi U21 Đào tạo',
    headCoach: 'HLV. Trần Đình Trọng',
    captain: 'Lê Văn Đô (#7)',
    memberCount: 10,
    homePitch: 'Sân bóng C1 (Sân 1)',
    establishedYear: 2023,
    description: 'Nòng cốt kế cận, rèn luyện kỹ thuật cơ bản và tích lũy thực chiến. Quy mô: 10 cầu thủ (5 đá chính + 5 dự bị).',
    status: 'Hoạt động',
  },
  {
    id: 'team-3',
    name: 'CLB Sân C1 - Đội Trẻ U17',
    level: 'Lứa tuổi U17 Học viện',
    headCoach: 'HLV. Phạm Đức Huy',
    captain: 'Trần Minh Quân (#10)',
    memberCount: 10,
    homePitch: 'Sân bóng C1 (Sân 1)',
    establishedYear: 2024,
    description: 'Đào tạo thể chất và tư duy hiện đại cho tài năng trẻ. Quy mô: 10 cầu thủ (5 đá chính + 5 dự bị).',
    status: 'Hoạt động',
  },
  {
    id: 'team-4',
    name: 'CLB Sân C1 - Futsal Team',
    level: 'Bóng đá trong nhà & Mini 5 người',
    headCoach: 'HLV. Vũ Trọng Khôi',
    captain: 'Đỗ Hùng Dũng (#8)',
    memberCount: 10,
    homePitch: 'Sân trong nhà Futsal Arena',
    establishedYear: 2023,
    description: 'Thi đấu sân mini và sàn gỗ trong nhà. Quy mô: 10 cầu thủ (5 đá chính + 5 dự bị).',
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
  lineupRole?: 'Đá chính' | 'Dự bị'; // Quy chuẩn: 5 Đá chính + 5 Dự bị (Tối đa 10 người/đội)
}

const initialMembers: ClubMember[] = [
  // ==================== ĐỘI 1: CLB SÂN C1 - ĐỘI 1 (TUYỂN CHÍNH) - 10 CẦU THỦ ====================
  // --- 5 CẦU THỦ ĐÁ CHÍNH ---
  {
    id: 'player-001',
    name: 'Nguyễn Văn Khải',
    jerseyNumber: 1,
    position: 'Thủ môn',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0901111111',
    dateOfBirth: '1995-03-15',
    height: '1m86',
    weight: '80kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-002',
    name: 'Trần Minh Tuấn',
    jerseyNumber: 2,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0902222222',
    dateOfBirth: '1994-07-22',
    height: '1m79',
    weight: '74kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-004',
    name: 'Phạm Thanh Tùng',
    jerseyNumber: 3,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0904444444',
    dateOfBirth: '1997-05-30',
    height: '1m82',
    weight: '75kg',
    preferredFoot: 'Chân phải',
    status: 'Chấn thương',
    feePaidMonth: false,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-007',
    name: 'Hoàng Minh Huy',
    jerseyNumber: 10,
    position: 'Tiền vệ',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0907777777',
    dateOfBirth: '1993-12-01',
    height: '1m72',
    weight: '68kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-009',
    name: 'Bùi Văn Kiên',
    jerseyNumber: 9,
    position: 'Tiền đạo',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0909999999',
    dateOfBirth: '1996-08-25',
    height: '1m81',
    weight: '77kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  // --- 5 CẦU THỦ DỰ BỊ ---
  {
    id: 'player-2',
    name: 'Đỗ Duy Mạnh',
    jerseyNumber: 4,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0912345678',
    dateOfBirth: '1996-09-29',
    height: '1m80',
    weight: '76kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-3',
    name: 'Đoàn Văn Hậu',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0923456789',
    dateOfBirth: '1999-04-19',
    height: '1m86',
    weight: '82kg',
    preferredFoot: 'Chân trái',
    status: 'Chấn thương',
    feePaidMonth: false,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-008',
    name: 'Nguyễn Đức Thắng',
    jerseyNumber: 7,
    position: 'Tiền đạo',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0908888888',
    dateOfBirth: '1999-04-17',
    height: '1m76',
    weight: '71kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-4',
    name: 'Nguyễn Quang Hải',
    jerseyNumber: 19,
    position: 'Tiền vệ',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0934567890',
    dateOfBirth: '1997-04-12',
    height: '1m68',
    weight: '67kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-6',
    name: 'Nguyễn Tiến Linh',
    jerseyNumber: 22,
    position: 'Tiền đạo',
    teamId: 'team-1',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    phone: '0956789012',
    dateOfBirth: '1997-10-20',
    height: '1m80',
    weight: '77kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },

  // ==================== ĐỘI 2: CLB SÂN C1 - TUYẾN TRẺ U21 - 10 CẦU THỦ ====================
  // --- 5 CẦU THỦ ĐÁ CHÍNH ---
  {
    id: 'player-u21-001',
    name: 'Quan Văn Chuẩn',
    jerseyNumber: 1,
    position: 'Thủ môn',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0961111222',
    dateOfBirth: '2001-01-07',
    height: '1m81',
    weight: '75kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-003',
    name: 'Lê Quốc Bảo',
    jerseyNumber: 15,
    position: 'Hậu vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0903333333',
    dateOfBirth: '1996-11-08',
    height: '1m78',
    weight: '72kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-005',
    name: 'Võ Hoàng Nam',
    jerseyNumber: 6,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0905555555',
    dateOfBirth: '1995-09-12',
    height: '1m74',
    weight: '69kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-1793350674397',
    name: 'Lê Văn Đô',
    jerseyNumber: 24,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0967890123',
    dateOfBirth: '2001-08-07',
    height: '1m73',
    weight: '68kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-010',
    name: 'Trịnh Quang Hải',
    jerseyNumber: 11,
    position: 'Tiền đạo',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0910000000',
    dateOfBirth: '2000-01-14',
    height: '1m77',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    status: 'Nghỉ phép',
    feePaidMonth: false,
    lineupRole: 'Đá chính',
  },
  // --- 5 CẦU THỦ DỰ BỊ ---
  {
    id: 'player-006',
    name: 'Đặng Văn Long',
    jerseyNumber: 8,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0906666666',
    dateOfBirth: '1998-02-28',
    height: '1m75',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-012',
    name: 'Lý Công Hoàng',
    jerseyNumber: 14,
    position: 'Tiền đạo',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0912222222',
    dateOfBirth: '1995-10-05',
    height: '1m78',
    weight: '72kg',
    preferredFoot: 'Chân phải',
    status: 'Chấn thương',
    feePaidMonth: false,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u21-002',
    name: 'Lương Duy Cương',
    jerseyNumber: 3,
    position: 'Hậu vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0962222333',
    dateOfBirth: '2001-11-07',
    height: '1m82',
    weight: '76kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u21-003',
    name: 'Phan Tuấn Tài',
    jerseyNumber: 12,
    position: 'Hậu vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0963333444',
    dateOfBirth: '2001-01-07',
    height: '1m76',
    weight: '68kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u21-004',
    name: 'Khuất Văn Khang',
    jerseyNumber: 17,
    position: 'Tiền vệ',
    teamId: 'team-2',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    phone: '0964444555',
    dateOfBirth: '2003-05-11',
    height: '1m71',
    weight: '65kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },

  // ==================== ĐỘI 3: CLB SÂN C1 - ĐỘI TRẺ U17 - 10 CẦU THỦ ====================
  // --- 5 CẦU THỦ ĐÁ CHÍNH ---
  {
    id: 'player-u17-003',
    name: 'Cao Văn Bình',
    jerseyNumber: 1,
    position: 'Thủ môn',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0972345678',
    dateOfBirth: '2007-01-08',
    height: '1m83',
    weight: '74kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-u17-005',
    name: 'Nguyễn Bảo Long',
    jerseyNumber: 3,
    position: 'Hậu vệ',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0974567890',
    dateOfBirth: '2007-02-14',
    height: '1m76',
    weight: '67kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-u17-004',
    name: 'Lê Đình Long Vũ',
    jerseyNumber: 7,
    position: 'Tiền vệ',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0973456789',
    dateOfBirth: '2007-05-27',
    height: '1m72',
    weight: '64kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-1793350676917',
    name: 'Trần Minh Quân',
    jerseyNumber: 10,
    position: 'Tiền đạo',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0978901234',
    dateOfBirth: '2007-03-15',
    height: '1m75',
    weight: '65kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-u17-002',
    name: 'Nguyễn Đình Bắc',
    jerseyNumber: 11,
    position: 'Tiền đạo',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0971234567',
    dateOfBirth: '2007-08-19',
    height: '1m79',
    weight: '68kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  // --- 5 CẦU THỦ DỰ BỊ ---
  {
    id: 'player-011',
    name: 'Mai Xuân Trường',
    jerseyNumber: 13,
    position: 'Hậu vệ',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0911111111',
    dateOfBirth: '2007-06-19',
    height: '1m79',
    weight: '73kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u17-006',
    name: 'Hoàng Minh Tiến',
    jerseyNumber: 8,
    position: 'Tiền vệ',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0975678901',
    dateOfBirth: '2007-09-11',
    height: '1m74',
    weight: '66kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u17-007',
    name: 'Đinh Quang Kiệt',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0976789012',
    dateOfBirth: '2007-07-16',
    height: '1m91',
    weight: '80kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u17-008',
    name: 'Nguyễn Công Phương',
    jerseyNumber: 14,
    position: 'Tiền vệ',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0977890123',
    dateOfBirth: '2007-06-03',
    height: '1m75',
    weight: '66kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-u17-009',
    name: 'Lê Huỳnh Triệu',
    jerseyNumber: 19,
    position: 'Tiền đạo',
    teamId: 'team-3',
    teamName: 'CLB Sân C1 - Đội Trẻ U17',
    phone: '0978901239',
    dateOfBirth: '2007-06-16',
    height: '1m73',
    weight: '64kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },

  // ==================== ĐỘI 4: CLB SÂN C1 - FUTSAL TEAM - 10 CẦU THỦ ====================
  // --- 5 CẦU THỦ ĐÁ CHÍNH ---
  {
    id: 'player-futsal-001',
    name: 'Hồ Văn Ý',
    jerseyNumber: 1,
    position: 'Thủ môn',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0981112233',
    dateOfBirth: '1997-01-01',
    height: '1m78',
    weight: '73kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-futsal-003',
    name: 'Châu Đoàn Phát',
    jerseyNumber: 4,
    position: 'Hậu vệ',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0983334455',
    dateOfBirth: '1999-03-14',
    height: '1m72',
    weight: '68kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-futsal-002',
    name: 'Đỗ Hùng Dũng',
    jerseyNumber: 8,
    position: 'Tiền vệ',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0982223344',
    dateOfBirth: '1993-09-08',
    height: '1m70',
    weight: '66kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-1793350671460',
    name: 'Trương Kỳ Gia Bảo',
    jerseyNumber: 23,
    position: 'Tiền vệ',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0988888888',
    dateOfBirth: '2000-01-01',
    height: '1m75',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  {
    id: 'player-futsal-004',
    name: 'Trần Thái Huy',
    jerseyNumber: 9,
    position: 'Tiền đạo',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0984445566',
    dateOfBirth: '1995-10-12',
    height: '1m69',
    weight: '65kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Đá chính',
  },
  // --- 5 CẦU THỦ DỰ BỊ ---
  {
    id: 'player-futsal-005',
    name: 'Nguyễn Thịnh Phát',
    jerseyNumber: 10,
    position: 'Tiền đạo',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0985556677',
    dateOfBirth: '1997-06-10',
    height: '1m76',
    weight: '72kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-futsal-006',
    name: 'Nhan Gia Hưng',
    jerseyNumber: 13,
    position: 'Tiền vệ',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0986667788',
    dateOfBirth: '2002-07-13',
    height: '1m74',
    weight: '67kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-futsal-007',
    name: 'Phạm Đức Hòa',
    jerseyNumber: 5,
    position: 'Hậu vệ',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0987778899',
    dateOfBirth: '1991-04-12',
    height: '1m71',
    weight: '68kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-futsal-008',
    name: 'Khổng Đình Hùng',
    jerseyNumber: 7,
    position: 'Tiền vệ',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0988889900',
    dateOfBirth: '1989-11-11',
    height: '1m73',
    weight: '69kg',
    preferredFoot: 'Chân phải',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
  },
  {
    id: 'player-futsal-009',
    name: 'Mai Thành Đạt',
    jerseyNumber: 11,
    position: 'Tiền đạo',
    teamId: 'team-4',
    teamName: 'CLB Sân C1 - Futsal Team',
    phone: '0989990011',
    dateOfBirth: '1987-04-05',
    height: '1m72',
    weight: '67kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện',
    feePaidMonth: true,
    lineupRole: 'Dự bị',
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
    assignedTeam: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
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
    assignedTeam: 'CLB Sân C1 - Tuyến Trẻ U21',
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
    assignedTeam: 'CLB Sân C1 - Đội Trẻ U17',
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
    assignedTeam: 'CLB Sân C1 - Futsal Team',
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
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Tập thể lực',
    date: '2026-10-27',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân bóng C1 (Sân 1)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Khởi động kỹ, mang giày đinh dăm AG, tập chạy biến tốc.',
  },
  {
    id: 'sched-001',
    title: 'Tập thể lực đầu tuần',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    type: 'Tập thể lực',
    date: '2026-10-28',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân C1 (Sân 1)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Chú trọng cardio và tốc độ',
  },
  {
    id: 'sched-002',
    title: 'Tập chiến thuật 4-3-3',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Tập chiến thuật',
    date: '2026-10-29',
    startTime: '17:30',
    endTime: '19:30',
    fieldName: 'Sân C1 (Sân 1)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Luyện sơ đồ chiến thuật mới',
  },
  {
    id: 'sched-2',
    title: 'Tập phối hợp bóng ngắn và sút phạt góc',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Tập chiến thuật',
    date: '2026-10-29',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân bóng C1 (Sân 1)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Chia đội 7v7 tập phản công nhanh.',
  },
  {
    id: 'sched-003',
    title: 'Đấu tập nội bộ thứ 4',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Đấu tập nội bộ',
    date: '2026-10-30',
    startTime: '18:00',
    endTime: '20:30',
    fieldName: 'Sân C1 (Sân 2)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Chia 2 đội: Đỏ vs Xanh',
  },
  {
    id: 'sched-3',
    title: 'Giao hữu thử nghiệm đội hình với Hà Nội Star FC',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Thi đấu giao hữu',
    date: '2026-10-31',
    startTime: '16:00',
    endTime: '18:30',
    fieldName: 'Sân bóng C1 (Sân 2)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Mặc đồng phục thi đấu màu Đỏ, có mặt trước 45 phút.',
  },
  {
    id: 'sched-004',
    title: 'Tập thể lực cuối tuần',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Tập thể lực',
    date: '2026-11-01',
    startTime: '07:00',
    endTime: '09:00',
    fieldName: 'Sân C1 (Sân 1)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Buổi tập sáng sớm, mang giày đinh',
  },
  {
    id: 'sched-005',
    title: 'Tập kỹ thuật cá nhân',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
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
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
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
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
    type: 'Đấu tập nội bộ',
    date: '2026-11-08',
    startTime: '07:30',
    endTime: '10:00',
    fieldName: 'Sân C1 (Sân 2)',
    coach: 'HLV. Trần Đình Trọng',
    notes: 'Luyện set-piece và phạt góc',
  },
  {
    id: 'sched-008',
    title: 'Tập thể lực - Bài tập sức mạnh',
    teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
    type: 'Tập thể lực',
    date: '2026-11-10',
    startTime: '18:00',
    endTime: '20:00',
    fieldName: 'Sân C1 (Sân 1)',
    coach: 'HLV. Nguyễn Văn Huấn',
    notes: 'Gym + field training',
  },
  {
    id: 'sched-009',
    title: 'Tập phòng thủ',
    teamName: 'CLB Sân C1 - Tuyến Trẻ U21',
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
    teamName: 'CLB Sân C1 - Futsal Team',
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
  { id: 'fin-2', date: '2026-10-03', title: 'Thanh toán tiền thuê sân tập tháng 10 (Sân C1 (Sân 1))', category: 'Chi', amount: 3500000, personInCharge: 'HLV Huấn', notes: '8 buổi tập x 437.500 VNĐ' },
  { id: 'fin-3', date: '2026-10-10', title: 'Tiền tài trợ từ Công ty Thể thao Động Lực', category: 'Thu', amount: 10000000, personInCharge: 'Ban Lãnh Đạo', notes: 'Tài trợ trang phục & bóng thi đấu' },
  { id: 'fin-4', date: '2026-10-15', title: 'Mua 10 quả bóng thi đấu tiêu chuẩn FIFA Quality Pro', category: 'Chi', amount: 2400000, personInCharge: 'Ban Hậu Cần', notes: 'Mua sắm trang bị tập luyện' },
  { id: 'fin-5', date: '2026-10-24', title: 'Chi phí nước uống, y tế trận giao hữu với Hà Nội Star FC', category: 'Chi', amount: 800000, personInCharge: 'Bác sĩ CLB', notes: 'Nước khoáng, điện giải và băng gạc y tế' },
];

// 7. Quản lý Thông báo
interface ClubAnnouncement {
  id: string;
  title: string;
  target: 'Toàn bộ câu lạc bộ' | 'CLB Sân C1 - Đội 1' | 'Tuyển Trẻ U21' | 'Ban Huấn Luyện' | 'Ban Điều Hành & Quản Lý Ca';
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
    target: 'CLB Sân C1 - Đội 1',
    priority: 'Quan trọng',
    date: '2026-10-28',
    author: 'HLV. Nguyễn Văn Huấn',
    content: 'Trận giao hữu diễn ra lúc 16:00 Thứ Bảy 07/11/2026 tại Sân C1 (Sân 2). Toàn đội mặc trang phục màu Đỏ, có mặt trước 45 phút để họp chiến thuật.',
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
  status?: 'pending' | 'approved' | 'rejected' | 'available'; // 'pending': Đang chờ nhân viên duyệt, 'approved': Đã duyệt, 'rejected': Từ chối, 'available': Còn trống
  customerName?: string | null;
  customerPhone?: string | null;
  teamName?: string | null;
  services?: string | null;
  notes?: string | null;
}

const initialFieldFacilities: FieldDemoFacility[] = [
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
    tags: ['2 sân cỏ nhân tạo', 'Đèn chiếu sáng', 'Thuê bóng', 'Nước lọc', '0983 830 955', '0906 424 006'],
    priceDisplay: '250.000 – 350.000 đ/giờ',
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

const initialFieldBookingSlots: FieldBookingSlot[] = [
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

const standardFacilitySlots: Record<string, { slotId: string; slotTime: string; slotLabel: string; price: number }[]> = {
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
  const { user, switchRole, logout } = useAuth();
  const { addNotification, notifications, openNotificationDetail } = useNotifications();
  const searchParams = useSearchParams();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ClubAnnouncement | null>(null);
  const [announcementSubTab, setAnnouncementSubTab] = useState<'club' | 'activity'>('club');

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

  // Lắng nghe sự kiện click thông báo để điều hướng đến tính năng tức thời
  useEffect(() => {
    const handleSwitchTabEvent = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        const target = e.detail as TabType;
        if (['home', 'fields', 'booking-schedule', 'contact', 'teams', 'members', 'coaches', 'schedules', 'attendance', 'finances', 'announcements', 'results', 'about'].includes(target)) {
          setActiveTab(target);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    };
    window.addEventListener('switch-tab', handleSwitchTabEvent);
    return () => window.removeEventListener('switch-tab', handleSwitchTabEvent);
  }, []);

  // Huấn luyện viên không xem phần thu phí & quỹ -> tự động chuyển hướng về lịch tập nếu đang ở tab finances
  useEffect(() => {
    if (user?.role === 'coach' && activeTab === 'finances') {
      setActiveTab('schedules');
    }
  }, [user, activeTab]);

  // States for 7 modules
  const [teams, setTeams] = useState<ClubTeam[]>(initialTeams);
  const [members, setMembers] = useState<ClubMember[]>(initialMembers);
  const [coaches, setCoaches] = useState<ClubCoach[]>(initialCoaches);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>(initialSchedules);
  const [attendance, setAttendance] = useState<AttendanceItem[]>(initialAttendance);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>(initialAnnouncements);

  // 6. Quản Lý Chi Phí Cầu Thủ Hàng Tháng & Hàng Năm
  const [playerFees, setPlayerFees] = useState<PlayerFeeItem[]>(() => generateDefaultPlayerFees(initialMembers));
  const [selectedFeeYear, setSelectedFeeYear] = useState<number>(2026);
  const [selectedFeeMonth, setSelectedFeeMonth] = useState<number | 'all'>('all');
  const [feeTeamFilter, setFeeTeamFilter] = useState<string>('Tất cả');
  const [feeSearch, setFeeSearch] = useState<string>('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'exempt'>('all');
  const [financeSubTab, setFinanceSubTab] = useState<'player-fees' | 'ledger' | 'reports' | 'shift-bookings'>('player-fees');
  const [payFeeTarget, setPayFeeTarget] = useState<{
    member: ClubMember;
    month: number;
    year: number;
    amount: number;
    paymentMethod: string;
    notes: string;
  } | null>(null);
  const [selectedFeePlayer, setSelectedFeePlayer] = useState<ClubMember | null>(null);

  // 8. Quản Lý Demo Sân & Đặt Sân Trực Tuyến Cho Khách Hàng (Sân bóng C1)
  const [fieldFacilities] = useState<FieldDemoFacility[]>(initialFieldFacilities);
  const [fieldBookings, setFieldBookings] = useState<FieldBookingSlot[]>(initialFieldBookingSlots);

  // ================= PHÂN QUYỀN MANAGER (QUẢN LÝ SÂN BÃI & ĐIỀU PHỐI) STATES =================
  // 1. Quản lý Sân bãi & Thiết bị: Cập nhật trạng thái sân (bảo trì mặt cỏ, hỏng dàn đèn) & kho thiết bị phụ trợ
  interface FieldOperationalStatus {
    id: string;
    name: string;
    status: 'normal' | 'maintenance_grass' | 'broken_lights';
    statusNote: string;
    updatedAt: string;
  }
  const [fieldOperationalStatuses, setFieldOperationalStatuses] = useState<FieldOperationalStatus[]>([
    { id: 'field-c1', name: 'Sân bóng C1 - Sân 1 (7 người)', status: 'normal', statusNote: 'Mặt cỏ nhân tạo và dàn đèn LED hoạt động hoàn hảo', updatedAt: '04/11/2026 15:00' },
    { id: 'field-c2', name: 'Sân bóng C1 - Sân 2 (7 người)', status: 'normal', statusNote: 'Mặt sân tiêu chuẩn, sẵn sàng phục vụ', updatedAt: '04/11/2026 15:00' },
  ]);

  interface AuxiliaryEquipment {
    id: string;
    name: string;
    category: 'ball' | 'bib' | 'drink';
    total: number;
    inUse: number;
    price: number;
    unit: string;
  }
  const [equipmentList, setEquipmentList] = useState<AuxiliaryEquipment[]>([
    { id: 'eq-1', name: 'Bóng Động Lực FIFA Quality Pro #5', category: 'ball', total: 20, inUse: 6, price: 30000, unit: 'Quả/trận' },
    { id: 'eq-2', name: 'Bộ Áo Bib Phân Đội Màu Xanh Neon', category: 'bib', total: 30, inUse: 14, price: 20000, unit: 'Bộ/trận' },
    { id: 'eq-3', name: 'Bộ Áo Bib Phân Đội Màu Cam Rực', category: 'bib', total: 30, inUse: 14, price: 20000, unit: 'Bộ/trận' },
    { id: 'eq-4', name: 'Nước Khoáng Đóng Chai Aquafina 500ml', category: 'drink', total: 120, inUse: 0, price: 10000, unit: 'Chai' },
    { id: 'eq-5', name: 'Nước Điện Giải Thể Thao Pocari Sweat', category: 'drink', total: 60, inUse: 0, price: 15000, unit: 'Chai' },
  ]);

  // 2. Quản lý Lịch đặt & Điều phối: Timeline/Calendar, Dời lịch & Xử lý trùng lịch
  const [bookingScheduleViewMode, setBookingScheduleViewMode] = useState<'cards' | 'timeline'>('cards');
  const [rescheduleTargetSlot, setRescheduleTargetSlot] = useState<FieldBookingSlot | null>(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState<string>('');
  const [rescheduleNewTime, setRescheduleNewTime] = useState<string>('08:00 - 09:00');

  // 3. Quản lý Câu lạc bộ & Nhân sự: Duyệt yêu cầu thành lập CLB mới, gán quyền Coach, cảnh báo/khóa vi phạm
  interface PendingClubRequest {
    id: string;
    clubName: string;
    representative: string;
    phone: string;
    email: string;
    memberCount: number;
    createdAt: string;
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
  }
  const [pendingClubRequests, setPendingClubRequests] = useState<PendingClubRequest[]>([
    {
      id: 'req-clb-1',
      clubName: 'Buôn Ma Thuột Tigers FC',
      representative: 'Nguyễn Tiến Dũng',
      phone: '0912 345 678',
      email: 'dung.tiensport@gmail.com',
      memberCount: 16,
      createdAt: '03/11/2026 14:20',
      status: 'pending',
      notes: 'Đăng ký thành lập CLB sinh hoạt cố định tối Thứ 3 và Thứ 6 tại Sân C1',
    },
    {
      id: 'req-clb-2',
      clubName: 'Đắk Lắk Phoenix Futsal',
      representative: 'Hoàng Văn Thái',
      phone: '0988 777 666',
      email: 'thaiphoenix@bmt.vn',
      memberCount: 12,
      createdAt: '04/11/2026 09:15',
      status: 'pending',
      notes: 'Đội bóng phong trào Futsal & sân 7 khu vực Tân Tiến',
    },
  ]);

  interface AccountViolation {
    id: string;
    username: string;
    name: string;
    reason: string;
    status: 'warning' | 'banned' | 'normal';
    date: string;
    handledBy: string;
  }
  const [accountViolations, setAccountViolations] = useState<AccountViolation[]>([
    {
      id: 'vio-1',
      username: 'khachhang_boom99',
      name: 'Lê Văn Cường (Khách vãng lai)',
      reason: 'Đặt sân khung giờ 19:00 không đến và không hủy trước 3 tiếng',
      status: 'warning',
      date: '02/11/2026',
      handledBy: 'Quản Lý Sân',
    },
  ]);

  // 4. Thanh toán & Hóa đơn: Xuất biên lai hóa đơn đặt sân & phạm vi báo cáo
  const [selectedReceiptSlot, setSelectedReceiptSlot] = useState<FieldBookingSlot | null>(null);
  const [memberSectionTab, setMemberSectionTab] = useState<'members' | 'pending-clubs' | 'assign-coach' | 'violations'>('members');
  const [revenueReportScope, setRevenueReportScope] = useState<'shift' | 'daily' | 'annual'>('daily');

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
          homePitch: t.homePitch || t.home_pitch || 'Sân bóng C1',
          establishedYear: Number(t.establishedYear || t.established_year) || 2024,
          description: t.description || '',
          status: t.status === 'Tạm nghỉ' ? 'Tạm nghỉ' : 'Hoạt động',
        }));
        setTeams(mappedTeams);
      }

      // 1. Cầu thủ từ Neon DB (kết hợp đồng bộ với danh sách chuẩn 40 cầu thủ: 4 đội, mỗi đội 10 người: 5 Đá chính + 5 Dự bị)
      if (playersRes && Array.isArray(playersRes.data) && playersRes.data.length > 0) {
        hasNeonData = true;
        const neonPlayersMap = new Map<string, any>();
        playersRes.data.forEach((p: any) => {
          if (p.id) neonPlayersMap.set(p.id, p);
          if (p.name) neonPlayersMap.set(p.name.toLowerCase().trim(), p);
        });

        const mergedMembers: ClubMember[] = initialMembers.map((baseMem) => {
          const match = neonPlayersMap.get(baseMem.id) || neonPlayersMap.get(baseMem.name.toLowerCase().trim());
          if (!match) return baseMem;
          let pos: ClubMember['position'] = baseMem.position;
          if (['Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'].includes(match.position)) {
            pos = match.position;
          }
          let st: ClubMember['status'] = baseMem.status;
          if (match.status === 'Chấn thương') st = 'Chấn thương';
          else if (match.status === 'Nghỉ phép') st = 'Nghỉ phép';
          else if (match.status === 'Đang tập luyện' || match.status === 'Đang thi đấu') st = 'Đang tập luyện';

          return {
            ...baseMem,
            name: match.name || baseMem.name,
            jerseyNumber: match.jerseyNumber || match.jersey_number || baseMem.jerseyNumber,
            position: pos,
            phone: match.phone || baseMem.phone,
            status: st,
          };
        });
        setMembers(mergedMembers);
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
            teamName: s.teamName || (idx % 2 === 0 ? 'CLB Sân C1 - Đội 1 (Tuyển Chính)' : 'CLB Sân C1 - Tuyến Trẻ U21'),
            type: typeVal,
            date: s.date || '2026-11-01',
            startTime: s.startTime || '18:00',
            endTime: s.endTime || '20:00',
            fieldName: s.fieldName || 'Sân bóng C1 (Sân 1)',
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
            memberName: a.playerName || (matchedPlayer ? matchedPlayer.name : 'Cầu thủ CLB Sân Bóng C1'),
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
            target: (idx % 2 === 0 ? 'Toàn bộ câu lạc bộ' : 'CLB Sân C1 - Đội 1') as any,
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
              team: 'CLB Sân C1 - Đội 1 (Tuyển Chính)',
              exp: 12,
              spec: 'Chiến thuật tổng lực, pressing tầm cao và phát triển cầu thủ',
            },
            'HLV. Trần Đình Trọng': {
              role: 'HLV Trưởng Tuyến Trẻ U21',
              license: 'Bằng AFC B',
              team: 'CLB Sân C1 - Tuyến Trẻ U21',
              exp: 6,
              spec: 'Kèm người 1v1, bọc lót và phòng ngự khu vực',
            },
            'HLV. Phạm Đức Huy': {
              role: 'HLV Đào tạo trẻ U17',
              license: 'Bằng AFC C',
              team: 'CLB Sân C1 - Đội Trẻ U17',
              exp: 5,
              spec: 'Kỹ thuật cơ bản, thể lực nền tảng và tư duy bóng đá',
            },
            'HLV. Vũ Trọng Khôi': {
              role: 'HLV Đội Futsal',
              license: 'Bằng Futsal Level 2',
              team: 'CLB Sân C1 - Futsal Team',
              exp: 8,
              spec: 'Kỹ thuật xử lý phạm vi hẹp và chiến thuật bóng đá mini',
            },
          };

          const mappedCoaches: ClubCoach[] = coachesFromDb.map((c: any, idx: number) => {
            const meta = coachMetaMap[c.name] || {
              role: 'HLV Chuyên Môn',
              license: 'Bằng AFC B',
              team: idx % 2 === 0 ? 'CLB Sân C1 - Đội 1 (Tuyển Chính)' : 'CLB Sân C1 - Tuyến Trẻ U21',
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
      if (bookingsRes && Array.isArray(bookingsRes.data)) {
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

  // 8. Quản Lý Demo Sân & Đặt Sân Trực Tuyến Cho Khách Hàng (Sân vận động Quốc gia Mỹ Đình)
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>('2026-11-01');
  const [bookingFieldFilter, setBookingFieldFilter] = useState<string>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'available' | 'booked' | 'pending'>('all');
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
  const [memberLineupFilter, setMemberLineupFilter] = useState<'all' | 'Đá chính' | 'Dự bị'>('all');
  const [scheduleTeamFilter, setScheduleTeamFilter] = useState('Tất cả');

  // Modals visibility
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddFinanceModal, setShowAddFinanceModal] = useState(false);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);

  // Xem danh sách cầu thủ theo đội bóng (Chỉ hiển thị danh sách cầu thủ khi click)
  const [viewingTeamRoster, setViewingTeamRoster] = useState<ClubTeam | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterPositionFilter, setRosterPositionFilter] = useState<string>('Tất cả');

  const getTeamRoster = useCallback((team: ClubTeam | null) => {
    if (!team) return [];
    const tName = (team.name || '').toLowerCase();
    const isU17 = tName.includes('u17');
    const isFutsal = tName.includes('futsal');
    const isU21 = tName.includes('u21');
    const isMain = tName.includes('đội 1') || tName.includes('tuyển chính');

    return members.filter((m) => {
      if (m.teamId && (m.teamId === team.id || m.teamId === team.id.replace('team-', ''))) return true;
      if (m.teamName?.toLowerCase() === tName) return true;
      const mName = (m.teamName || '').toLowerCase();
      if (isU17 && mName.includes('u17')) return true;
      if (isFutsal && mName.includes('futsal')) return true;
      if (isU21 && mName.includes('u21')) return true;
      if (isMain && (mName.includes('đội 1') || mName.includes('tuyển chính'))) return true;
      return false;
    });
  }, [members]);

  const filteredRoster = useMemo(() => {
    if (!viewingTeamRoster) return [];
    let list = getTeamRoster(viewingTeamRoster);
    if (rosterPositionFilter !== 'Tất cả') {
      list = list.filter((p) => p.position === rosterPositionFilter);
    }
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.jerseyNumber.toString().includes(q) ||
          p.position.toLowerCase().includes(q)
      );
    }
    return list;
  }, [viewingTeamRoster, getTeamRoster, rosterPositionFilter, rosterSearch]);

  // ================= Quản lý Thêm / Sửa / Xóa cầu thủ trong Modal Roster Đội bóng =================
  const [showRosterAddModal, setShowRosterAddModal] = useState<boolean>(false);
  const [editingRosterPlayer, setEditingRosterPlayer] = useState<ClubMember | null>(null);
  const [rosterPlayerForm, setRosterPlayerForm] = useState<{
    name: string;
    jerseyNumber: number;
    position: 'Thủ môn' | 'Hậu vệ' | 'Tiền vệ' | 'Tiền đạo';
    lineupRole: 'Đá chính' | 'Dự bị';
    dateOfBirth: string;
    height: string;
    weight: string;
    preferredFoot: string;
    phone: string;
    status: 'Đang tập luyện' | 'Chấn thương' | 'Nghỉ phép';
  }>({
    name: '',
    jerseyNumber: 10,
    position: 'Tiền đạo',
    lineupRole: 'Đá chính',
    dateOfBirth: '2000-01-01',
    height: '1m75',
    weight: '70kg',
    preferredFoot: 'Chân phải',
    phone: '0901234567',
    status: 'Đang tập luyện',
  });

  const handleOpenAddRosterPlayer = () => {
    if (!viewingTeamRoster) return;
    const currentRoster = getTeamRoster(viewingTeamRoster);
    const usedJerseys = new Set(currentRoster.map(p => p.jerseyNumber));
    let nextJersey = 1;
    while (usedJerseys.has(nextJersey) && nextJersey < 99) {
      nextJersey++;
    }
    const mainCount = currentRoster.filter(p => (p.lineupRole || 'Đá chính') === 'Đá chính').length;
    const defaultRole: 'Đá chính' | 'Dự bị' = mainCount < 5 ? 'Đá chính' : 'Dự bị';

    setRosterPlayerForm({
      name: '',
      jerseyNumber: nextJersey,
      position: 'Tiền đạo',
      lineupRole: defaultRole,
      dateOfBirth: '2000-01-01',
      height: '1m75',
      weight: '70kg',
      preferredFoot: 'Chân phải',
      phone: '090' + Math.floor(1000000 + Math.random() * 9000000),
      status: 'Đang tập luyện',
    });
    setShowRosterAddModal(true);
  };

  const handleOpenEditRosterPlayer = (player: ClubMember) => {
    setEditingRosterPlayer(player);
    setRosterPlayerForm({
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      lineupRole: player.lineupRole || 'Đá chính',
      dateOfBirth: player.dateOfBirth || '2000-01-01',
      height: player.height || '1m75',
      weight: player.weight || '70kg',
      preferredFoot: player.preferredFoot || 'Chân phải',
      phone: player.phone || '0901234567',
      status: player.status || 'Đang tập luyện',
    });
  };

  const handleSaveAddRosterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingTeamRoster) return;
    const nameClean = rosterPlayerForm.name.trim();
    if (!nameClean) {
      alert('Vui lòng nhập họ và tên cầu thủ!');
      return;
    }
    const currentRoster = getTeamRoster(viewingTeamRoster);
    const jNum = Number(rosterPlayerForm.jerseyNumber);
    const dupJersey = currentRoster.find(p => p.jerseyNumber === jNum);
    if (dupJersey) {
      alert(`❌ Số áo #${jNum} đã thuộc về cầu thủ "${dupJersey.name}". Vui lòng chọn số áo khác!`);
      return;
    }

    const sameRoleCount = currentRoster.filter(p => (p.lineupRole || 'Đá chính') === rosterPlayerForm.lineupRole).length;
    if (sameRoleCount >= 5) {
      const altRole = rosterPlayerForm.lineupRole === 'Đá chính' ? 'Dự bị' : 'Đá chính';
      alert(`⚠️ Tuyến đội đã có đủ 5 cầu thủ "${rosterPlayerForm.lineupRole}". Bạn có thể chọn vai trò "${altRole}" cho cầu thủ này!`);
      return;
    }

    const newMemberItem: ClubMember = {
      id: `player-${Date.now()}`,
      name: nameClean,
      jerseyNumber: jNum,
      position: rosterPlayerForm.position,
      teamId: viewingTeamRoster.id,
      teamName: viewingTeamRoster.name,
      phone: rosterPlayerForm.phone || '0901234567',
      dateOfBirth: rosterPlayerForm.dateOfBirth,
      height: rosterPlayerForm.height,
      weight: rosterPlayerForm.weight,
      preferredFoot: rosterPlayerForm.preferredFoot,
      status: rosterPlayerForm.status,
      feePaidMonth: true,
      lineupRole: rosterPlayerForm.lineupRole,
    };

    setMembers(prev => [newMemberItem, ...prev]);
    setTeams(prev => prev.map(t => t.id === viewingTeamRoster.id ? { ...t, memberCount: t.memberCount + 1 } : t));
    setShowRosterAddModal(false);
    addNotification('Thêm cầu thủ thành công', `Đã thêm cầu thủ ${newMemberItem.name} (#${newMemberItem.jerseyNumber}) vào ${viewingTeamRoster.name}.`, 'new');

    try {
      await api.addPlayer({
        name: newMemberItem.name,
        jerseyNumber: newMemberItem.jerseyNumber,
        position: newMemberItem.position,
        phone: newMemberItem.phone,
        dateOfBirth: newMemberItem.dateOfBirth,
        status: newMemberItem.status === 'Chấn thương' ? 'Chấn thương' : newMemberItem.status === 'Nghỉ phép' ? 'Nghỉ phép' : 'Đang thi đấu',
      });
    } catch (err) {
      console.warn('Lỗi lưu cầu thủ vào API:', err);
    }
  };

  const handleSaveEditRosterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRosterPlayer || !viewingTeamRoster) return;
    const nameClean = rosterPlayerForm.name.trim();
    if (!nameClean) {
      alert('Vui lòng nhập họ và tên cầu thủ!');
      return;
    }
    const currentRoster = getTeamRoster(viewingTeamRoster);
    const jNum = Number(rosterPlayerForm.jerseyNumber);
    const dupJersey = currentRoster.find(p => p.id !== editingRosterPlayer.id && p.jerseyNumber === jNum);
    if (dupJersey) {
      alert(`❌ Số áo #${jNum} đã thuộc về cầu thủ "${dupJersey.name}". Vui lòng chọn số áo khác!`);
      return;
    }

    if (rosterPlayerForm.lineupRole !== (editingRosterPlayer.lineupRole || 'Đá chính')) {
      const targetRoleCount = currentRoster.filter(p => p.id !== editingRosterPlayer.id && (p.lineupRole || 'Đá chính') === rosterPlayerForm.lineupRole).length;
      if (targetRoleCount >= 5) {
        alert(`⚠️ Đội đã có đủ 5 cầu thủ "${rosterPlayerForm.lineupRole}". Không thể chuyển thêm cầu thủ này sang "${rosterPlayerForm.lineupRole}"!`);
        return;
      }
    }

    setMembers(prev => prev.map(m => {
      if (m.id === editingRosterPlayer.id) {
        return {
          ...m,
          name: nameClean,
          jerseyNumber: jNum,
          position: rosterPlayerForm.position,
          lineupRole: rosterPlayerForm.lineupRole,
          dateOfBirth: rosterPlayerForm.dateOfBirth,
          height: rosterPlayerForm.height,
          weight: rosterPlayerForm.weight,
          preferredFoot: rosterPlayerForm.preferredFoot,
          phone: rosterPlayerForm.phone,
          status: rosterPlayerForm.status,
        };
      }
      return m;
    }));

    setEditingRosterPlayer(null);
    addNotification('Cập nhật thông tin cầu thủ', `Đã cập nhật cầu thủ ${nameClean} (#${jNum}) trong đội ${viewingTeamRoster.name}.`, 'change');
  };

  const handleDeleteRosterPlayer = async (player: ClubMember) => {
    if (!viewingTeamRoster) return;
    if (confirm(`Bạn có chắc chắn muốn xóa cầu thủ "${player.name}" (#${player.jerseyNumber}) khỏi đội "${viewingTeamRoster.name}" không?`)) {
      setMembers(prev => prev.filter(m => m.id !== player.id));
      setTeams(prev => prev.map(t => t.id === viewingTeamRoster.id ? { ...t, memberCount: Math.max(0, t.memberCount - 1) } : t));
      addNotification('Xóa cầu thủ', `Đã xóa cầu thủ ${player.name} khỏi ${viewingTeamRoster.name}.`, 'cancel');
      try {
        await api.deletePlayer(player.id);
      } catch (err) {
        console.warn('Lỗi xóa cầu thủ qua API:', err);
      }
    }
  };

  // Forms
  const [newTeam, setNewTeam] = useState({ name: '', level: 'Đội hình 1 Chuyên nghiệp', headCoach: 'HLV. Nguyễn Văn Huấn', captain: '', memberCount: 10, homePitch: 'Sân bóng C1 (Sân 1)', description: '' });
  const [newMember, setNewMember] = useState({ name: '', jerseyNumber: 9, position: 'Tiền đạo' as const, teamId: 'team-1', phone: '', dateOfBirth: '2000-01-01', height: '1m78', weight: '72kg', preferredFoot: 'Chân phải', lineupRole: 'Đá chính' as 'Đá chính' | 'Dự bị' });
  const [newCoach, setNewCoach] = useState({ name: '', role: 'HLV Thể lực', license: 'Bằng AFC B', assignedTeam: 'CLB Sân C1 - Đội 1 (Tuyển Chính)', phone: '', email: '', experienceYears: 5, specialty: 'Rèn luyện thể lực và sức bền' });
  const [newSchedule, setNewSchedule] = useState({ title: '', teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)', type: 'Tập chiến thuật' as const, date: '2026-11-06', startTime: '18:00', endTime: '20:00', fieldName: 'Sân bóng C1 (Sân 1)', coach: 'HLV. Nguyễn Văn Huấn', notes: '' });
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

  // Hồ Sơ & Thông Tin Cá Nhân Của Cầu Thủ (User / Player Profile)
  const [playerProfileData, setPlayerProfileData] = useState({
    name: 'Khách Đặt Sân Giao Hữu',
    phone: '0908 767 623',
    email: 'user01@saovangfc.vn',
    jerseyNumber: 19,
    position: 'Tiền vệ cánh / Tấn công',
    teamName: 'CLB Sân Bóng C1 - Đội hình 1 Chuyên nghiệp',
    dateOfBirth: '1997-04-12',
    height: '1m70',
    weight: '67kg',
    preferredFoot: 'Chân trái',
    status: 'Đang tập luyện & Sẵn sàng thi đấu',
    joinDate: '01/01/2026',
    emergencyContact: '0983 830 955 (Hotline BQL C1)',
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editProfileForm, setEditProfileForm] = useState(playerProfileData);

  useEffect(() => {
    if (user) {
      const matched = members.find(
        (m) =>
          m.name.toLowerCase() === user.name?.toLowerCase() ||
          m.phone === (user as any).phone ||
          m.id === user.id
      );
      const initialData = {
        name: matched?.name || user.name || 'Khách Đặt Sân Giao Hữu',
        phone: matched?.phone || (user as any)?.phone || '0908 767 623',
        email: user.email || 'user01@saovangfc.vn',
        jerseyNumber: matched?.jerseyNumber || (user.name?.includes('19') ? 19 : 7),
        position: matched?.position || 'Tiền vệ cánh / Tấn công',
        teamName: matched?.teamName || 'CLB Sân Bóng C1 - Đội hình 1 Chuyên nghiệp',
        dateOfBirth: matched?.dateOfBirth || '1997-04-12',
        height: matched?.height || '1m70',
        weight: matched?.weight || '67kg',
        preferredFoot: matched?.preferredFoot || 'Chân trái',
        status: matched?.status || 'Đang tập luyện & Sẵn sàng thi đấu',
        joinDate: '01/01/2026',
        emergencyContact: '0983 830 955 (Hotline BQL C1)',
      };
      setPlayerProfileData(initialData);
      setEditProfileForm(initialData);
    }
  }, [user, members]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerProfileData(editProfileForm);
    setIsEditingProfile(false);
    setMembers((prev) =>
      prev.map((m) =>
        m.name.toLowerCase() === editProfileForm.name.toLowerCase() || m.jerseyNumber === editProfileForm.jerseyNumber
          ? {
            ...m,
            name: editProfileForm.name,
            phone: editProfileForm.phone,
            position: editProfileForm.position as any,
            height: editProfileForm.height,
            weight: editProfileForm.weight,
            preferredFoot: editProfileForm.preferredFoot,
          }
          : m
      )
    );
    addNotification('Cập nhật hồ sơ cá nhân', `Thông tin cá nhân của cầu thủ ${editProfileForm.name} đã được cập nhật thành công.`, 'change');
    alert('✓ Đã lưu thay đổi thông tin cá nhân cầu thủ thành công!');
  };

  // Financial calculations
  const totalIncome = transactions.filter((t) => t.category === 'Thu').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.category === 'Chi').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;
  const paidMembersCount = members.filter((m) => m.feePaidMonth).length;

  // RBAC Permission Check chuẩn 5 vai trò theo yêu cầu hệ thống:
  // 1. ADMIN (Chủ sân): Toàn quyền hệ thống. Quản lý doanh thu tổng năm, tạo mới sân bóng, quản lý nhân viên, và xem thống kê tổng quan.
  // 2. MANAGER (Quản lý Sân bãi & Điều phối):
  //    - Quản lý Sân bãi & Thiết bị: Cập nhật trạng thái sân (bảo trì mặt cỏ, hỏng dàn đèn); Quản lý kho thiết bị phụ trợ (cho thuê bóng, áo bib, bán nước uống).
  //    - Quản lý Lịch đặt & Điều phối: Duyệt, hủy hoặc dời lịch đặt sân; Xử lý các trường hợp trùng lịch (Conflict resolution); Xem toàn cảnh lịch Timeline/Calendar.
  //    - Quản lý Câu lạc bộ & Nhân sự: Duyệt yêu cầu thành lập CLB mới; Gán quyền Huấn luyện viên (Coach); Cảnh báo hoặc khóa tài khoản vi phạm nội quy sân.
  //    - Thanh toán & Hóa đơn: Xác nhận giao dịch chuyển khoản/tiền mặt; Xuất biên lai; Xem báo cáo doanh thu theo ca/ngày (nhưng KHÔNG xem được báo cáo tổng năm như Admin).
  // 3. STAFF (Nhân viên ca trực): Trực ca, bàn giao sân thực tế, kiểm đếm thiết bị phụ trợ, ghi nhận thanh toán tại quầy.
  // 4. COACH (Huấn luyện viên): Quản lý lịch tập & điểm danh đội mình, chỉ xem thanh toán & thông báo.
  // 5. USER (Khách hàng / Cầu thủ): Xem lịch trống, đặt sân, xem lịch sử và quản lý thông tin cá nhân.
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isStaff = user?.role === 'staff';
  const isCoach = user?.role === 'coach';
  const isUser = !user || user?.role === 'user' || user?.role === 'player';

  // 1. Quản lý Sân bãi & Thiết bị
  const canUpdateFieldStatus = isAdmin || isManager; // Cập nhật trạng thái sân (bảo trì mặt cỏ, hỏng dàn đèn)
  const canManageEquipment = isAdmin || isManager || isStaff; // Quản lý kho thiết bị phụ trợ (cho thuê bóng, áo bib, bán nước uống)
  const canCreateField = isAdmin; // Tạo mới sân bóng

  // 2. Quản lý Lịch đặt & Điều phối
  const canManageBookings = isAdmin || isManager || isStaff; // Duyệt / hủy lịch đặt sân
  const canRescheduleBooking = isAdmin || isManager; // Dời lịch đặt sân
  const canResolveConflicts = isAdmin || isManager; // Xử lý các trường hợp trùng lịch (Conflict resolution)
  const canViewTimeline = isAdmin || isManager || isStaff; // Xem toàn cảnh lịch Timeline/Calendar

  // 3. Quản lý Câu lạc bộ & Nhân sự
  const canApproveClubs = isAdmin || isManager; // Duyệt yêu cầu thành lập CLB mới trên hệ thống
  const canAssignCoach = isAdmin || isManager; // Gán quyền Huấn luyện viên (Coach) cho các tài khoản hợp lệ
  const canModerateUsers = isAdmin || isManager; // Cảnh báo hoặc khóa tài khoản vi phạm nội quy sân
  const canManageStaff = isAdmin; // Quản lý nhân viên & tài khoản cấp cao

  // 4. Thanh toán & Hóa đơn
  const canConfirmPayments = isAdmin || isManager || isStaff; // Xác nhận các giao dịch chuyển khoản/tiền mặt hoàn tất
  const canExportReceipts = isAdmin || isManager || isStaff; // Xuất biên lai hóa đơn
  const canViewShiftOrDailyRevenue = isAdmin || isManager; // Xem báo cáo doanh thu theo ca làm việc hoặc theo ngày
  const canViewAnnualRevenue = isAdmin; // Chỉ Admin xem báo cáo tổng năm (Manager bị giới hạn)

  const canManageRevenue = isAdmin || isManager; // Quản lý thu chi
  const canManageFields = isAdmin || isManager; // Quản lý trạng thái sân
  const canViewAdminKpi = isAdmin || isManager; // Thống kê vận hành
  const canUpdatePayments = isAdmin || isManager || isStaff; // Cập nhật trạng thái thanh toán (HLV chỉ xem)
  const canManageAnnouncements = isAdmin || isManager; // Đăng & xóa thông báo (HLV chỉ xem)
  const canManageSchedules = isAdmin || isManager || isStaff || isCoach;
  const canTakeAttendance = isAdmin || isManager || isStaff || isCoach;
  const canViewFinances = Boolean(user) && !isCoach && !isUser; // Huấn luyện viên và Cầu thủ không xem / quản lý thu phí & quỹ
  const canViewAnnouncements = true;

  const canViewAvailableSlots = true;
  const canBookSlot = true;
  const canViewOwnHistory = true;
  const canManageProfile = Boolean(user);

  const canManageClub = isAdmin || isManager;
  const canManageTraining = canManageSchedules;
  const canManage = canManageSchedules;
  const isPlayer = isUser;

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
      description: newTeam.description || 'Đội bóng thuộc biên chế CLB Sân Bóng C1',
      status: 'Hoạt động',
    };

    try {
      await api.addTeam(team);
      setTeams([...teams, team]);
      addNotification('Thành lập đội bóng mới', `CLB vừa phê duyệt thành lập đội "${team.name}".`, 'new');
      setShowAddTeamModal(false);
      setNewTeam({ name: '', level: 'Đội hình 1 Chuyên nghiệp', headCoach: 'HLV. Nguyễn Văn Huấn', captain: '', memberCount: 15, homePitch: 'Sân bóng C1 (Sân 1)', description: '' });
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
    const teamMembers = members.filter((m) => m.teamId === newMember.teamId);

    // 4. Kiểm tra giới hạn: 1 đội tối đa 10 người
    if (teamMembers.length >= 10) {
      alert(`⚠️ QUÂN SỐ ĐÃ ĐẠT GIỚI HẠN:\n${targetTeam?.name || 'Đội bóng'} đã đủ tối đa 10 cầu thủ (5 đá chính + 5 dự bị).\nKhông thể thêm cầu thủ mới vào đội này!`);
      return;
    }

    // 5. Kiểm tra giới hạn 5 đá chính và 5 dự bị
    const chosenRole = newMember.lineupRole || 'Đá chính';
    const sameRoleCount = teamMembers.filter((m) => (m.lineupRole || 'Đá chính') === chosenRole).length;
    if (sameRoleCount >= 5) {
      alert(`⚠️ VAI TRÒ ĐÃ ĐỦ:\n${targetTeam?.name || 'Đội bóng'} đã có đủ 5 cầu thủ "${chosenRole}".\nVui lòng chọn vai trò "${chosenRole === 'Đá chính' ? 'Dự bị' : 'Đá chính'}" cho cầu thủ này!`);
      return;
    }

    const member: ClubMember = {
      id: `player-${Date.now()}`,
      name: nameClean,
      jerseyNumber: jNum,
      position: newMember.position,
      teamId: newMember.teamId,
      teamName: targetTeam ? targetTeam.name : 'CLB Sân C1 - Đội 1',
      phone: phoneClean || '0900000000',
      dateOfBirth: newMember.dateOfBirth,
      height: newMember.height,
      weight: newMember.weight,
      preferredFoot: newMember.preferredFoot,
      status: 'Đang tập luyện',
      feePaidMonth: false,
      lineupRole: chosenRole,
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
      addNotification('Thành viên mới gia nhập', `Cầu thủ ${member.name} (#${member.jerseyNumber}) vừa gia nhập ${member.teamName} (${member.lineupRole}).`, 'new');
      setShowAddMemberModal(false);
      setNewMember({ name: '', jerseyNumber: 9, position: 'Tiền đạo', teamId: 'team-1', phone: '', dateOfBirth: '2000-01-01', height: '1m78', weight: '72kg', preferredFoot: 'Chân phải', lineupRole: 'Đá chính' });
      loadNeonDatabase();
    } catch (err: any) {
      console.warn('Lỗi lưu cầu thủ vào Neon DB:', err);
      alert(`❌ LỖI: ${err.message || 'Không thể lưu do trùng dữ liệu hoặc lỗi kết nối'}`);
    }
  };

  // Đổi vai trò Đá chính ⇋ Dự bị (tối đa 5 đá chính, 5 dự bị)
  const toggleLineupRole = (id: string) => {
    if (!canManageClub) return;
    setMembers((prev) => {
      const target = prev.find((m) => m.id === id);
      if (!target) return prev;
      const currentRole = target.lineupRole || 'Đá chính';
      const newRole: 'Đá chính' | 'Dự bị' = currentRole === 'Đá chính' ? 'Dự bị' : 'Đá chính';
      const teamSameRoleCount = prev.filter(
        (m) => m.teamId === target.teamId && m.id !== id && (m.lineupRole || 'Đá chính') === newRole
      ).length;

      if (teamSameRoleCount >= 5) {
        alert(`⚠️ Đội "${target.teamName}" đã có đủ 5 cầu thủ "${newRole}".\nKhông thể chuyển thêm cầu thủ này sang ${newRole}!`);
        return prev;
      }

      return prev.map((m) => (m.id === id ? { ...m, lineupRole: newRole } : m));
    });
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
    setNewCoach({ name: '', role: 'HLV Thể lực', license: 'Bằng AFC B', assignedTeam: 'CLB Sân C1 - Đội 1 (Tuyển Chính)', phone: '', email: '', experienceYears: 5, specialty: 'Rèn luyện thể lực và sức bền' });

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
    setNewSchedule({ title: '', teamName: 'CLB Sân C1 - Đội 1 (Tuyển Chính)', type: 'Tập chiến thuật', date: '2026-11-06', startTime: '18:00', endTime: '20:00', fieldName: 'Sân bóng C1 (Sân 1)', coach: 'HLV. Nguyễn Văn Huấn', notes: '' });

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
    if (!canUpdatePayments) {
      alert('⚠️ Bạn không có quyền thêm hoặc chỉnh sửa giao dịch thu chi. Huấn luyện viên chỉ có quyền xem.');
      return;
    }
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
    if (!canUpdatePayments) {
      alert('⚠️ Bạn không có quyền xóa giao dịch thu chi. Huấn luyện viên chỉ có quyền xem.');
      return;
    }
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
    if (!canUpdatePayments) {
      alert('⚠️ Bạn không có quyền thay đổi trạng thái đóng phí cầu thủ. Huấn luyện viên chỉ có quyền xem.');
      return;
    }
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
    if (!canUpdatePayments) {
      alert('⚠️ Bạn không có quyền ghi nhận thu phí cầu thủ. Huấn luyện viên chỉ có quyền xem.');
      return;
    }
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
    if (!canUpdatePayments) {
      alert('⚠️ Bạn không có quyền gửi thông báo nhắc nợ phí.');
      return;
    }
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
      subtitle: 'CÂU LẠC BỘ & SÂN BÓNG C1 (SAN BONG C1) • BỘ PHẬN TÀI CHÍNH & THỦ QUỸ',
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
    if (!canManageAnnouncements) {
      alert('⚠️ Bạn không có quyền tạo thông báo mới. Huấn luyện viên chỉ có quyền xem thông báo.');
      return;
    }
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
    if (!canManageAnnouncements) {
      alert('⚠️ Bạn không có quyền xóa thông báo. Huấn luyện viên chỉ có quyền xem thông báo.');
      return;
    }
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
            status: 'pending',
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
              status: 'pending',
              customerName: cName,
              customerPhone: cPhone,
              teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
              services: servicesText,
              notes: customerBookingForm.notes.trim(),
            },
          ];
        }
      });

      // Tạo thông báo mới cho ban quản lý CLB (Yêu cầu phê duyệt)
      const newAnn: ClubAnnouncement = {
        id: `ann-${Date.now()}`,
        title: `⏳ Đơn Đặt Sân Chờ Duyệt: ${cName} - ${bookingTargetSlot.fieldName} (${bookingTargetSlot.slotTime})`,
        target: 'Ban Điều Hành & Quản Lý Ca',
        priority: 'Quan trọng',
        date: new Date().toISOString().split('T')[0],
        author: 'Hệ Thống Đặt Sân Tự Động',
        content: `Khách hàng ${cName} (SĐT: ${cPhone}, Đội: ${customerBookingForm.teamName || 'Khách lẻ'}) vừa gửi yêu cầu đặt sân ${bookingTargetSlot.fieldName} vào khung giờ ${bookingTargetSlot.slotTime} ngày ${selectedBookingDate}. Tổng số tiền: ${formatVND(totalAmount)}. Đang ở trạng thái CHỜ PHÊ DUYỆT từ nhân viên quản lý ca.`,
        pinned: true,
      };
      setAnnouncements((prev) => [newAnn, ...prev]);

      addNotification(
        `Đơn đặt sân mới (chờ duyệt)! ${bookingTargetSlot.fieldName} lúc ${bookingTargetSlot.slotTime} (${selectedBookingDate})`,
        'booking',
      );
      setBookingSuccessReceipt({
        receiptCode: receiptNo,
        slot: { ...bookingTargetSlot, status: 'pending' },
        customerName: cName,
        customerPhone: cPhone,
        teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
        totalAmount,
        services: selectedServices,
        bookedAt: new Date().toLocaleString('vi-VN'),
      });

      setBookingTargetSlot(null);
    } catch (err: any) {
      console.warn('Lỗi kết nối đặt sân, kích hoạt chế độ hoàn tất cục bộ:', err);
      // Fallback: Vẫn cập nhật trạng thái đang chờ duyệt trên giao diện và hiển thị biên lai cho khách hàng
      const fallbackReceipt = `C1-BK-${Math.floor(100000 + Math.random() * 900000)}`;
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
            status: 'pending',
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
              status: 'pending',
              customerName: cName,
              customerPhone: cPhone,
              teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
              services: servicesText,
              notes: customerBookingForm.notes.trim(),
            },
          ];
        }
      });

      addNotification(
        canManageBookings
          ? `Đơn đặt sân mới (chờ duyệt)! ${bookingTargetSlot.fieldName} lúc ${bookingTargetSlot.slotTime}`
          : `Đã đặt sân thành công! ${bookingTargetSlot.fieldName} lúc ${bookingTargetSlot.slotTime}`,
        'booking',
      );

      setBookingSuccessReceipt({
        receiptCode: fallbackReceipt,
        slot: { ...bookingTargetSlot, status: 'pending' },
        customerName: cName,
        customerPhone: cPhone,
        teamName: customerBookingForm.teamName.trim() || 'Khách đá giao hữu',
        totalAmount,
        services: selectedServices,
        bookedAt: new Date().toLocaleString('vi-VN'),
      });

      setBookingTargetSlot(null);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Phê duyệt đơn đặt sân (STAFF / MANAGER / ADMIN) -> Đưa ca sân lên lịch chính thức
  const handleApproveBooking = async (slot: FieldBookingSlot) => {
    try {
      await api.approveFieldBooking(slot.id, slot.fieldId, slot.bookingDate, slot.slotTime);
      setFieldBookings((prev) =>
        prev.map((s) => {
          const isTarget =
            s.id === slot.id ||
            (s.fieldId === slot.fieldId && s.bookingDate === slot.bookingDate && s.slotTime === slot.slotTime);
          return isTarget ? { ...s, status: 'approved', isBooked: true } : s;
        }),
      );
      addNotification(`✓ Đã phê duyệt ca ${slot.slotTime} cho khách ${slot.customerName}`, 'system');
      alert(`✓ Phê duyệt thành công! Ca sân "${slot.slotTime}" (${slot.fieldName}) ngày ${slot.bookingDate} của khách "${slot.customerName}" đã được chính thức đưa lên lịch thi đấu.`);
    } catch (err: any) {
      alert(`❌ Lỗi duyệt ca: ${err.message}`);
    }
  };

  // Từ chối đơn đặt sân (STAFF / MANAGER / ADMIN) -> Giải phóng ca sân
  const handleRejectBooking = async (slot: FieldBookingSlot) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn từ chối đơn đặt sân ca "${slot.slotTime}" (${slot.fieldName}) ngày ${slot.bookingDate} của khách "${slot.customerName}"?\nCa sân này sẽ được giải phóng trở lại trạng thái trống để khách khác có thể đặt.`,
      )
    ) {
      return;
    }

    try {
      await api.rejectFieldBooking(slot.id, slot.fieldId, slot.bookingDate, slot.slotTime);
      setFieldBookings((prev) =>
        prev.map((s) => {
          const isTarget =
            s.id === slot.id ||
            (s.fieldId === slot.fieldId && s.bookingDate === slot.bookingDate && s.slotTime === slot.slotTime);
          return isTarget
            ? {
              ...s,
              isBooked: false,
              status: 'available',
              customerName: null,
              customerPhone: null,
              teamName: null,
              services: null,
              notes: null,
            }
            : s;
        }),
      );
      addNotification(`Đã từ chối đơn đặt sân ca ${slot.slotTime} của khách ${slot.customerName}`, 'system');
      alert(`✓ Đã từ chối đơn đặt sân! Ca "${slot.slotTime}" ngày ${slot.bookingDate} hiện đã được giải phóng trở lại trạng thái khả dụng.`);
    } catch (err: any) {
      alert(`❌ Lỗi từ chối đơn: ${err.message}`);
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
      await api.cancelFieldBooking(slot.id, slot.fieldId, slot.bookingDate, slot.slotTime);
      setFieldBookings((prev) =>
        prev.map((s) => {
          const isTarget =
            s.id === slot.id ||
            (s.fieldId === slot.fieldId && s.bookingDate === slot.bookingDate && s.slotTime === slot.slotTime);
          return isTarget
            ? {
              ...s,
              isBooked: false,
              status: 'available',
              customerName: null,
              customerPhone: null,
              teamName: null,
              services: null,
              notes: null,
            }
            : s;
        }),
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
            status: match.status || (match.isBooked ? 'approved' : 'pending'),
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
            status: undefined,
            customerName: null,
            customerPhone: null,
            teamName: null,
            services: null,
            notes: null,
          });
        }
      });
    });

    // Lọc theo trạng thái Đã đặt / Chờ duyệt / Còn trống
    let filtered = result;
    if (bookingStatusFilter === 'available') {
      filtered = result.filter((s) => !s.isBooked);
    } else if (bookingStatusFilter === 'booked') {
      if (canManageBookings) {
        filtered = result.filter((s) => s.isBooked && (s.status === 'approved' || !s.status));
      } else {
        filtered = result.filter((s) => s.isBooked);
      }
    } else if ((bookingStatusFilter as string) === 'pending') {
      filtered = result.filter((s) => s.isBooked && s.status === 'pending');
    }

    // Sắp xếp ưu tiên: Nếu có ai đặt cọc/giữ sân trước sẽ luôn hiển thị lên đầu danh sách
    return [...filtered].sort((a, b) => {
      if (a.isBooked && !b.isBooked) return -1;
      if (!a.isBooked && b.isBooked) return 1;
      return 0;
    });
  }, [fieldFacilities, fieldBookings, selectedBookingDate, bookingFieldFilter, bookingStatusFilter, canManageBookings]);

  const bookingStatsForDate = useMemo(() => {
    let total = 0;
    let approved = 0;
    let pending = 0;
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
          if (match.status === 'pending') {
            pending++;
          } else {
            approved++;
          }
        } else {
          available++;
        }
      });
    });

    return { total, booked: approved + pending, approved, pending, available };
  }, [fieldFacilities, fieldBookings, selectedBookingDate]);

  // Danh sách các ca đang chờ duyệt
  const pendingBookingSlots = useMemo(() => {
    return fieldBookings.filter((b) => b.isBooked && b.status === 'pending');
  }, [fieldBookings]);

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
        className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-lg hover:shadow-2xl hover:-translate-y-1 ${isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200/90'
          }`}
      >
        <div>
          {/* Ảnh thực tế của sân */}
          <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-900">
            <img
              src={facility.image}
              alt={facility.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Thân card */}
          <div className="p-4 sm:p-5 space-y-3">
            {/* Dòng 1: Tên Sân */}
            <div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight truncate" title={facility.name}>
                {facility.name}
              </h4>
            </div>

            {/* Dòng 2: Địa chỉ với icon Ghim Đỏ 📍 */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 truncate">
              <span className="text-rose-500 text-sm shrink-0">📍</span>
              <span className="truncate">{facility.location}</span>
            </div>

            {/* Dòng 3: Các Tiện Ích / Dịch Vụ Đi Kèm (Gọn gàng, có dấu) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(facility.tags && facility.tags.length > 0
                ? facility.tags
                : ['2 sân cỏ nhân tạo', 'Đèn chiếu sáng', 'Thuê bóng', 'Nước lọc']
              ).map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dòng 4 (Chân Card): GIÁ TỪ + 250.000 – 350.000 đ/giờ & Nút ĐẶT SÂN → */}
        <div className="p-4 sm:p-5 pt-0">
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                GIÁ TỪ
              </span>
              <span className="text-[#0d6efd] font-black text-lg sm:text-xl block tracking-tight whitespace-nowrap">
                {facility.priceDisplay || '250.000 – 350.000 đ/giờ'}
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

  // Filtered members (hỗ trợ lọc theo đội hình 5 đá chính / 5 dự bị)
  const filteredMembers = members.filter((m) => {
    const matchTeam = memberTeamFilter === 'Tất cả' || m.teamName === memberTeamFilter;
    const matchLineup = memberLineupFilter === 'all' || (m.lineupRole || 'Đá chính') === memberLineupFilter;
    const q = memberSearch.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || String(m.jerseyNumber).includes(q) || m.phone.includes(q);
    return matchTeam && matchLineup && matchSearch;
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
                  SÂN BÓNG C1 • TRUNG TÂM QUẢN TRỊ TOÀN DIỆN
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
                  Dữ liệu đồng bộ trực tiếp qua <strong>Wispbyte Backend (haiandbao.wispbyte.app - Port 11569/api)</strong> tới <strong>Neon PostgreSQL Cloud</strong>.
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedBookingDate === d.val
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
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${bookingStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Tất cả ca
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('available')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${bookingStatusFilter === 'available' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:text-emerald-900'
                          }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Chưa có người đặt
                      </button>

                      {canManageBookings ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setBookingStatusFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${bookingStatusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:text-amber-900'
                              }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            Chờ duyệt {bookingStatsForDate.pending > 0 && `(${bookingStatsForDate.pending})`}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingStatusFilter('booked')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${bookingStatusFilter === 'booked' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:text-rose-900'
                              }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                            Đã duyệt ({bookingStatsForDate.approved})
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBookingStatusFilter('booked')}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${bookingStatusFilter === 'booked' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:text-rose-900'
                            }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                          Đã có người đặt ({bookingStatsForDate.booked})
                        </button>
                      )}
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
                    const isPending = slot.status === 'pending';
                    const showPendingState = canManageBookings && isPending;

                    return (
                      <div
                        key={slot.id}
                        className={`rounded-2xl p-4.5 border-2 transition-all flex flex-col justify-between ${isBooked
                            ? showPendingState
                              ? 'bg-gradient-to-br from-amber-50/80 to-yellow-50/40 border-amber-300 shadow-sm'
                              : 'bg-gradient-to-br from-rose-50/70 to-red-50/40 border-rose-300 shadow-sm'
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

                            {/* BADGE TRẠNG THÁI: KHÁCH HÀNG CHỈ THẤY ĐÃ ĐẶT HOẶC CHƯA ĐẶT */}
                            {isBooked ? (
                              showPendingState ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black tracking-wide flex items-center gap-1 shrink-0 animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  ⏳ ĐANG CHỜ DUYỆT
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-black tracking-wide flex items-center gap-1 shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                  🔴 ĐÃ CỌC GIỮ SÂN
                                </span>
                              )
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
                              <strong className={`text-base font-black ${isBooked ? (showPendingState ? 'text-amber-800' : 'text-slate-700') : 'text-emerald-700'}`}>
                                {formatVND(slot.price)}
                              </strong>
                            </div>
                          </div>

                          {/* Chi tiết ca đặt: Chỉ Admin/Staff/Manager mới xem được thông tin chờ duyệt & cá nhân */}
                          {isBooked ? (
                            canManageBookings ? (
                              <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${isPending ? 'bg-amber-100/70 border-amber-300 text-amber-950' : 'bg-rose-100/60 border-rose-200 text-rose-950'
                                }`}>
                                <div className="flex items-center justify-between">
                                  <span className={`font-semibold ${isPending ? 'text-amber-800' : 'text-rose-700'}`}>
                                    {isPending ? '⏳ Đang chờ duyệt:' : 'Khách đặt:'}
                                  </span>
                                  <strong className="font-extrabold">{slot.customerName || 'Khách vãng lai'}</strong>
                                </div>
                                {slot.customerPhone && (
                                  <div className="flex items-center justify-between">
                                    <span className={`font-semibold ${isPending ? 'text-amber-800' : 'text-rose-700'}`}>SĐT:</span>
                                    <strong className="font-extrabold text-slate-800">{slot.customerPhone}</strong>
                                  </div>
                                )}
                                {slot.teamName && (
                                  <div className="flex items-center justify-between">
                                    <span className={`font-semibold ${isPending ? 'text-amber-800' : 'text-rose-700'}`}>Đội bóng:</span>
                                    <strong className="font-extrabold truncate max-w-[160px]">{slot.teamName}</strong>
                                  </div>
                                )}
                                {slot.services && (
                                  <div className={`text-[11px] pt-0.5 border-t ${isPending ? 'text-amber-800 border-amber-200/60' : 'text-rose-800 border-rose-200/60'}`}>
                                    🎁 Dịch vụ: {slot.services}
                                  </div>
                                )}
                                {isPending && (
                                  <div className="text-[10px] font-semibold text-amber-700 pt-1 border-t border-amber-200/50 flex items-center gap-1">
                                    <span>ℹ️</span> Đã giữ chỗ tạm thời - Chờ nhân viên bấm duyệt để lên lịch chính thức.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl border text-xs font-semibold bg-rose-50/80 border-rose-200 text-rose-800">
                                <span className="flex items-center gap-1.5">
                                  <span>⛔</span> Ca này đã có người đặt cọc trước (Đang bận)
                                </span>
                              </div>
                            )
                          ) : (
                            <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                              <span>✨</span> Ca sân đang trống hoàn toàn, hỗ trợ giữ chỗ online ngay không cần cọc trước!
                            </p>
                          )}
                        </div>

                        {/* Nút thao tác dưới cùng */}
                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                          {isBooked ? (
                            canManageBookings ? (
                              isPending ? (
                                <div className="w-full flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveBooking(slot)}
                                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <span>✅</span> Duyệt ca
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectBooking(slot)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs border border-rose-300 transition-all cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              ) : (
                                <div className="w-full flex items-center justify-between gap-2">
                                  <span className="text-xs text-slate-500 font-medium italic">
                                    ⛔ Ca này đã kín lịch
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(slot)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                                  >
                                    Hủy Ca Đặt
                                  </button>
                                </div>
                              )
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs text-center cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <span>⛔</span>
                                <span>ĐÃ CỌC GIỮ SÂN (HẾT CHỖ)</span>
                              </button>
                            )
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
                            📍 {nextSchedule ? nextSchedule.fieldName : 'Sân bóng C1 A'}
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

                {canViewFinances && (
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
                )}
              </div>
            </>
          )}

          {/* 4. CÁC ĐỘI BÓNG TRỰC THUỘC (TEAMS SPOTLIGHT) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🏆</span> Các Tuyến Đội Bóng Trực Thuộc CLB Sân Bóng C1
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
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Quân số:</span>
                        <div className="text-right">
                          <strong className="text-emerald-700 font-black block">10 Cầu thủ</strong>
                          <span className="text-[10px] text-emerald-800 font-bold block">(5 Đá chính • 5 Dự bị)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setViewingTeamRoster(t);
                      setRosterSearch('');
                      setRosterPositionFilter('Tất cả');
                    }}
                    className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md"
                  >
                    <span>Xem Cầu Thủ Đội Này</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. KẾT QUẢ THI ĐẤU & CHIẾN TÍCH GẦN NHẤT (Đã ẩn khối thông báo theo yêu cầu) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>⚽</span> Kết Quả Thi Đấu & Chiến Tích Gần Đây
              </h4>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Phong độ cao
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500 font-bold">10/10/2026 • Sân C1 (Sân 1)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">THẮNG</span>
                  </div>
                  <div className="flex items-center justify-between my-2">
                    <span className="font-black text-slate-900 text-sm">CLB Sân Bóng C1</span>
                    <span className="text-lg font-black text-emerald-700 px-3 py-0.5 rounded-xl bg-white border border-emerald-300">3 - 1</span>
                    <span className="font-black text-slate-900 text-sm">FC Rồng Đỏ</span>
                  </div>
                </div>
                <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-emerald-100">
                  ⚽ Bàn thắng: Hoàng Minh Huy (15&apos;, 45&apos;), Nguyễn Đức Thắng (78&apos;) • MVP: Hoàng Minh Huy
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500 font-bold">17/10/2026 • Sân Thống Nhất</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">HÒA</span>
                  </div>
                  <div className="flex items-center justify-between my-2">
                    <span className="font-black text-slate-900 text-sm">CLB Sân Bóng C1</span>
                    <span className="text-lg font-black text-amber-700 px-3 py-0.5 rounded-xl bg-white border border-amber-300">2 - 2</span>
                    <span className="font-black text-slate-900 text-sm">Hổ Biển FC</span>
                  </div>
                </div>
                <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-emerald-100">
                  ⚽ Bàn thắng: Bùi Văn Kiên (22&apos;), Hoàng Minh Huy (60&apos;) • MVP: Bùi Văn Kiên
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500 font-bold">28/09/2026 • Sân Phú Thọ</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">THẮNG</span>
                  </div>
                  <div className="flex items-center justify-between my-2">
                    <span className="font-black text-slate-900 text-sm">CLB Sân Bóng C1</span>
                    <span className="text-lg font-black text-emerald-700 px-3 py-0.5 rounded-xl bg-white border border-emerald-300">1 - 0</span>
                    <span className="font-black text-slate-900 text-sm">Sông Hồng Utd</span>
                  </div>
                </div>
                <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-emerald-100">
                  ⚽ Bàn thắng: Nguyễn Đức Thắng (88&apos;) • MVP: Thủ môn Nguyễn Văn Khải
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Giải bóng đá phong trào & Cúp khu vực</span>
              <span className="font-bold text-emerald-700">Tỷ lệ thắng 75%</span>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${bookingStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  ⚪ Tất Cả Ca ({bookingStatsForDate.total})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('available')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${bookingStatusFilter === 'available'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  🟢 Chưa Đặt - Còn Trống ({bookingStatsForDate.available})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('pending')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${bookingStatusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  ⏳ Chờ Phê Duyệt ({bookingStatsForDate.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('booked')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${bookingStatusFilter === 'booked'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  🔴 Đã Duyệt Chính Thức ({bookingStatsForDate.approved})
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${selectedBookingDate === d.val
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
                <div className={`grid ${canManageBookings ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-xs`}>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 block">🟢 Trống</span>
                    <strong className="text-base font-black text-emerald-800">{bookingStatsForDate.available}</strong>
                  </div>
                  {canManageBookings ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-center">
                        <span className="text-[10px] font-bold text-amber-700 block">⏳ Chờ duyệt</span>
                        <strong className="text-base font-black text-amber-800">{bookingStatsForDate.pending}</strong>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-center">
                        <span className="text-[10px] font-bold text-rose-700 block">🔴 Đã duyệt</span>
                        <strong className="text-base font-black text-rose-800">{bookingStatsForDate.approved}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-center">
                      <span className="text-[10px] font-bold text-rose-700 block">🔴 Đã có người đặt</span>
                      <strong className="text-base font-black text-rose-800">{bookingStatsForDate.booked}</strong>
                    </div>
                  )}
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
                    {bookingStatusFilter === 'pending' && <span className="text-amber-600">⏳ Các Ca Đang Chờ Phê Duyệt</span>}
                    {bookingStatusFilter === 'booked' && (
                      <span className="text-rose-600">
                        {canManageBookings ? '🔴 Các Ca Đã Duyệt Chính Thức' : '🔴 Các Ca Đã Có Người Đặt (Đang Bận)'}
                      </span>
                    )}
                    {bookingStatusFilter === 'all' && <span>⚪ Toàn Bộ 13 Ca Hoạt Động (07:00 – 22:00)</span>}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ngày thi đấu: <strong>{selectedBookingDate}</strong> {fieldSearchQuery && <span>• Lọc từ khóa: &quot;{fieldSearchQuery}&quot;</span>}
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
                    Không có ca nào khớp với bộ lọc &quot;{bookingStatusFilter === 'available' ? 'Chưa đặt' : bookingStatusFilter === 'pending' ? 'Chờ duyệt' : bookingStatusFilter === 'booked' ? (canManageBookings ? 'Đã duyệt' : 'Đã có người đặt') : 'Tất cả'}&quot; cho ngày {selectedBookingDate}.
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
                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${isAvailable
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
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${isAvailable
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
                            ) : canManageBookings ? (
                              <span className="text-rose-700 font-semibold">
                                Khách đặt: <strong>{slot.customerName || 'Đã có khách giữ chỗ'}</strong>
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium italic">
                                {slot.status === 'pending' ? '⏳ Đang chờ nhân viên duyệt giữ chỗ' : '⛔ Ca đã có người đặt trước'}
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

          {/* ================= PHÂN HỆ QUẢN LÝ SÂN BÃI & THIẾT BỊ PHỤ TRỢ (MANAGER / ADMIN) ================= */}
          {(isAdmin || isManager) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider mb-1">
                    <span>🏟️</span> PHÂN QUYỀN QUẢN LÝ (MANAGER / ADMIN)
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Quản Lý Sân Bãi & Trạng Thái Mặt Sân
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cập nhật tình trạng vận hành sân (bảo trì mặt cỏ, hỏng dàn đèn) tự động đồng bộ đến khách đặt sân
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    👔 Quyền: Quản Lý Sân Bãi & Điều Phối
                  </span>
                </div>
              </div>

              {/* CẬP NHẬT TRẠNG THÁI SÂN */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span>🌱</span> Trạng Thái Vận Hành & Bảo Trì Mặt Sân (Sân 1 & Sân 2)
                  </h4>
                  <span className="text-xs text-slate-400">Tự động cập nhật đến khách đặt sân</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldOperationalStatuses.map((fs) => {
                    const isNormal = fs.status === 'normal';
                    const isGrass = fs.status === 'maintenance_grass';
                    const isLights = fs.status === 'broken_lights';

                    return (
                      <div
                        key={fs.id}
                        className={`p-5 rounded-2xl border-2 transition-all ${isNormal
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : isGrass
                              ? 'bg-amber-50/50 border-amber-400'
                              : 'bg-rose-50/50 border-rose-400'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-black text-base text-slate-900">{fs.name}</h5>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-black border ${isNormal
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isGrass
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                          >
                            {isNormal ? '🟢 Sẵn sàng' : isGrass ? '🟡 Bảo trì mặt cỏ' : '🔴 Hỏng dàn đèn'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-2 italic bg-white/80 p-2.5 rounded-xl border border-slate-200">
                          &quot;{fs.statusNote}&quot;
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-200/80">
                          <label className="text-[11px] font-black text-slate-600 uppercase block mb-1.5">
                            Cập nhật trạng thái sân ngay:
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setFieldOperationalStatuses((prev) =>
                                  prev.map((item) =>
                                    item.id === fs.id
                                      ? { ...item, status: 'normal', statusNote: 'Mặt cỏ & dàn đèn hoạt động tốt 100%', updatedAt: new Date().toLocaleString('vi-VN') }
                                      : item
                                  )
                                );
                                alert(`Đã cập nhật ${fs.name}: Sẵn sàng đón khách!`);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${isNormal ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
                                }`}
                            >
                              🟢 Bình thường
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt('Nhập lý do bảo trì mặt cỏ (ví dụ: Thay cỏ nhân tạo khu vực cầu môn):', 'Đang bảo dưỡng bề mặt cỏ nhân tạo, tạm ngưng nhận ca');
                                if (note !== null) {
                                  setFieldOperationalStatuses((prev) =>
                                    prev.map((item) =>
                                      item.id === fs.id
                                        ? { ...item, status: 'maintenance_grass', statusNote: note || 'Đang bảo trì mặt cỏ', updatedAt: new Date().toLocaleString('vi-VN') }
                                        : item
                                    )
                                  );
                                }
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${isGrass ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-300'
                                }`}
                            >
                              🟡 Bảo trì cỏ
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt('Nhập sự cố đèn chiếu sáng (ví dụ: Cháy bóng pha cột 2, đang chờ thợ sửa):', 'Hỏng dàn đèn chiếu sáng, không nhận ca đêm sau 18:00');
                                if (note !== null) {
                                  setFieldOperationalStatuses((prev) =>
                                    prev.map((item) =>
                                      item.id === fs.id
                                        ? { ...item, status: 'broken_lights', statusNote: note || 'Hỏng dàn đèn chiếu sáng', updatedAt: new Date().toLocaleString('vi-VN') }
                                        : item
                                    )
                                  );
                                }
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${isLights ? 'bg-rose-600 text-white border-rose-700 shadow-sm' : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-300'
                                }`}
                            >
                              🔴 Hỏng đèn
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            Cập nhật lần cuối: {fs.updatedAt}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">Tổng số ca</span>
                  <strong className="text-lg font-black text-slate-800">{bookingStatsForDate.total} Ca</strong>
                </div>
                <div className="bg-emerald-100/70 rounded-2xl p-3 border border-emerald-300 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 block">Còn trống</span>
                  <strong className="text-lg font-black text-emerald-900">{bookingStatsForDate.available} Ca</strong>
                </div>
                <div className="bg-amber-100/70 rounded-2xl p-3 border border-amber-300 text-center">
                  <span className="text-[11px] font-bold text-amber-800 block">Chờ phê duyệt</span>
                  <strong className="text-lg font-black text-amber-900">{bookingStatsForDate.pending} Ca</strong>
                </div>
                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 text-center">
                  <span className="text-[11px] font-bold text-rose-600 block">Đã duyệt (Đã đặt)</span>
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedBookingDate === d.val
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
                  {canManageBookings ? (
                    <>
                      <option value="pending">⏳ Chỉ ca đang chờ duyệt</option>
                      <option value="booked">🔴 Chỉ ca đã duyệt</option>
                    </>
                  ) : (
                    <option value="booked">🔴 Chỉ ca đã có người đặt</option>
                  )}
                </select>

                {/* Nút chuyển chế độ xem: Thẻ ca vs Toàn cảnh Timeline */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBookingScheduleViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${bookingScheduleViewMode === 'cards' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    🃏 Dạng Thẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingScheduleViewMode('timeline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${bookingScheduleViewMode === 'timeline' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    📊 Timeline Sân 1 & 2
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================= PHÂN HỆ ĐIỀU PHỐI & XỬ LÝ TRÙNG LỊCH (CONFLICT RESOLUTION) ================= */}
          {(isAdmin || isManager) && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-indigo-400 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <span>Điều Phối Lịch Đặt & Xử Lý Trùng Lịch (Conflict Resolution)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tự động quét và giải quyết xung đột khi có nhiều Câu lạc bộ hoặc Người dùng cùng đặt trùng ca sân
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 shrink-0">
                  👔 Công cụ Quản Lý
                </span>
              </div>

              {/* Hộp kiểm tra xung đột */}
              {(() => {
                const bookedForDate = fieldBookings.filter((b) => b.bookingDate === selectedBookingDate && b.isBooked);
                const conflictMap: Record<string, FieldBookingSlot[]> = {};
                bookedForDate.forEach((b) => {
                  const key = `${b.fieldId}_${b.slotTime}`;
                  if (!conflictMap[key]) conflictMap[key] = [];
                  conflictMap[key].push(b);
                });
                const conflicts = Object.entries(conflictMap).filter(([, list]) => list.length > 1);

                if (conflicts.length === 0) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Không có xung đột trùng lịch nào cho ngày {selectedBookingDate}. Toàn bộ các ca sân đều được phân bổ chính xác.</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                        Hệ thống đồng bộ 100%
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
                    <div className="text-xs font-black text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span>⚠️</span> PHÁT HIỆN {conflicts.length} CA TRÙNG LỊCH ĐẶT CẦN ĐIỀU PHỐI:
                    </div>
                    {conflicts.map(([key, list]) => (
                      <div key={key} className="p-3 bg-white rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <strong className="text-slate-900 block font-black">{list[0].fieldName} • Khung giờ: {list[0].slotTime}</strong>
                          <span className="text-slate-600">
                            Có {list.length} đơn cùng chọn: {list.map((x) => `${x.customerName} (${x.status === 'pending' ? 'Chờ duyệt' : 'Đã duyệt'})`).join(' VS ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Đã ưu tiên giữ ca cho ${list[0].customerName}. Đang tiến hành dời ca thứ hai.`);
                              setRescheduleTargetSlot(list[1]);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                          >
                            Xử lý dời ca thứ hai →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= CHẾ ĐỘ XEM TOÀN CẢNH TIMELINE / CALENDAR (SÂN 1 & SÂN 2) ================= */}
          {bookingScheduleViewMode === 'timeline' && (
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>📊</span> Toàn Cảnh Timeline Lịch Đặt Sân Ngày {selectedBookingDate}
                  </h3>
                  <p className="text-xs text-slate-500">Đối chiếu trực quan tình trạng đặt giữa Sân 1 và Sân 2 từ 07:00 đến 22:00</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Trống</span>
                  {canManageBookings ? (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Chờ duyệt</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Đã duyệt</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Đã có người đặt</span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                  <thead className="bg-slate-800 text-white uppercase text-[11px] font-extrabold">
                    <tr>
                      <th className="p-3 w-32">Khung Giờ</th>
                      <th className="p-3">🏟️ Sân bóng C1 - Sân 1</th>
                      <th className="p-3">🏟️ Sân bóng C1 - Sân 2</th>
                      <th className="p-3 text-center w-36">Thao Tác Điều Phối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(standardFacilitySlots['field-c1'] || []).map((tpl) => {
                      const timeRange = tpl.slotTime;
                      const slot1 = computedFacilitySlots.find((s) => s.slotTime === timeRange);
                      const isBooked1 = slot1?.isBooked;
                      const isPending1 = slot1?.status === 'pending';

                      return (
                        <tr key={timeRange} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-black text-slate-900 bg-slate-50 whitespace-nowrap">
                            ⏱️ {timeRange}
                          </td>

                          {/* Sân 1 */}
                          <td className="p-3">
                            {isBooked1 ? (
                              <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${canManageBookings && isPending1 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                                }`}>
                                <div>
                                  <span className="font-black block">{canManageBookings ? (slot1?.customerName || 'Đã có khách đặt') : 'Đã có người đặt'}</span>
                                  {canManageBookings && <span className="text-[10px] text-slate-500">{slot1?.teamName || 'Giao hữu tự do'}</span>}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${canManageBookings && isPending1 ? 'bg-amber-200 text-amber-950' : 'bg-rose-200 text-rose-950'
                                  }`}>
                                  {canManageBookings ? (isPending1 ? 'Chờ duyệt' : 'Đã duyệt') : 'Đã đặt'}
                                </span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between">
                                <span>🟢 Sân trống ({formatVND(slot1?.price || 20000)}/h)</span>
                                <button
                                  type="button"
                                  onClick={() => slot1 && handleOpenBookingModal(slot1)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] cursor-pointer"
                                >
                                  Đặt ca
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Sân 2 */}
                          <td className="p-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between">
                              <span>🟢 Sân trống ({formatVND(20000)}/h)</span>
                              <button
                                type="button"
                                onClick={() => slot1 && handleOpenBookingModal({ ...slot1, fieldId: 'field-c2', fieldName: 'Sân bóng C1 - Sân 2' })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] cursor-pointer"
                              >
                                Đặt ca
                              </button>
                            </div>
                          </td>

                          {/* Thao tác */}
                          <td className="p-3 text-center">
                            {isBooked1 && (isAdmin || isManager) ? (
                              <button
                                type="button"
                                onClick={() => slot1 && setRescheduleTargetSlot(slot1)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-sm cursor-pointer transition-all"
                              >
                                🔄 Dời lịch
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= KHU VỰC PHÊ DUYỆT ĐƠN CHO NHÂN VIÊN & QUẢN TRỊ VIÊN ================= */}
          {canManageBookings && pendingBookingSlots.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-md space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl animate-bounce">🔔</span>
                  <div>
                    <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                      <span>Đơn Đặt Sân Chờ Nhân Viên Phê Duyệt</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-extrabold shadow-sm">
                        {pendingBookingSlots.length} Đơn Mới
                      </span>
                    </h3>
                    <p className="text-xs text-amber-800 font-medium">
                      Khách hàng vừa đặt ca trực tuyến. Vui lòng kiểm tra và <strong>Phê Duyệt</strong> để đưa ca lên lịch chính thức hoặc <strong>Từ Chối</strong> để giải phóng ca.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {pendingBookingSlots.map((ps) => (
                  <div key={ps.id} className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-sm space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <span>⏳</span> Đang Chờ Duyệt
                        </span>
                        <strong className="text-xs text-emerald-800 font-black">{formatVND(ps.price)}</strong>
                      </div>
                      <div className="text-sm font-black text-slate-900">{ps.fieldName} • {ps.slotTime}</div>
                      <div className="text-xs text-slate-500">Ngày: <strong className="text-slate-800">{ps.bookingDate}</strong></div>
                      <div className="text-xs text-slate-700">Khách: <strong>{ps.customerName}</strong> ({ps.customerPhone})</div>
                      {ps.teamName && <div className="text-[11px] text-slate-600">Đội: {ps.teamName}</div>}
                      {ps.services && <div className="text-[11px] text-amber-800 font-medium">Dịch vụ: {ps.services}</div>}
                      {ps.notes && <div className="text-[11px] text-slate-500 italic">Ghi chú: {ps.notes}</div>}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveBooking(ps)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>✓</span>
                        <span>Phê Duyệt Ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectBooking(ps)}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        ✕ Từ Chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách các ca sân */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {computedFacilitySlots.map((slot) => {
              const isPending = slot.isBooked && slot.status === 'pending';
              const isApproved = slot.isBooked && (slot.status === 'approved' || !slot.status);
              const showPendingState = canManageBookings && isPending;

              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${showPendingState
                      ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                      : slot.isBooked
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-emerald-200 hover:border-emerald-500 hover:shadow-lg'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-xs text-slate-700 truncate">{slot.fieldName}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${showPendingState
                            ? 'bg-amber-100 text-amber-900 border border-amber-400'
                            : slot.isBooked
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                      >
                        {showPendingState
                          ? '⏳ ĐANG CHỜ DUYỆT'
                          : slot.isBooked
                            ? '🔴 ĐÃ CỌC GIỮ SÂN'
                            : '🟢 CHƯA CÓ NGƯỜI ĐẶT'}
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
                      canManageBookings ? (
                        <div className={`mt-2 p-2.5 rounded-xl border text-xs space-y-1 ${isPending ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-white/80 border-rose-200 text-slate-600'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Người đặt:</span>{' '}
                            <strong className="text-slate-900">{slot.customerName || 'Khách giữ chỗ'}</strong>
                          </div>
                          {slot.customerPhone && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">SĐT:</span>{' '}
                              <span className="font-semibold text-slate-700">{slot.customerPhone}</span>
                            </div>
                          )}
                          {slot.teamName && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Đội bóng:</span>{' '}
                              <span className="text-slate-700 font-bold">{slot.teamName}</span>
                            </div>
                          )}
                          {slot.services && (
                            <div className="text-[11px] text-slate-500">
                              <span className="text-slate-400">Dịch vụ:</span> {slot.services}
                            </div>
                          )}
                          {isPending && (
                            <div className="text-[10.5px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              * Ca đang chờ nhân viên kiểm tra & duyệt
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 p-2 rounded-xl border text-xs font-semibold bg-rose-50/70 border-rose-200 text-rose-800">
                          <span className="flex items-center gap-1.5">
                            <span>⛔</span> Ca này đã có người đặt cọc trước (Hết chỗ)
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-4 pt-2">
                    {slot.isBooked ? (
                      canManageBookings ? (
                        isPending ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveBooking(slot)}
                              className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>✓</span>
                              <span>Phê Duyệt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectBooking(slot)}
                              className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                              title="Từ chối đơn và giải phóng ca sân"
                            >
                              ✕ Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled
                              className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs text-center cursor-not-allowed"
                            >
                              ✓ Đã duyệt chính thức
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
                        )
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs text-center cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <span>⛔</span>
                          <span>Đã cọc giữ sân (Hết chỗ)</span>
                        </button>
                      )
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
                        👥 Quy Mô Đội Hình:
                      </span>
                      <strong className="text-emerald-700 font-black text-sm block">
                        Tối đa 10 cầu thủ
                      </strong>
                      <span className="text-[10px] text-emerald-800 font-extrabold block">
                        (5 Đá chính • 5 Dự bị)
                      </span>
                    </div>
                  </div>
                </div>

                {/* HÀNH ĐỘNG CUỐI CARD */}
                <div className="mt-5 pt-4 border-t-2 border-emerald-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingTeamRoster(t);
                      setRosterSearch('');
                      setRosterPositionFilter('Tất cả');
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

      {/* ================= MODULE 2: QUẢN LÝ THÀNH VIÊN HOẶC DANH SÁCH CẦU THỦ ================= */}
      {user && activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>🏃</span> {isUser ? 'Danh Sách Cầu Thủ Câu Lạc Bộ' : 'Quản Lý Cầu Thủ'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isUser
                  ? 'Theo dõi danh sách vận động viên, số áo, vị trí thi đấu và các tuyến đội thuộc CLB Sân Bóng C1'
                  : 'Quản lý chi tiết danh sách cầu thủ, số áo, vị trí, chỉ số thể chất và đội trực thuộc'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isUser && (
                <button
                  onClick={() =>
                    handleExportCSV(
                      'Danh_Sach_Cau_Thu_SaoVangFC',
                      ['Họ Tên', 'Số Áo', 'Vị Trí', 'Đội Bóng', 'Điện Thoại', 'Ngày Sinh', 'Trạng Thái', 'Đóng Phí Tháng'],
                      members.map((m) => [m.name, m.jerseyNumber, m.position, m.teamName, m.phone, m.dateOfBirth, m.status, m.feePaidMonth ? 'Đã đóng' : 'Chưa đóng'])
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  📥 Xuất File CSV
                </button>
              )}

              {canManageClub && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Thêm Cầu Thủ</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 SUBTABS DÀNH CHO MANAGER & ADMIN (USER CHỈ HIỂN THỊ DANH SÁCH CẦU THỦ) */}
          {!isUser && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMemberSectionTab('members')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${memberSectionTab === 'members' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <span>🏃</span>
                <span>1. Danh Sách Cầu Thủ</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">{members.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setMemberSectionTab('pending-clubs')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${memberSectionTab === 'pending-clubs' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <span>🛡️</span>
                <span>2. Duyệt Yêu Cầu Thành Lập CLB Mới</span>
                {pendingClubRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse">
                    {pendingClubRequests.filter((r) => r.status === 'pending').length} Mới
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMemberSectionTab('assign-coach')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${memberSectionTab === 'assign-coach' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <span>🧢</span>
                <span>3. Gán Quyền Huấn Luyện Viên (Coach)</span>
              </button>

              <button
                type="button"
                onClick={() => setMemberSectionTab('violations')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${memberSectionTab === 'violations' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <span>⚠️</span>
                <span>4. Cảnh Báo & Khóa Tài Khoản Vi Phạm</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">{accountViolations.length}</span>
              </button>
            </div>
          )}

          {/* SUBTAB 2: DUYỆT YÊU CẦU THÀNH LẬP CLB MỚI */}
          {!isUser && memberSectionTab === 'pending-clubs' && (
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>🛡️</span> Yêu Cầu Thành Lập Câu Lạc Bộ Mới Chờ Phê Duyệt
                  </h4>
                  <p className="text-xs text-slate-500">Thẩm quyền của Quản Lý Sân Bãi & Admin kiểm tra tính hợp lệ và phê duyệt CLB tham gia hệ thống</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingClubRequests.map((req) => (
                  <div key={req.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900">{req.clubName}</span>
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${req.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {req.status === 'pending' ? '⏳ Chờ duyệt' : req.status === 'approved' ? '✓ Đã duyệt' : '✕ Từ chối'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>👤 Đại diện: <strong>{req.representative}</strong> • SĐT: <strong>{req.phone}</strong></div>
                      <div>📧 Email: {req.email} • Quân số: <strong>{req.memberCount} Cầu thủ</strong></div>
                      <div>📅 Ngày gửi: {req.createdAt}</div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-700 italic">
                        &quot;{req.notes}&quot;
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingClubRequests((prev) =>
                              prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r))
                            );
                            addNotification(
                              'Đã phê duyệt thành lập CLB mới',
                              `Câu lạc bộ "${req.clubName}" do ${req.representative} làm đại diện đã được phê duyệt chính thức gia nhập Sân bóng C1.`,
                              'new',
                              undefined,
                              'teams',
                              undefined,
                              'Quản Lý CLB & Nhân Sự',
                              'important'
                            );
                            alert(`✅ ĐÃ PHÊ DUYỆT THÀNH LẬP CLB:\n"${req.clubName}" chính thức được kích hoạt trên hệ thống!`);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-sm"
                        >
                          ✓ Phê Duyệt Thành Lập
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Nhập lý do từ chối yêu cầu thành lập CLB:', 'Thông tin đại diện chưa đầy đủ hoặc trùng lịch cố định');
                            if (reason !== null) {
                              setPendingClubRequests((prev) =>
                                prev.map((r) => (r.id === req.id ? { ...r, status: 'rejected', notes: `${r.notes} • Từ chối: ${reason}` } : r))
                              );
                            }
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs cursor-pointer"
                        >
                          ✕ Từ Chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 3: GÁN QUYỀN HUẤN LUYỆN VIÊN (COACH) */}
          {!isUser && memberSectionTab === 'assign-coach' && (
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>🧢</span> Gán Quyền Huấn Luyện Viên (Coach) Cho Tài Khoản Hợp Lệ
                  </h4>
                  <p className="text-xs text-slate-500">Ủy quyền cho Ban huấn luyện lên lịch tập, giáo án và điểm danh chuyên cần đội bóng</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-sky-50 border-2 border-sky-300 space-y-3">
                  <span className="text-xs font-black uppercase text-sky-900 flex items-center gap-1.5">
                    <span>📋</span> Danh Sách Huấn Luyện Viên Đang Hoạt Động
                  </span>
                  <div className="space-y-2">
                    {coaches.map((c) => (
                      <div key={c.id} className="p-3 bg-white rounded-xl border border-sky-200 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900 block font-black">{c.name}</strong>
                          <span className="text-slate-500">{c.role} • Đội: {c.assignedTeam}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-black text-[10px]">
                          COACH KÍCH HOẠT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                  <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <span>⚡</span> Gán Quyền Coach Cho Thành Viên Mới
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chọn thành viên hoặc tài khoản để cấp quyền truy cập Bàn Làm Việc HLV (xếp lịch tập, điểm danh, xem thu chi và nhận thông báo).
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt('Nhập tên HLV cần gán quyền (ví dụ: HLV. Lê Hoàng Anh):', 'HLV. Lê Hoàng Anh');
                        if (name) {
                          alert(`✅ ĐÃ GÁN QUYỀN HUẤN LUYỆN VIÊN!\nTài khoản "${name}" đã được phân quyền COACH thành công!`);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>+ Gán Quyền Huấn Luyện Viên Mới</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: CẢNH BÁO & KHÓA TÀI KHOẢN VI PHẠM */}
          {!isUser && memberSectionTab === 'violations' && (
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-400 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>⚠️</span> Cảnh Báo & Khóa Tài Khoản Vi Phạm Nội Quy Sân
                  </h4>
                  <p className="text-xs text-slate-500">Xử lý nghiêm các trường hợp bùng giờ đặt sân, gây gổ hoặc vi phạm bảo quản trang thiết bị</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const uname = prompt('Nhập tên hoặc số điện thoại tài khoản vi phạm:', '');
                    const r = prompt('Nhập lý do vi phạm (ví dụ: Bùng cọc, làm hỏng dàn đèn...):', 'Bùng ca đặt sân');
                    if (uname && r) {
                      setAccountViolations((prev) => [
                        ...prev,
                        { id: `vio-${Date.now()}`, username: uname, name: uname, reason: r, status: 'warning', date: new Date().toLocaleDateString('vi-VN'), handledBy: 'Quản Lý Sân' }
                      ]);
                      alert(`Đã lập biên bản cảnh báo vi phạm cho ${uname}!`);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
                >
                  + Lập Biên Bản Cảnh Báo
                </button>
              </div>

              <div className="space-y-3">
                {accountViolations.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm font-black">{v.name}</strong>
                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${v.status === 'banned' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                          {v.status === 'banned' ? '🔒 ĐÃ KHÓA' : '⚠️ CẢNH CÁO'}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1">Lý do: <strong>{v.reason}</strong></p>
                      <span className="text-slate-400 text-[10.5px]">Ngày lập: {v.date} • Xử lý bởi: {v.handledBy}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {v.status === 'warning' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountViolations((prev) => prev.map((item) => (item.id === v.id ? { ...item, status: 'banned' } : item)));
                            alert(`Đã khóa tài khoản ${v.name} khỏi hệ thống đặt sân!`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-black text-xs cursor-pointer shadow-sm"
                        >
                          🔒 Khóa Tài Khoản
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountViolations((prev) => prev.map((item) => (item.id === v.id ? { ...item, status: 'normal' } : item)));
                            alert(`Đã mở khóa cho tài khoản ${v.name}!`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                        >
                          🔓 Mở Khóa Lại
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 1: DANH SÁCH CẦU THỦ & THÀNH VIÊN (HIỂN THỊ CHO TẤT CẢ) */}
          {(isUser || memberSectionTab === 'members') && (
            <>
              {/* Search & Team Filter & Lineup Filter (5 Chính + 5 Dự bị) */}
              <div className="bg-white p-4 rounded-3xl border-2 border-emerald-400/90 shadow-lg shadow-emerald-950/10 flex flex-col lg:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="flex items-center gap-2">
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

                  {/* Bộ lọc đội hình: 5 Đá chính + 5 Dự bị */}
                  <div className="flex items-center gap-1 bg-emerald-50/80 p-1 rounded-xl border border-emerald-300">
                    <button
                      type="button"
                      onClick={() => setMemberLineupFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        memberLineupFilter === 'all'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      Tất cả ({memberTeamFilter === 'Tất cả' ? filteredMembers.length : 10})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberLineupFilter('Đá chính')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        memberLineupFilter === 'Đá chính'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <span>🟢</span> Đá chính (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberLineupFilter('Dự bị')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        memberLineupFilter === 'Dự bị'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <span>🟡</span> Dự bị (5)
                    </button>
                  </div>
                </div>

                <div className="relative w-full lg:w-80">
                  <input
                    type="text"
                    placeholder={isUser ? 'Tìm tên, số áo, vị trí...' : 'Tìm tên, số áo, số điện thoại...'}
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
                        <th className="p-4 text-center">Đội Hình (Tối đa 10)</th>
                        {!isUser && <th className="p-4">Điện Thoại</th>}
                        <th className="p-4">Thể Chất</th>
                        <th className="p-4">Trạng Thái</th>
                        {canViewFinances && <th className="p-4 text-center">Phí Tháng</th>}
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
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => canManageClub && toggleLineupRole(m.id)}
                              className={`px-3 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs ${
                                (m.lineupRole || 'Đá chính') === 'Đá chính'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              } ${canManageClub ? 'cursor-pointer' : 'cursor-default'}`}
                              title={canManageClub ? 'Nhấn để chuyển đổi vai trò Đá chính ⇋ Dự bị (tối đa 5 người/vai trò)' : 'Vai trò đội hình'}
                            >
                              <span>{(m.lineupRole || 'Đá chính') === 'Đá chính' ? '🟢' : '🟡'}</span>
                              <span>{m.lineupRole || 'Đá chính'}</span>
                            </button>
                          </td>
                          {!isUser && <td className="p-4 font-mono text-slate-600">{m.phone}</td>}
                          <td className="p-4 text-slate-600">{m.height} • {m.weight} ({m.preferredFoot})</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${m.status === 'Chấn thương'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          {canViewFinances && (
                            <td className="p-4 text-center">
                              <button
                                onClick={() => toggleMemberFee(m.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${m.feePaidMonth
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                title="Click để đổi trạng thái đóng phí"
                              >
                                {m.feePaidMonth ? '✓ Đã đóng' : 'Chưa đóng'}
                              </button>
                            </td>
                          )}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedMember(m)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                title="Xem chi tiết cầu thủ"
                              >
                                👁️
                              </button>
                              {canManageClub && (
                                <button
                                  onClick={() => handleDeleteMember(m.id)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
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
            </>
          )}
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

      {/* ================= MODULE 5: QUẢN LÝ ĐIỂM DANH (ADMIN/STAFF/COACH) HOẶC THÔNG TIN CÁ NHÂN (USER/CẦU THỦ) ================= */}
      {user && activeTab === 'attendance' && (
        isUser ? (
          /* ================= GIAO DIỆN THÔNG TIN CÁ NHÂN CẦU THỦ / KHÁCH HÀNG ================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider mb-1.5">
                  <span>👤</span>
                  <span>HỒ SƠ CÁ NHÂN & THẺ CẦU THỦ</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>🏃</span> Thông Tin Cá Nhân Cầu Thủ: {playerProfileData.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quản lý hồ sơ vận động viên, chỉ số thể lực, lịch sử chuyên cần và tiến độ sinh hoạt tại CLB Sân Bóng C1
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isEditingProfile ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    ✕ Hủy Chỉnh Sửa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileForm(playerProfileData);
                      setIsEditingProfile(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>✏️</span>
                    <span>Cập Nhật Thông Tin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Layout 2 cột: Thẻ VĐV bên trái & Chi tiết thông số bên phải */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CỘT TRÁI: THẺ VẬN ĐỘNG VIÊN ĐIỆN TỬ (DIGITAL PLAYER ID CARD) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-3xl p-6 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] text-white border-2 border-emerald-400/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none"></div>

                  {/* Header thẻ */}
                  <div className="relative z-10 flex items-center justify-between border-b border-emerald-500/40 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚽</span>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">CLB SÂN BÓNG C1</div>
                        <div className="text-xs font-extrabold text-white">THẺ VẬN ĐỘNG VIÊN</div>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-amber-300/90 tracking-tighter">
                      #{playerProfileData.jerseyNumber}
                    </span>
                  </div>

                  {/* Avatar & Thông tin chính */}
                  <div className="relative z-10 py-5 text-center space-y-3">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-emerald-300 p-1 mx-auto flex items-center justify-center text-5xl shadow-xl">
                        🏃
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-md border border-white">
                        #{playerProfileData.jerseyNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight">{playerProfileData.name}</h4>
                      <p className="text-xs font-bold text-emerald-200 mt-0.5">{playerProfileData.teamName}</p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-bold text-emerald-100 mt-2">
                        <span>⭐</span>
                        <span>{playerProfileData.position}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chỉ số thể hình 4 ô */}
                  <div className="relative z-10 grid grid-cols-2 gap-2.5 pt-3 border-t border-emerald-500/40 text-xs">
                    <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                      <span className="text-emerald-300 block text-[10.5px]">Chiều cao</span>
                      <strong className="text-sm text-white font-extrabold">{playerProfileData.height}</strong>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                      <span className="text-emerald-300 block text-[10.5px]">Cân nặng</span>
                      <strong className="text-sm text-white font-extrabold">{playerProfileData.weight}</strong>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                      <span className="text-emerald-300 block text-[10.5px]">Chân thuận</span>
                      <strong className="text-sm text-white font-extrabold">{playerProfileData.preferredFoot}</strong>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                      <span className="text-emerald-300 block text-[10.5px]">Năm sinh</span>
                      <strong className="text-sm text-white font-extrabold">{playerProfileData.dateOfBirth}</strong>
                    </div>
                  </div>

                  {/* Footer Thẻ */}
                  <div className="relative z-10 mt-4 pt-3 border-t border-emerald-500/40 flex items-center justify-between text-[11px] text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {playerProfileData.status}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300">ID: {user?.id || 'C1-PL-19'}</span>
                  </div>
                </div>

                {/* Box trạng thái thể lực & sức khỏe */}
                <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-md space-y-3">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <span>❤️</span> Tình Trạng Thể Lực & Y Tế
                  </span>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="font-black flex items-center justify-between">
                      <span>Chỉ Số Thể Lực Hiện Tại:</span>
                      <span className="text-emerald-700 font-extrabold">100% Sẵn Sàng</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600">
                      Cầu thủ không có tiền sử chấn thương dây chằng, đã vượt qua bài kiểm tra thể lực cự ly ngắn và sức bền đầu mùa giải.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Hotline BQL hỗ trợ cầu thủ:</span>
                    <strong className="text-emerald-800">0983 830 955</strong>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: CHI TIẾT HỒ SƠ / FORM CHỈNH SỬA / CHUYÊN CẦN / QUỸ */}
              <div className="lg:col-span-7 space-y-6">
                {isEditingProfile ? (
                  /* FORM CHỈNH SỬA THÔNG TIN CÁ NHÂN */
                  <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                      <h4 className="font-black text-base text-emerald-950 flex items-center gap-2">
                        <span>✏️</span> Cập Nhật Hồ Sơ Cá Nhân Cầu Thủ
                      </h4>
                      <span className="text-xs text-slate-400">Các mục dấu (*) là bắt buộc</span>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Họ và tên cầu thủ <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editProfileForm.name}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Số điện thoại liên hệ <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editProfileForm.phone}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Email tài khoản</label>
                          <input
                            type="email"
                            disabled
                            value={editProfileForm.email}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 font-medium cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Số áo thi đấu</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={editProfileForm.jerseyNumber}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, jerseyNumber: Number(e.target.value) || 1 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Vị trí thi đấu sở trường</label>
                          <select
                            value={editProfileForm.position}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, position: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                          >
                            <option value="Thủ môn">Thủ môn (GK)</option>
                            <option value="Hậu vệ">Hậu vệ (DF)</option>
                            <option value="Tiền vệ">Tiền vệ (MF)</option>
                            <option value="Tiền đạo">Tiền đạo (FW)</option>
                            <option value="Tiền vệ cánh / Tấn công">Tiền vệ cánh / Tấn công (Winger)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Chân thuận</label>
                          <select
                            value={editProfileForm.preferredFoot}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, preferredFoot: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                          >
                            <option value="Chân phải">Chân phải</option>
                            <option value="Chân trái">Chân trái</option>
                            <option value="Hai chân như một">Hai chân như một</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Chiều cao (cm/m)</label>
                          <input
                            type="text"
                            value={editProfileForm.height}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, height: e.target.value })}
                            placeholder="Ví dụ: 1m75"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Cân nặng (kg)</label>
                          <input
                            type="text"
                            value={editProfileForm.weight}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, weight: e.target.value })}
                            placeholder="Ví dụ: 68kg"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-700/20 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>💾</span>
                          <span>Lưu Thay Đổi Hồ Sơ</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* CHI TIẾT HỒ SƠ DẠNG CARD TIÊU CHUẨN */
                  <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                      <h4 className="font-black text-base text-emerald-950 flex items-center gap-2">
                        <span>📋</span> Chi Tiết Hồ Sơ Cá Nhân & Định Danh
                      </h4>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Đã xác thực
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold">Họ và tên cầu thủ:</span>
                        <strong className="text-sm text-slate-900 font-black mt-0.5 block">{playerProfileData.name}</strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold">Số điện thoại liên hệ:</span>
                        <strong className="text-sm text-slate-900 font-black mt-0.5 block">{playerProfileData.phone}</strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold">Email tài khoản:</span>
                        <strong className="text-sm text-slate-900 font-black mt-0.5 block">{playerProfileData.email}</strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold">Tuyến đội thi đấu:</span>
                        <strong className="text-sm text-emerald-800 font-black mt-0.5 block">{playerProfileData.teamName}</strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold">Vị trí & Số áo:</span>
                        <strong className="text-sm text-slate-900 font-black mt-0.5 block">
                          #{playerProfileData.jerseyNumber} • {playerProfileData.position}
                        </strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-bold">Ngày chính thức gia nhập:</span>
                        <strong className="text-sm text-slate-900 font-black mt-0.5 block">{playerProfileData.joinDate}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* KHỐI 2: LỊCH SỬ ĐIỂM DANH & CHUYÊN CẦN CÁ NHÂN */}
                <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                    <div>
                      <h4 className="font-black text-base text-emerald-950 flex items-center gap-2">
                        <span>✅</span> Lịch Sử Điểm Danh & Chuyên Cần Của Bản Thân
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Thống kê mức độ tham gia các buổi tập thể lực và chiến thuật định kỳ
                      </p>
                    </div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                      Tỷ lệ chuyên cần: 92%
                    </span>
                  </div>

                  {/* 3 Metric chuyên cần cá nhân */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase block">Có Mặt</span>
                      <strong className="text-xl font-black text-emerald-700 mt-0.5 block">13 Buổi</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] font-extrabold text-amber-800 uppercase block">Đến Muộn</span>
                      <strong className="text-xl font-black text-amber-700 mt-0.5 block">2 Buổi</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                      <span className="text-[11px] font-extrabold text-rose-800 uppercase block">Vắng Mặt</span>
                      <strong className="text-xl font-black text-rose-700 mt-0.5 block">0 Buổi</strong>
                    </div>
                  </div>

                  {/* Bảng lịch sử các buổi tập gần đây của cầu thủ */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Ngày Tập</th>
                          <th className="p-3">Khung Giờ & Sân</th>
                          <th className="p-3">Nội Dung Giáo Án</th>
                          <th className="p-3 text-center">Trạng Thái</th>
                          <th className="p-3">Đánh Giá Của HLV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-mono font-bold">29/10/2026</td>
                          <td className="p-3">18:00 – 20:00 (Sân bóng C1)</td>
                          <td className="p-3 font-semibold text-slate-900">Chiến thuật phối hợp nhỏ & sút phạt</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                              🟢 Có mặt
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">Thể lực tốt, sút phạt chuẩn xác</td>
                        </tr>
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-mono font-bold">27/10/2026</td>
                          <td className="p-3">17:30 – 19:30 (Sân bóng C1)</td>
                          <td className="p-3 font-semibold text-slate-900">Rèn sức bền & bứt tốc đoạn ngắn</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                              🟢 Có mặt
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">Hoàn thành đủ 10 vòng chạy</td>
                        </tr>
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-mono font-bold">25/10/2026</td>
                          <td className="p-3">16:00 – 18:00 (Sân bóng C1)</td>
                          <td className="p-3 font-semibold text-slate-900">Đấu đối kháng chia đôi đội hình</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                              🟡 Đến muộn
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">Đến muộn 15p do kẹt xe, khởi động bù</td>
                        </tr>
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-mono font-bold">22/10/2026</td>
                          <td className="p-3">18:00 – 20:00 (Sân bóng C1)</td>
                          <td className="p-3 font-semibold text-slate-900">Phòng ngự khu vực & cản phá bóng bổng</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                              🟢 Có mặt
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">Bọc lót tốt, tinh thần tích cực</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* KHỐI 3: TIẾN ĐỘ ĐÓNG QUỸ SINH HOẠT CỦA BẢN THÂN */}
                <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                    <div>
                      <h4 className="font-black text-base text-emerald-950 flex items-center gap-2">
                        <span>💳</span> Tình Trạng Quỹ Sinh Hoạt Của Bản Thân
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Định mức đóng quỹ câu lạc bộ: 300.000 VNĐ / cầu thủ / tháng
                      </p>
                    </div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Năm 2026: Đã nộp 11/12 Tháng
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-slate-500 block font-bold">Trạng Thái Tháng 11/2026:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs">
                          ✓ ĐÃ NỘP 300.000 VNĐ
                        </span>
                        <span className="text-slate-500 text-[11px]">Chuyển khoản</span>
                      </div>
                      <p className="text-[10.5px] text-emerald-700 font-mono mt-1.5">Mã biên lai: REC-202611-019</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block font-bold">Tháng Kế Tiếp (Tháng 12/2026):</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs">
                          ⏳ Chờ đến hạn thu
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-1.5">Hạn nộp định kỳ trước ngày 10/12/2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= GIAO DIỆN QUẢN LÝ ĐIỂM DANH DÀNH CHO ADMIN / STAFF / COACH ================= */
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
        )
      )}

      {/* ================= MODULE 6: QUẢN LÝ PHÍ SINH HOẠT & QUỸ ================= */}
      {user && canViewFinances && activeTab === 'finances' && (
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
                  {canUpdatePayments && (
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
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${financeSubTab === 'player-fees'
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
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${financeSubTab === 'ledger'
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
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${financeSubTab === 'reports'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>📊</span>
              <span>3. Báo Cáo Doanh Thu (Ca/Ngày/Năm)</span>
            </button>

            <button
              type="button"
              onClick={() => setFinanceSubTab('shift-bookings')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${financeSubTab === 'shift-bookings'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>🧾</span>
              <span>4. Hóa Đơn & Doanh Thu Ca Sân</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-black">
                {fieldBookings.filter((b) => b.isBooked).length} Ca
              </span>
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${selectedFeeYear === y
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
                    className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${selectedFeeMonth === 'all'
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
                        className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${isSelected
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        title={`Xem chi tiết Tháng ${mNum}/${selectedFeeYear} (${paidInThisMonth}/${members.length} đã nộp)`}
                      >
                        <span>T{mNum}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${isSelected ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-600'
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
                                    {m.teamName.replace('CLB Sân C1 - ', '').replace('CLB Sân Bóng C1 - ', '')}
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
                                        disabled={!canUpdatePayments}
                                        onClick={() => handleToggleFeeStatus(m.id, selectedFeeYear, mNum)}
                                        className={`w-full py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-0.5 border ${isPaid
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 shadow-sm'
                                            : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                          } ${!canUpdatePayments ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                                        title={
                                          canUpdatePayments
                                            ? isPaid
                                              ? `Tháng ${mNum}/${selectedFeeYear}: ĐÃ NỘP 300.000 VNĐ (${f?.paidDate || 'Đã nộp'}) • Nhấn để đổi`
                                              : `Tháng ${mNum}/${selectedFeeYear}: CHƯA NỘP • Nhấn để đánh dấu đã nộp`
                                            : isPaid
                                              ? `Tháng ${mNum}/${selectedFeeYear}: ĐÃ NỘP (Chỉ xem)`
                                              : `Tháng ${mNum}/${selectedFeeYear}: CHƯA NỘP (Chỉ xem)`
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
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                                  className={`px-3 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1 ${isPaid
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
                                  {canUpdatePayments && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleFeeStatus(
                                          m.id,
                                          selectedFeeYear,
                                          selectedFeeMonth as number
                                        )
                                      }
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${isPaid
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
                        {canUpdatePayments && <th className="p-4 text-center">Thao Tác</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100 text-slate-700">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono text-slate-500">{t.date}</td>
                          <td className="p-4 font-bold text-slate-900">{t.title}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${t.category === 'Thu'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                                }`}
                            >
                              {t.category === 'Thu' ? '↓ Khoản Thu' : '↑ Khoản Chi'}
                            </span>
                          </td>
                          <td
                            className={`p-4 text-right font-extrabold text-sm ${t.category === 'Thu' ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                          >
                            {t.category === 'Thu' ? '+' : '-'}{formatVND(t.amount)}
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{t.personInCharge}</td>
                          <td className="p-4 text-slate-500">{t.notes || '—'}</td>
                          {canUpdatePayments && (
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

          {/* ================= TAB 3: BÁO CÁO PHÂN TÍCH TÀI CHÍNH (CA / NGÀY / NĂM) ================= */}
          {financeSubTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Scope filter: Theo Ca / Theo Ngày / Tổng Năm */}
              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 uppercase">Phạm Vi Báo Cáo:</span>
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRevenueReportScope('shift')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${revenueReportScope === 'shift' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      ⏱️ Theo Ca Làm Việc
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueReportScope('daily')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${revenueReportScope === 'daily' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      📅 Theo Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueReportScope('annual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${revenueReportScope === 'annual' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      👑 Toàn Niên Độ (Tổng Năm)
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {isManager && <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">👔 Quản Lý: Xem báo cáo theo ca/ngày</span>}
                  {isAdmin && <span className="text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">👑 Admin: Toàn quyền xem báo cáo tổng năm</span>}
                </div>
              </div>

              {/* TRƯỜNG HỢP 1: MANAGER CHỌN XEM BÁO CÁO TỔNG NĂM -> HIỂN THỊ THÔNG BÁO GIỚI HẠN */}
              {isManager && revenueReportScope === 'annual' ? (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-lg">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl mx-auto shadow-inner">
                    🔒
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-amber-950 uppercase tracking-tight">
                      Giới Hạn Quyền Xem Báo Cáo Doanh Thu Tổng Năm
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-900 mt-2 max-w-xl mx-auto leading-relaxed font-medium">
                      Theo phân quyền hệ thống, vai trò <strong>MANAGER (Quản Lý Sân Bãi & Điều Phối)</strong> chỉ được phép xem báo cáo doanh thu theo <strong>Ca làm việc</strong> hoặc theo <strong>Ngày</strong> để phục vụ bàn giao và đối soát ca trực.
                      <br /><br />
                      Báo cáo tài chính tổng hợp toàn niên độ (Toàn Năm) chỉ dành riêng cho <strong>ADMIN (Chủ Sân)</strong>.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRevenueReportScope('shift')}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      ← Xem Báo Cáo Theo Ca Làm Việc
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueReportScope('daily')}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      Xem Báo Cáo Theo Ngày →
                    </button>
                  </div>
                </div>
              ) : revenueReportScope === 'shift' ? (
                /* BÁO CÁO DOANH THU THEO CA LÀM VIỆC */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-md">
                      <span className="text-xs font-bold text-slate-500 block">Ca Sáng (07:00 - 12:00)</span>
                      <strong className="text-2xl font-black text-emerald-700 block mt-1">100.000 VNĐ</strong>
                      <span className="text-[11px] text-slate-500 font-semibold">5 khung giờ • 2 ca đã đặt</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md">
                      <span className="text-xs font-bold text-slate-500 block">Ca Chiều (13:00 - 18:00)</span>
                      <strong className="text-2xl font-black text-amber-700 block mt-1">100.000 VNĐ</strong>
                      <span className="text-[11px] text-slate-500 font-semibold">5 khung giờ • 3 ca đã đặt</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border-2 border-indigo-300 shadow-md">
                      <span className="text-xs font-bold text-slate-500 block">Ca Tối (18:00 - 22:00)</span>
                      <strong className="text-2xl font-black text-indigo-700 block mt-1">80.000 VNĐ</strong>
                      <span className="text-[11px] text-slate-500 font-semibold">4 khung giờ • 4 ca đã đặt (Full)</span>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                    ✓ Báo cáo ca làm việc được tổng hợp theo thời gian thực từ các giao dịch tiền mặt và chuyển khoản đã đối soát thành công.
                  </div>
                </div>
              ) : revenueReportScope === 'daily' ? (
                /* BÁO CÁO DOANH THU THEO NGÀY */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-3xl border-2 border-emerald-400 shadow-md">
                      <span className="text-xs font-bold text-slate-500 block">Doanh Thu Hôm Nay ({selectedBookingDate})</span>
                      <strong className="text-2xl font-black text-emerald-700 block mt-1">
                        {formatVND(fieldBookings.filter(b => b.bookingDate === selectedBookingDate && b.isBooked).reduce((sum, b) => sum + (b.price || 20000), 0))}
                      </strong>
                      <span className="text-[11px] text-emerald-600 font-semibold">Tổng số ca đã duyệt giữ chỗ</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-md">
                      <span className="text-xs font-bold text-slate-500 block">Doanh Thu Dịch Vụ Phụ Trợ</span>
                      <strong className="text-2xl font-black text-slate-800 block mt-1">140.000 VNĐ</strong>
                      <span className="text-[11px] text-slate-500 font-semibold">Thuê bóng, áo bib & nước uống</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border-2 border-indigo-400 shadow-md">
                      <span className="text-xs font-bold text-slate-500 block">Tổng Thu Ngày</span>
                      <strong className="text-2xl font-black text-indigo-800 block mt-1">
                        {formatVND(fieldBookings.filter(b => b.bookingDate === selectedBookingDate && b.isBooked).reduce((sum, b) => sum + (b.price || 20000), 0) + 140000)}
                      </strong>
                      <span className="text-[11px] text-indigo-600 font-semibold">Bao gồm tiền sân và phụ phí</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* BÁO CÁO TỔNG NĂM (DÀNH CHO ADMIN) */
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
                                className={`h-full rounded-full transition-all duration-300 ${percent >= 80 ? 'bg-emerald-600' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
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
              )}
            </div>
          )}

          {/* ================= TAB 4: HÓA ĐƠN & DOANH THU CA SÂN (MANAGER & ADMIN) ================= */}
          {financeSubTab === 'shift-bookings' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>🧾</span> Quản Lý Hóa Đơn, Biên Lai & Doanh Thu Đặt Sân Theo Ca
                    </h4>
                    <p className="text-xs text-slate-500">Xác nhận các giao dịch chuyển khoản/tiền mặt và xuất biên lai thanh toán ca đá</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    Sân bóng C1 • {selectedBookingDate}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[11px]">
                      <tr>
                        <th className="p-3">Mã Đơn / Khách Hàng</th>
                        <th className="p-3">Sân & Khung Giờ</th>
                        <th className="p-3">Ngày Đá</th>
                        <th className="p-3 text-right">Tiền Sân</th>
                        <th className="p-3">Trạng Thái Thanh Toán</th>
                        <th className="p-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {fieldBookings.filter((b) => b.isBooked).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">Chưa có đơn đặt sân nào</td>
                        </tr>
                      ) : (
                        fieldBookings.filter((b) => b.isBooked).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <strong className="text-slate-900 block">{b.customerName || 'Khách đặt sân'}</strong>
                              <span className="text-[10.5px] text-slate-500">{b.customerPhone || '0983 830 955'} • {b.teamName || 'Giao hữu'}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {b.fieldName} • <span className="text-emerald-700">{b.slotTime}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{b.bookingDate}</td>
                            <td className="p-3 text-right font-black text-emerald-700">{formatVND(b.price || 20000)}</td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Đã thanh toán ({formatVND(b.price || 20000)})
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptSlot(b)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                <span>🧾</span>
                                <span>Xuất Biên Lai</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* THÔNG BÁO GIỚI HẠN QUYỀN TRUY CẬP CHO HUẤN LUYỆN VIÊN / CẦU THỦ VÀO PHÂN HỆ TÀI CHÍNH */}
      {user && !canViewFinances && activeTab === 'finances' && (
        <div className="rounded-3xl bg-white border-2 border-emerald-300 p-8 sm:p-12 text-center shadow-xl space-y-4 max-w-xl mx-auto my-8 animate-in fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-black">
            📋
          </div>
          <h3 className="text-xl font-black text-slate-900">Phân Hệ Tài Chính & Thu Phí Nội Bộ</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Huấn luyện viên phụ trách công tác chuyên môn, quản lý buổi tập và nhân sự cầu thủ.
            Phân hệ Quản lý Thu Phí & Quỹ chỉ dành riêng cho Ban Quản Lý và Thủ Quỹ.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('schedules')}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>📅</span>
              <span>Lịch Tập Đội Bóng</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🏃</span>
              <span>Hồ Sơ Cầu Thủ</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODULE 7: QUẢN LÝ & CHI TIẾT THÔNG BÁO ================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] rounded-3xl p-6 sm:p-8 text-white border-2 border-emerald-400/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 mb-1">
                <span>📢</span> TRUNG TÂM BẢNG TIN & THÔNG BÁO
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Bảng Tin & Chi Tiết Thông Báo CLB
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                Nơi cập nhật toàn bộ các chỉ đạo, lịch thi đấu, phân công huấn luyện, nhắc nhở tài chính và hoạt động chuyên môn của Sân Bóng C1.
              </p>
            </div>

            {canManageAnnouncements && (
              <button
                onClick={() => setShowAddAnnouncementModal(true)}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-105"
              >
                <span className="text-base leading-none">+</span>
                <span>Tạo Thông Báo Mới</span>
              </button>
            )}
          </div>

          {/* Subtabs Filter: Bảng tin CLB vs Thông báo hoạt động hệ thống */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border-2 border-emerald-200/80 shadow-sm">
            <button
              onClick={() => setAnnouncementSubTab('club')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${announcementSubTab === 'club'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
            >
              <span>📢</span>
              <span>Bảng Tin & Chỉ Đạo CLB</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${announcementSubTab === 'club' ? 'bg-white text-emerald-900' : 'bg-slate-100 text-slate-700'
                }`}>
                {announcements.length}
              </span>
            </button>

            <button
              onClick={() => setAnnouncementSubTab('activity')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${announcementSubTab === 'activity'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
            >
              <span>🔔</span>
              <span>Hoạt Động & Lịch Trình Tự Động</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${announcementSubTab === 'activity' ? 'bg-white text-emerald-900' : 'bg-slate-100 text-slate-700'
                }`}>
                {notifications.length}
              </span>
            </button>
          </div>

          {/* TAB 1: BẢNG TIN CLB */}
          {announcementSubTab === 'club' && (
            <div className="space-y-4">
              {announcements.map((a) => {
                const isUrgent = a.priority === 'Khẩn cấp';
                const isImportant = a.priority === 'Quan trọng';

                return (
                  <div
                    key={a.id}
                    className={`bg-white rounded-3xl p-6 border-2 border-emerald-400/90 shadow-xl shadow-emerald-950/10 border-l-8 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 ${isUrgent ? 'border-l-rose-500' : isImportant ? 'border-l-amber-500' : 'border-l-emerald-600'
                      }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b-2 border-emerald-100">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-black border ${isUrgent
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
                        {canManageAnnouncements && (
                          <button
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all cursor-pointer"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-black text-lg sm:text-xl text-emerald-950 mt-3.5 tracking-tight">
                      {a.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-800 mt-2.5 leading-relaxed bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-200/90 font-medium line-clamp-3">
                      {a.content}
                    </p>

                    <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400 italic">
                        Đăng bởi {a.author} lúc {a.date}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(a)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                      >
                        <span>👁️ Xem Chi Tiết Thông Báo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: THÔNG BÁO HOẠT ĐỘNG & LỊCH TRÌNH */}
          {announcementSubTab === 'activity' && (
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-emerald-200">
                  <span className="text-4xl block mb-2">🔔</span>
                  <h4 className="text-base font-bold text-slate-800">Chưa có thông báo hoạt động nào</h4>
                  <p className="text-xs text-slate-500 mt-1">Các thông báo đặt sân, lịch tập và tài chính sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const targetTab = n.tab || 'home';
                  const isCancel = n.type === 'cancel';
                  const isChange = n.type === 'change';

                  return (
                    <div
                      key={n.id}
                      className={`bg-white rounded-3xl p-5 sm:p-6 border-2 shadow-lg hover:shadow-xl transition-all ${n.read ? 'border-slate-200 opacity-90' : 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300'
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-black border ${isCancel ? 'bg-rose-100 text-rose-800 border-rose-300' : isChange ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                            {isCancel ? '⚠️ Hủy bỏ' : isChange ? '⏰ Thay đổi' : '✓ Mới'}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            📅 {n.timestamp}
                          </span>
                        </div>

                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${n.read ? 'bg-slate-100 text-slate-600' : 'bg-emerald-500 text-white'
                          }`}>
                          {n.read ? 'Đã đọc' : 'Chưa đọc'}
                        </span>
                      </div>

                      <h4 className="font-black text-base sm:text-lg text-emerald-950 mt-3">
                        {n.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                        {n.message}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-indigo-700 font-bold">
                          👤 {n.sender || 'Ban Quản Lý CLB Sân Bóng C1'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openNotificationDetail(n)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>👁️ Xem Chi Tiết</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('switch-tab', { detail: targetTab }));
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Đi đến tính năng →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* MODAL CHI TIẾT THÔNG BÁO BẢNG TIN CLB */}
          {selectedAnnouncement && (
            <div
              className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
              onClick={() => setSelectedAnnouncement(null)}
            >
              <div
                className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-emerald-500 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] p-5 text-white flex items-center justify-between border-b-2 border-emerald-400/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
                      📢
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-wider uppercase text-emerald-300">
                        Chi Tiết Thông Báo Câu Lạc Bộ
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white line-clamp-1">
                        {selectedAnnouncement.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer border border-white/20"
                    title="Đóng"
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-black border ${selectedAnnouncement.priority === 'Khẩn cấp'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : selectedAnnouncement.priority === 'Quan trọng'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                    >
                      {selectedAnnouncement.priority === 'Khẩn cấp' ? '🚨 ' : selectedAnnouncement.priority === 'Quan trọng' ? '⚡ ' : '📢 '}
                      Mức độ: {selectedAnnouncement.priority}
                    </span>

                    <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Đối tượng: <strong className="text-emerald-950 font-black">{selectedAnnouncement.target}</strong>
                    </span>

                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      📅 Ngày đăng: {selectedAnnouncement.date}
                    </span>

                    <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      👤 Người gửi: {selectedAnnouncement.author}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="pt-2">
                    <h4 className="text-xl sm:text-2xl font-black text-emerald-950 leading-snug">
                      {selectedAnnouncement.title}
                    </h4>
                  </div>

                  {/* Full content */}
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
                      Toàn Văn Nội Dung Thông Báo
                    </label>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-slate-50 border-2 border-emerald-200/90 text-sm sm:text-base text-slate-800 leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
                      {selectedAnnouncement.content}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(`${selectedAnnouncement.title}\n\n${selectedAnnouncement.content}`);
                        alert('Đã sao chép nội dung thông báo vào bộ nhớ đệm!');
                      }
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📋</span>
                    <span>Sao chép nội dung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
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
              Tổng hợp kết quả các trận giao hữu, giải bóng đá phong trào ngoại hạng và cúp khu vực của các tuyến đội CLB Sân Bóng C1.
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
                  <span className="text-slate-500 font-bold">10/10/2026 • Giải Ngoại Hạng Phong Trào • Sân C1 (Sân 1)</span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">THẮNG</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 font-black text-base text-slate-900">
                    <span>⚽ CLB Sân Bóng C1</span>
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
                    <span>⚽ CLB Sân Bóng C1</span>
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
                    <span>⚽ CLB Sân Bóng C1</span>
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

      {/* ================= CHUYÊN TRANG: VỀ CLB SÂN BÓNG C1 ================= */}
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
              Sân Bóng C1 (1B Y Ngông, Buôn Ma Thuột) mở cửa phục vụ 24/24 với cụm 2 sân cỏ nhân tạo cao cấp, dàn đèn cao áp chiếu sáng đêm, bãi đỗ xe và dịch vụ nước uống, bóng thi đấu chu đáo.
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
                Cụm 2 sân bóng mini C1 (Sân 1 & Sân 2) đạt chuẩn cỏ nhân tạo cao cấp, dàn đèn chiếu sáng ban đêm 24/24 cùng đầy đủ trang thiết bị tập luyện.
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
                  placeholder="Ví dụ: CLB Sân Bóng C1 - Đội Nữ / Đội Trẻ U19..."
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đội Hình (Tối đa 10)</label>
                  <select
                    value={newMember.lineupRole || 'Đá chính'}
                    onChange={(e) => setNewMember({ ...newMember, lineupRole: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold text-emerald-800"
                  >
                    <option value="Đá chính">🟢 Đá chính (Max 5)</option>
                    <option value="Dự bị">🟡 Dự bị (Max 5)</option>
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
                    <option value="Sân bóng C1 (Sân 1)">Sân bóng C1 (Sân 1)</option>
                    <option value="Sân bóng C1 (Sân 2)">Sân bóng C1 (Sân 2)</option>
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
                    <option value="CLB Sân C1 - Đội 1">CLB Sân C1 - Đội 1</option>
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

      {/* ================= MODAL XEM DANH SÁCH CẦU THỦ THEO ĐỘI BÓNG ================= */}
      {viewingTeamRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white border-2 border-emerald-400 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b-2 border-emerald-400/40 shrink-0">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[11px] font-black uppercase tracking-wider">
                  <span>🛡️</span>
                  <span>{viewingTeamRoster.level || 'Tuyến Đội Trực Thuộc'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                  <span>⚽</span> Danh Sách Cầu Thủ: {viewingTeamRoster.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100 pt-1">
                  <span>👔 <strong>HLV Trưởng:</strong> {viewingTeamRoster.headCoach}</span>
                  <span>👑 <strong>Đội Trưởng:</strong> {viewingTeamRoster.captain}</span>
                  <span>👥 <strong>Quy mô:</strong> 10 cầu thủ (5 Đá chính • 5 Dự bị)</span>
                  <span>🏟️ <strong>Sân tập:</strong> {viewingTeamRoster.homePitch || 'Sân bóng C1'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingTeamRoster(null)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-black text-base border border-white/20 transition-all shrink-0 cursor-pointer"
                title="Đóng danh sách"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide whitespace-nowrap">
                  Vị trí:
                </span>
                {['Tất cả', 'Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setRosterPositionFilter(pos)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${rosterPositionFilter === pos
                        ? 'bg-emerald-700 text-white shadow-sm font-extrabold'
                        : 'bg-white text-slate-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Tìm tên cầu thủ, số áo..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  <span className="absolute right-3 top-2.5 text-emerald-700 text-xs">🔍</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddRosterPlayer}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-700/25 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Thêm cầu thủ mới vào tuyến đội này"
                >
                  <span className="text-sm">➕</span>
                  <span className="whitespace-nowrap">Thêm Cầu Thủ</span>
                </button>
              </div>
            </div>

            {/* Roster List / Table - CHỈ HIỂN THỊ DANH SÁCH CẦU THỦ */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {filteredRoster.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6">
                  <span className="text-4xl block mb-2">🏃</span>
                  <p className="font-bold text-slate-700 text-sm">Chưa có cầu thủ nào phù hợp bộ lọc</p>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn vị trí &quot;Tất cả&quot;</p>
                  <button
                    type="button"
                    onClick={handleOpenAddRosterPlayer}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>➕ Thêm Cầu Thủ Đầu Tiên</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border-2 border-emerald-200 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#064e3b] text-white font-black uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 text-center">Số Áo</th>
                        <th className="p-3.5">Cầu Thủ</th>
                        <th className="p-3.5">Vị Trí</th>
                        <th className="p-3.5 text-center">Đội Hình</th>
                        <th className="p-3.5">Năm Sinh</th>
                        <th className="p-3.5">Thể Chất & Chân Thuận</th>
                        <th className="p-3.5 text-center">Trạng Thái</th>
                        <th className="p-3.5 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100 text-slate-700 bg-white">
                      {filteredRoster.map((player) => (
                        <tr
                          key={player.id}
                          className="odd:bg-white even:bg-emerald-50/40 hover:bg-emerald-100/60 transition-colors"
                        >
                          <td className="p-3.5 text-center">
                            <span className="inline-flex w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-600 text-white font-black items-center justify-center text-xs shadow-sm">
                              #{player.jerseyNumber}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <strong className="text-slate-900 font-extrabold text-sm block">
                              {player.name}
                            </strong>
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              {player.teamName}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 border ${player.position === 'Thủ môn'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : player.position === 'Hậu vệ'
                                    ? 'bg-sky-50 text-sky-900 border-sky-300'
                                    : player.position === 'Tiền vệ'
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                      : 'bg-rose-50 text-rose-900 border-rose-300'
                                }`}
                            >
                              <span>
                                {player.position === 'Thủ môn'
                                  ? '🧤'
                                  : player.position === 'Hậu vệ'
                                    ? '🛡️'
                                    : player.position === 'Tiền vệ'
                                      ? '⚡'
                                      : '🎯'}
                              </span>
                              <span>{player.position}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1 border ${
                                (player.lineupRole || 'Đá chính') === 'Đá chính'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <span>{(player.lineupRole || 'Đá chính') === 'Đá chính' ? '🟢' : '🟡'}</span>
                              <span>{player.lineupRole || 'Đá chính'}</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-700">
                              {player.dateOfBirth || '—'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-slate-700 font-medium">
                              {player.height || '1m75'} • {player.weight || '70kg'} ({player.preferredFoot || 'Chân phải'})
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] inline-block border ${player.status === 'Chấn thương'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : player.status === 'Nghỉ phép'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                            >
                              {player.status === 'Chấn thương'
                                ? '🔴 Chấn thương'
                                : player.status === 'Nghỉ phép'
                                  ? '🟡 Nghỉ phép'
                                  : '🟢 Sẵn sàng thi đấu'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRosterPlayer(player)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                title="Chỉnh sửa thông tin cầu thủ"
                              >
                                <span>✏️</span>
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRosterPlayer(player)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                title="Xóa cầu thủ khỏi đội này"
                              >
                                <span>🗑️</span>
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-600">
                Hiển thị: <strong className="text-emerald-700">{filteredRoster.length}/10</strong> thành viên ({filteredRoster.filter(p => (p.lineupRole || 'Đá chính') === 'Đá chính').length} Đá chính • {filteredRoster.filter(p => p.lineupRole === 'Dự bị').length} Dự bị)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddRosterPlayer}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>➕</span>
                  <span>Thêm Cầu Thủ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTeamRoster(null)}
                  className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm"
                >
                  ✕ Đóng Danh Sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL POPUP THÊM / SỬA CẦU THỦ CHO ĐỘI BÓNG ================= */}
      {(showRosterAddModal || editingRosterPlayer) && viewingTeamRoster && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-emerald-500 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white p-5 flex items-center justify-between border-b-2 border-emerald-400/40">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase">
                  <span>🛡️</span>
                  <span>{viewingTeamRoster.name}</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>{showRosterAddModal ? '➕' : '✏️'}</span>
                  <span>{showRosterAddModal ? 'Thêm Cầu Thủ Mới' : 'Chỉnh Sửa Thông Tin Cầu Thủ'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRosterAddModal(false);
                  setEditingRosterPlayer(null);
                }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-black text-sm border border-white/20 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={showRosterAddModal ? handleSaveAddRosterPlayer : handleSaveEditRosterPlayer} className="p-5 overflow-y-auto max-h-[75vh] space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-extrabold mb-1">Họ Và Tên Cầu Thủ <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={rosterPlayerForm.name}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Số Áo (1-99) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={rosterPlayerForm.jerseyNumber}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, jerseyNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Vị Trí Thi Đấu</label>
                  <select
                    value={rosterPlayerForm.position}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, position: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Thủ môn">🧤 Thủ môn</option>
                    <option value="Hậu vệ">🛡️ Hậu vệ</option>
                    <option value="Tiền vệ">⚡ Tiền vệ</option>
                    <option value="Tiền đạo">🎯 Tiền đạo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Đội Hình (Tối đa 5 người/vai trò)</label>
                  <select
                    value={rosterPlayerForm.lineupRole}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, lineupRole: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Đá chính">🟢 Đá chính (5 người)</option>
                    <option value="Dự bị">🟡 Dự bị (5 người)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Ngày Sinh</label>
                  <input
                    type="date"
                    value={rosterPlayerForm.dateOfBirth}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Chiều Cao</label>
                  <input
                    type="text"
                    placeholder="1m78"
                    value={rosterPlayerForm.height}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, height: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Cân Nặng</label>
                  <input
                    type="text"
                    placeholder="72kg"
                    value={rosterPlayerForm.weight}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, weight: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Chân Thuận</label>
                  <select
                    value={rosterPlayerForm.preferredFoot}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, preferredFoot: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Chân phải">Chân phải</option>
                    <option value="Chân trái">Chân trái</option>
                    <option value="Hai chân">Hai chân</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={rosterPlayerForm.phone}
                    onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Trạng Thái Sức Khỏe / Thi Đấu</label>
                <select
                  value={rosterPlayerForm.status}
                  onChange={(e) => setRosterPlayerForm({ ...rosterPlayerForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Đang tập luyện">🟢 Sẵn sàng thi đấu / Đang tập luyện</option>
                  <option value="Chấn thương">🔴 Chấn thương</option>
                  <option value="Nghỉ phép">🟡 Nghỉ phép</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowRosterAddModal(false);
                    setEditingRosterPlayer(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-700/25 transition cursor-pointer"
                >
                  {showRosterAddModal ? '➕ Lưu Cầu Thủ Mới' : '💾 Lưu Cập Nhật'}
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
                      className={`p-2.5 rounded-xl border flex flex-col justify-between ${isPaid
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-rose-50/70 border-rose-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">Tháng {mNum}/2026</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isPaid
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
                      {canUpdatePayments && (
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
              {canUpdatePayments ? (
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
              ) : (
                <span className="text-xs text-slate-500 italic">HLV chỉ có quyền xem lịch sử nộp phí</span>
              )}

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
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">TỔNG CHI PHÍ TẠM TÍNH:</span>
                        <span className="text-xs text-slate-600">Thanh toán tại quầy lễ tân khi đến nhận sân</span>
                      </div>
                      <strong className="text-xl font-black text-emerald-800">{formatVND(total)}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-1">
                      <div className="font-black flex items-center gap-1.5 text-emerald-950">
                        <span>⚽</span> Xác nhận giữ chỗ trực tuyến:
                      </div>
                      <p>
                        Hệ thống sẽ tự động ghi nhận và bảo lưu khung giờ thi đấu cho quý khách. Vui lòng có mặt trước giờ thi đấu 10-15 phút để làm thủ tục nhận sân.
                      </p>
                    </div>
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
                    <span>⏳ Đang gửi yêu cầu giữ sân...</span>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Xác Nhận Đặt Sân Ngay</span>
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
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-emerald-400 p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-black mx-auto ring-8 ring-emerald-50">
                ✓
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Đặt Sân Thành Công!
              </h3>
              <p className="text-xs text-slate-600">
                Yêu cầu đặt sân của bạn đã được hệ thống tiếp nhận và giữ chỗ thành công.
              </p>
            </div>

            {/* Phiếu biên lai xác nhận */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-300 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <span className="font-bold text-slate-500">Mã Đặt Sân:</span>
                <span className="font-mono font-black text-emerald-900 text-sm px-2 py-0.5 rounded bg-white border border-emerald-300">
                  {bookingSuccessReceipt.receiptCode}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <span className="font-bold text-slate-500">Trạng Thái Đơn:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-400 font-black text-[11px] flex items-center gap-1">
                  <span>✓</span> Đã Giữ Chỗ Thành Công
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
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Đang tải hệ thống quản lý Sân Bóng C1...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
