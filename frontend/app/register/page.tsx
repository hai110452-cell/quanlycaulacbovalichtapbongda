'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'player',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setLoading(true);

    try {
      // Lưu tài khoản đã đăng ký vào danh sách tài khoản hệ thống
      const newUserObj = {
        id: 'u-' + Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '0901234567',
        role: formData.role as any,
      };

      try {
        const storedList = JSON.parse(localStorage.getItem('saovang_registered_users') || '[]');
        storedList.push({
          username: formData.email,
          password: formData.password,
          ...newUserObj,
        });
        localStorage.setItem('saovang_registered_users', JSON.stringify(storedList));
      } catch (err) {
        console.warn('Lỗi lưu tài khoản đăng ký:', err);
      }

      setSuccess(
        `Đăng ký thành công với quyền ${
          formData.role === 'admin'
            ? 'Quản trị viên (Admin)'
            : formData.role === 'coach'
            ? 'Huấn luyện viên (HLV)'
            : 'Thành viên CLB'
        }! Đang chuyển hướng...`
      );
      login(newUserObj, 'mock-token-' + formData.role);
      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối tới máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-10 px-4">
      {/* CARD ĐĂNG KÝ XANH LÁ & TRẮNG */}
      <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/15 overflow-hidden transition-all">
        {/* HEADER XANH GRADIENT */}
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] p-7 text-center relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white text-emerald-800 flex items-center justify-center text-3xl shadow-lg ring-4 ring-emerald-400/30 mb-3.5">
            📝
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Đăng Ký Thành Viên CLB
          </h1>
          <p className="text-emerald-100 text-xs mt-1.5 font-medium">
            Tạo tài khoản và lựa chọn quyền hạn truy cập hệ thống Sao Vàng FC
          </p>
        </div>

        {/* THÂN FORM */}
        <div className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <span className="text-base shrink-0">✓</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ và Tên */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1"
              >
                Họ và Tên:
              </label>
              <input
                type="text"
                id="name"
                placeholder="Ví dụ: Nguyễn Văn Hải"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/60 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* Tài khoản / Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1"
                >
                  Tài khoản đăng nhập:
                </label>
                <input
                  type="text"
                  id="email"
                  placeholder="Từ 6 - 15 ký tự..."
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/60 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1"
                >
                  Số điện thoại:
                </label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="0901234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/60 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Chọn vai trò */}
            <div>
              <label
                htmlFor="role"
                className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1"
              >
                Vai trò đăng ký:
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-emerald-50/50 focus:bg-white text-slate-900 text-sm font-bold outline-none transition-all"
              >
                <option value="admin">🛡️ Quản trị viên (Admin) - Toàn quyền quản trị CLB</option>
                <option value="coach">📋 Huấn luyện viên (HLV) - Quản lý lịch tập & điểm danh</option>
                <option value="player">🏃 Cầu thủ / Thành viên - Xem lịch & tham gia CLB</option>
              </select>
            </div>

            {/* Mật khẩu & Xác nhận */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1"
                >
                  Mật khẩu:
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/60 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1"
                >
                  Xác nhận mật khẩu:
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 bg-slate-50/60 focus:bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Nút Đăng ký */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] hover:from-[#064e3b] hover:to-[#059669] border border-emerald-400/40 shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3"
            >
              <span>📝</span>
              <span>{loading ? 'Đang tạo tài khoản...' : 'HOÀN TẤT ĐĂNG KÝ'}</span>
            </button>
          </form>

          {/* Footer chuyển sang Đăng nhập */}
          <div className="text-center pt-3 border-t border-emerald-100 text-xs font-semibold text-slate-600">
            <span>Đã có tài khoản? </span>
            <Link
              href="/login"
              className="text-emerald-700 hover:text-emerald-900 font-extrabold underline underline-offset-2 ml-1"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
