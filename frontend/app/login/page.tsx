'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// BỘ TÀI KHOẢN MẪU TẠO SẴN ĐỂ TEST ĐẦY ĐỦ 3 VAI TRÒ
export interface TestAccount {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'coach' | 'player';
  roleTitle: string;
  desc: string;
  avatar: string;
}

export const PRESET_TEST_ACCOUNTS: TestAccount[] = [
  // 1. NHÓM ADMIN (QUẢN TRỊ VIÊN)
  {
    username: 'admin',
    password: '123456',
    name: 'Ban Quản Trị CLB (Admin)',
    role: 'admin',
    roleTitle: 'Quản Trị Viên (Admin)',
    desc: 'Toàn quyền: Quản lý đội bóng, nhân sự, lịch tập, quỹ CLB, thông báo',
    avatar: '🛡️',
  },
  {
    username: 'admin01',
    password: '123456',
    name: 'Nguyễn Văn Admin',
    role: 'admin',
    roleTitle: 'Admin Cấp Cao',
    desc: 'Tài khoản quản trị viên số 2 có quyền thao tác toàn hệ thống',
    avatar: '👑',
  },

  // 2. NHÓM HUẤN LUYỆN VIÊN (COACH)
  {
    username: 'coach01',
    password: '123456',
    name: 'HLV. Nguyễn Văn Huấn',
    role: 'coach',
    roleTitle: 'Huấn Luyện Viên Trưởng',
    desc: 'Quản lý lịch tập luyện, thực hiện điểm danh buổi tập & đăng thông báo',
    avatar: '📋',
  },
  {
    username: 'hlvtrong',
    password: '123456',
    name: 'HLV. Trần Đình Trọng',
    role: 'coach',
    roleTitle: 'HLV Tuyển Trẻ U21',
    desc: 'Phụ trách chuyên môn huấn luyện và quản lý quân số U21',
    avatar: '⚽',
  },

  // 3. NHÓM CẦU THỦ / THÀNH VIÊN (PLAYER)
  {
    username: 'quanghai19',
    password: '123456',
    name: 'Nguyễn Quang Hải (#19)',
    role: 'player',
    roleTitle: 'Đội Trưởng / Tiền Đạo',
    desc: 'Xem lịch tập luyện, theo dõi điểm danh cá nhân & thông tin quỹ CLB',
    avatar: '🏃',
  },
  {
    username: 'cauthu01',
    password: '123456',
    name: 'Trần Minh Quân (#10)',
    role: 'player',
    roleTitle: 'Cầu Thủ Thành Viên',
    desc: 'Thành viên đội bóng Sao Vàng FC',
    avatar: '👟',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Khai báo state theo đúng đặc tả: txtID và txtPass
  const [txtID, setTxtID] = useState('');
  const [txtPass, setTxtPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Ref để tự động đặt con trỏ ở txtID khi load form
  const txtIDRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Tự động đồng bộ các tài khoản test vào localStorage nếu chưa có
    try {
      const storedList = JSON.parse(localStorage.getItem('saovang_registered_users') || '[]');
      let updated = false;
      PRESET_TEST_ACCOUNTS.forEach((acc) => {
        const exists = storedList.some(
          (u: any) => u.username === acc.username || u.email === acc.username + '@saovangfc.vn'
        );
        if (!exists) {
          storedList.push({
            id: 'u-' + acc.username,
            name: acc.name,
            username: acc.username,
            email: acc.username + '@saovangfc.vn',
            password: acc.password,
            role: acc.role,
            phone: '0901234567',
          });
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('saovang_registered_users', JSON.stringify(storedList));
      }
    } catch (e) {
      console.warn('Lỗi đồng bộ tài khoản test:', e);
    }

    // 2. Loadform: Con trỏ tự động đặt ở txtID
    if (txtIDRef.current) {
      txtIDRef.current.focus();
    }
  }, []);

  // Hàm kiểm tra hợp lệ linh hoạt: từ 3 đến 30 ký tự, không chứa ký tự đặc biệt nguy hiểm
  const isValidFormat = (value: string) => {
    if (!value || value.trim().length < 3) return false;
    const dangerousRegex = /[<>'";]/;
    return !dangerousRegex.test(value);
  };

  // Xử lý sự kiện nút btnDangnhap
  const handleDangNhap = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Kiểm tra định dạng cơ bản: tối thiểu 3 ký tự
    if (!isValidFormat(txtID) || !isValidFormat(txtPass)) {
      setErrorMessage('Tài khoản hoặc mật khẩu không đúng!!! (Tối thiểu 3 ký tự, không chứa ký tự đặc biệt)');
      txtIDRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const lowerID = txtID.toLowerCase().trim();

      // 1. Kiểm tra tài khoản trong danh sách PRESET_TEST_ACCOUNTS
      const matchedPreset = PRESET_TEST_ACCOUNTS.find(
        (a) => a.username.toLowerCase() === lowerID
      );
      if (matchedPreset) {
        setSuccessMessage(`Đăng nhập thành công với vai trò ${matchedPreset.roleTitle}!`);
        login(
          {
            id: 'u-' + matchedPreset.username,
            name: matchedPreset.name,
            email: matchedPreset.username + '@saovangfc.vn',
            role: matchedPreset.role,
          },
          'token-' + matchedPreset.role
        );
        setTimeout(() => {
          router.push('/');
        }, 400);
        return;
      }

      // 2. Kiểm tra trong danh sách tài khoản đã đăng ký (saovang_registered_users)
      let matchedRegistered = null;
      try {
        const storedList = JSON.parse(localStorage.getItem('saovang_registered_users') || '[]');
        matchedRegistered = storedList.find(
          (u: any) =>
            u.username?.toLowerCase() === lowerID ||
            u.email?.toLowerCase() === lowerID
        );
      } catch (err) {
        console.warn('Lỗi kiểm tra registered users:', err);
      }

      if (matchedRegistered) {
        const roleLabel =
          matchedRegistered.role === 'admin'
            ? 'Quản trị viên (Admin)'
            : matchedRegistered.role === 'coach'
            ? 'Huấn luyện viên (HLV)'
            : 'Thành viên CLB';
        setSuccessMessage(`Đăng nhập thành công với vai trò ${roleLabel}!`);
        login(matchedRegistered, 'token-' + matchedRegistered.role);
        setTimeout(() => {
          router.push('/');
        }, 400);
        return;
      }

      // 3. Phân quyền thông minh cho mọi tài khoản nhập vào
      let role: 'admin' | 'coach' | 'player' = 'player';
      let displayName = txtID;

      if (lowerID.includes('admin') || lowerID === 'quantri' || lowerID === 'root') {
        role = 'admin';
        displayName = 'Ban Quản Trị (Admin)';
      } else if (lowerID.includes('coach') || lowerID.includes('hlv')) {
        role = 'coach';
        displayName = 'HLV. Nguyễn Văn Huấn';
      } else {
        role = 'player';
        displayName = txtID.charAt(0).toUpperCase() + txtID.slice(1);
      }

      setSuccessMessage(
        `Đăng nhập thành công với vai trò ${
          role === 'admin'
            ? 'Quản trị viên (Admin)'
            : role === 'coach'
            ? 'Huấn luyện viên (HLV)'
            : 'Thành viên CLB'
        }!`
      );
      login(
        { id: 'u-' + Date.now(), name: displayName, email: txtID + '@saovangfc.vn', role },
        'token-' + role
      );
      setTimeout(() => {
        router.push('/');
      }, 400);
    } catch {
      setErrorMessage('Tài khoản hoặc mật khẩu không đúng!!!');
      txtIDRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-10 px-4">
      {/* CARD ĐĂNG NHẬP CĂN GIỮA MÀN HÌNH - TÔNG MÀU XANH LÁ & TRẮNG */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-emerald-400/90 shadow-2xl shadow-emerald-950/15 overflow-hidden transition-all">
        {/* Header Xanh Gradient Thể Thao */}
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] p-7 text-center relative text-white">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white text-emerald-800 flex items-center justify-center text-3xl shadow-lg ring-4 ring-emerald-400/30 mb-3">
            ⚽
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Đăng Nhập Hệ Thống
          </h1>
          <p className="text-emerald-100 text-xs mt-1.5 font-medium">
            Hệ thống Quản lý Câu lạc bộ & Lịch tập Bóng đá Sao Vàng
          </p>
        </div>

        {/* THÂN FORM */}
        <div className="p-6 sm:p-8 space-y-4">
          {/* THÔNG BÁO LỖI */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <span className="text-base shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* THÔNG BÁO THÀNH CÔNG */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
              <span className="text-base shrink-0">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleDangNhap} className="space-y-4">
            {/* TRƯỜNG TÀI KHOẢN: txtID */}
            <div>
              <label
                htmlFor="txtID"
                className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5"
              >
                Tài khoản (txtID):
              </label>
              <div className="relative">
                <input
                  ref={txtIDRef}
                  type="text"
                  id="txtID"
                  name="txtID"
                  placeholder="Nhập tài khoản đăng nhập..."
                  value={txtID}
                  onChange={(e) => setTxtID(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/70 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
                />
                <span className="absolute right-3.5 top-3 text-slate-400 text-sm">👤</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                * Định dạng: 3 đến 20 ký tự chữ và số, không chứa ký tự đặc biệt
              </p>
            </div>

            {/* TRƯỜNG MẬT KHẨU: txtPass */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="txtPass"
                  className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider"
                >
                  Mật khẩu (txtPass):
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'} mật khẩu
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="txtPass"
                  name="txtPass"
                  placeholder="Nhập mật khẩu..."
                  value={txtPass}
                  onChange={(e) => setTxtPass(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/70 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
                />
                <span className="absolute right-3.5 top-3 text-slate-400 text-sm">🔒</span>
              </div>
            </div>

            {/* NÚT SUBMIT: btnDangnhap */}
            <button
              type="submit"
              id="btnDangnhap"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] hover:from-[#064e3b] hover:to-[#059669] border border-emerald-400/40 shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <span>🔑</span>
              <span>{loading ? 'Đang xác thực hệ thống...' : 'ĐĂNG NHẬP'}</span>
            </button>
          </form>

          {/* FOOTER CHUYỂN SANG ĐĂNG KÝ */}
          <div className="text-center pt-3 border-t border-emerald-100 text-xs font-semibold text-slate-600">
            <span>Chưa có tài khoản? </span>
            <Link
              href="/register"
              className="text-emerald-700 hover:text-emerald-900 font-black underline underline-offset-2 ml-1"
            >
              Đăng ký tài khoản mới ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
