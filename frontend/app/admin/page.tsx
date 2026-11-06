'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PRESET_TEST_ACCOUNTS } from '@/lib/auth-constants';

function AdminPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const [txtID, setTxtID] = useState('');
  const [txtPass, setTxtPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Nếu đã đăng nhập, chuyển tới trang quản lý dashboard
  useEffect(() => {
    if (user) {
      const targetTab = searchParams.get('tab') || 'teams';
      router.push(`/?tab=${targetTab}`);
    }
  }, [user, router, searchParams]);

  const handleQuickLogin = (username: string, pass: string) => {
    setTxtID(username);
    setTxtPass(pass);
    const target = PRESET_TEST_ACCOUNTS.find((a) => a.username === username);
    if (target) {
      setLoading(true);
      setTimeout(() => {
        login(
          {
            id: 'u-' + target.username,
            name: target.name,
            email: target.username + '@saovangfc.vn',
            role: target.role,
          },
          'token-' + target.role
        );
        router.push('/?tab=teams');
      }, 300);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txtID || !txtPass) {
      setErrorMsg('Vui lòng nhập tài khoản và mật khẩu!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Kiểm tra tài khoản trong danh sách
    const matched = PRESET_TEST_ACCOUNTS.find(
      (a) => a.username.toLowerCase() === txtID.trim().toLowerCase() && a.password === txtPass
    );

    let role: any = 'player';
    let name = txtID;

    if (matched) {
      role = matched.role;
      name = matched.name;
    } else {
      const lower = txtID.toLowerCase();
      if (lower.includes('admin')) {
        role = 'admin';
        name = 'Ban Quản Trị (Admin)';
      } else if (lower.includes('coach') || lower.includes('hlv')) {
        role = 'coach';
        name = 'HLV. Nguyễn Văn Huấn';
      } else if (lower.includes('staff') || lower.includes('manager')) {
        role = 'manager';
        name = 'Nhân Viên Quản Lý Ca';
      } else {
        role = 'player';
        name = txtID.charAt(0).toUpperCase() + txtID.slice(1);
      }
    }

    login(
      {
        id: 'u-' + Date.now(),
        name,
        email: txtID + '@saovangfc.vn',
        role,
      },
      'token-' + role
    );
    router.push('/?tab=teams');
  };

  return (
    <div className="min-h-[calc(100vh-160px)] py-10 px-4 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER BANNER DÀNH RIÊNG CHO TRANG ADMIN */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white p-7 sm:p-10 border-2 border-emerald-400 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider">
              <span>🔒</span>
              <span>CỔNG QUẢN TRỊ NỘI BỘ (ADMIN & TEAM PORTAL)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Hệ Thống Quản Trị Sân Bóng C1
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Khu vực bảo mật dành riêng cho <strong>Cầu thủ</strong>, <strong>Huấn luyện viên</strong> và <strong>Ban Quản Trị (Admin)</strong> thực hiện điều hành đội bóng, lịch tập huấn, điểm danh và quỹ sinh hoạt.
            </p>
          </div>

          {/* CỤM NÚT NỘI BỘ: [DÀNH CHO CẦU THỦ, HLV & ADMIN:] [ĐĂNG NHẬP] [ĐĂNG KÝ] */}
          <div className="shrink-0 flex flex-col gap-2.5 p-4 rounded-2xl bg-black/25 border border-emerald-400/40">
            <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
              <span>🔒</span>
              <span>Dành cho Cầu thủ, HLV & Admin:</span>
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-600 border border-emerald-400/80 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔑</span>
                <span>Đăng Nhập</span>
              </Link>
              <Link
                href="/register"
                className="flex-1 px-4 py-2 rounded-xl text-xs font-extrabold text-emerald-950 bg-white hover:bg-emerald-50 border border-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📝</span>
                <span>Đăng Ký</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHỐI ĐĂNG NHẬP NHANH VÀO HỆ THỐNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Card Đăng nhập trực tiếp */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
              🔑
            </span>
            <div>
              <h2 className="font-black text-base text-slate-900">Xác Thực Danh Tính Nội Bộ</h2>
              <p className="text-xs text-slate-500">Đăng nhập tài khoản được cấp bởi CLB</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1">
                Tài khoản đăng nhập:
              </label>
              <input
                type="text"
                value={txtID}
                onChange={(e) => setTxtID(e.target.value)}
                placeholder="Ví dụ: admin, coach01, quanghai19..."
                className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white bg-slate-50 text-slate-900 text-sm font-semibold outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1">
                Mật khẩu:
              </label>
              <input
                type="password"
                value={txtPass}
                onChange={(e) => setTxtPass(e.target.value)}
                placeholder="Nhập mật khẩu (Mặc định: 123456)"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white bg-slate-50 text-slate-900 text-sm font-semibold outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] hover:from-[#064e3b] hover:to-[#059669] border border-emerald-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Đang truy cập...' : 'TRUY CẬP KHU VỰC QUẢN TRỊ'}</span>
              <span>→</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/register" className="text-emerald-700 hover:underline font-bold">
              📝 Đăng ký tài khoản mới
            </Link>
            <Link href="/" className="text-slate-500 hover:text-emerald-700 hover:underline font-semibold">
              ← Về Trang Chủ Khách Hàng
            </Link>
          </div>
        </div>

        {/* Card 1-Click Test cho 4 đối tượng */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
            <span className="text-lg">⚡</span>
            <h3 className="font-black text-sm text-emerald-950 uppercase tracking-wide">
              Đăng Nhập Nhanh 1-Chạm (4 Vai Trò)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhấp trực tiếp vào bất kỳ vai trò nào bên dưới để hệ thống tự động điền thông tin và đăng nhập ngay:
          </p>

          <div className="space-y-3">
            {/* 1. ADMIN (Chủ Sân) */}
            <button
              onClick={() => handleQuickLogin('admin', '123456')}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-rose-400 text-left transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-slate-900 group-hover:text-rose-700 flex items-center gap-2">
                  <span>👑</span> ADMIN (Chủ sân)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold">
                  Toàn Quyền
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tài khoản: <code>admin</code> • MK: <code>123456</code> (Doanh thu, tạo sân, quản lý nhân viên & KPI)
              </p>
            </button>

            {/* 2. NHÂN VIÊN (Quản lý ca / CLB) */}
            <button
              onClick={() => handleQuickLogin('manager', '123456')}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-400 text-left transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-slate-900 group-hover:text-amber-800 flex items-center gap-2">
                  <span>📋</span> NHÂN VIÊN (Quản lý ca / Quản lý CLB)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                  Nhân Viên Ca
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tài khoản: <code>manager</code> hoặc <code>staff</code> • MK: <code>123456</code> (Duyệt/hủy đặt sân, xếp lịch đá tập, thanh toán & thiết bị)
              </p>
            </button>

            {/* 3. HUẤN LUYỆN VIÊN (Ban Huấn Luyện) */}
            <button
              onClick={() => handleQuickLogin('coach', '123456')}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-sky-50 border-2 border-sky-300 hover:border-sky-500 text-left transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-slate-900 group-hover:text-sky-800 flex items-center gap-2">
                  <span>🧢</span> HUẤN LUYỆN VIÊN (Ban Huấn Luyện)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-extrabold">
                  HLV Đội Bóng
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tài khoản: <code>coach</code> • MK: <code>123456</code> (Lịch tập: tạo/sửa/hủy lịch đội mình • Điểm danh: đánh dấu có mặt thành viên)
              </p>
            </button>

            {/* 4. USER (Khách Hàng / Cầu Thủ) */}
            <button
              onClick={() => handleQuickLogin('user01', '123456')}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 text-left transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-slate-900 group-hover:text-emerald-800 flex items-center gap-2">
                  <span>⚽</span> USER (Khách hàng / Cầu thủ)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                  Khách Hàng
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tài khoản: <code>user01</code> • MK: <code>123456</code> (Xem lịch trống, đặt sân, lịch sử cá nhân)
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Đang tải cổng quản trị nội bộ Sân Bóng C1...</div>}>
      <AdminPortalContent />
    </Suspense>
  );
}
