'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Khai báo state theo đúng đặc tả: txtID và txtPass
  const [txtID, setTxtID] = useState('');
  const [txtPass, setTxtPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Ref để tự động đặt con trỏ ở txtID khi load form
  const txtIDRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Loadform: Con trỏ đặt ở txtID
    if (txtIDRef.current) {
      txtIDRef.current.focus();
    }
  }, []);

  // Hàm kiểm tra hợp lệ: Min length=6, max length=15, không chứa ký tự đặc biệt
  const isValidFormat = (value: string) => {
    const regex = /^[a-zA-Z0-9]{6,15}$/;
    return regex.test(value);
  };

  // Xử lý sự kiện nút btnDangnhap
  const handleDangNhap = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Kiểm tra tính hợp lệ của Tài khoản và Mật khẩu
    // Nếu không đúng định dạng (min 6, max 15, có ký tự đặc biệt) -> Báo lỗi: "Tài khoản hoặc mật khẩu không đúng!!!"
    if (!isValidFormat(txtID) || !isValidFormat(txtPass)) {
      setErrorMessage('Tài khoản hoặc mật khẩu không đúng!!!');
      txtIDRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await api.login(txtID, txtPass);
      if (res.success) {
        setSuccessMessage('Đăng nhập thành công! Đang chuyển đến trang chủ...');
        login(res.user, res.token);
        setTimeout(() => {
          // Đúng thì chuyển đến frmMain (Trang chủ)
          router.push('/');
        }, 600);
      } else {
        // Kiểm tra trường hợp tài khoản đã bị khóa
        if (res.message?.includes('khóa') || res.message?.includes('khoá')) {
          setErrorMessage('Tài khoản đã bị khóa!!!');
        } else {
          setErrorMessage('Tài khoản hoặc mật khẩu không đúng!!!');
        }
        txtIDRef.current?.focus();
      }
    } catch (err: any) {
      // Trường hợp phản hồi lỗi từ server
      const msg = err.message || '';
      if (msg.includes('khóa') || msg.includes('khoá')) {
        setErrorMessage('Tài khoản đã bị khóa!!!');
      } else {
        setErrorMessage('Tài khoản hoặc mật khẩu không đúng!!!');
      }
      txtIDRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Xử lý sự kiện nút btnThoat: Thoát khỏi ứng dụng / quay về trang chủ
  const handleThoat = () => {
    if (confirm('Bạn có chắc chắn muốn thoát khỏi form đăng nhập?')) {
      router.push('/');
    }
  };

  // Nút hỗ trợ test nhanh các ca kiểm thử theo đặc tả
  const fillTestCase = (id: string, pass: string) => {
    setTxtID(id);
    setTxtPass(pass);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      {/* Khung Form frmLogin */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        {/* Header Form */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25">
            ⚽
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Đăng nhập</h1>
          <p className="text-xs text-slate-400">
            Hệ thống Quản lý Câu lạc bộ & Lịch tập bóng đá (frmLogin)
          </p>
        </div>

        {/* Thông báo lỗi theo đúng yêu cầu đặc tả */}
        {errorMessage && (
          <div
            id="lblThongBaoLoi"
            className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm font-bold flex items-center gap-2 animate-shake"
          >
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {successMessage && (
          <div
            id="lblThongBaoThanhCong"
            className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center gap-2"
          >
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Đăng nhập theo đúng mô tả: frmLogin */}
        <form id="frmLogin" name="frmLogin" onSubmit={handleDangNhap} className="space-y-4">
          {/* Textbox Tài khoản: txtID */}
          <div>
            <label htmlFor="txtID" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tài khoản (txtID) *
            </label>
            <input
              ref={txtIDRef}
              id="txtID"
              name="txtID"
              type="text"
              autoFocus
              required
              minLength={6}
              maxLength={15}
              placeholder="Từ 6 đến 15 ký tự (chữ, số)"
              value={txtID}
              onChange={(e) => setTxtID(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">Độ dài 6-15 ký tự, không chứa ký tự đặc biệt.</p>
          </div>

          {/* Textbox Mật khẩu: txtPass */}
          <div>
            <label htmlFor="txtPass" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mật khẩu (txtPass) *
            </label>
            <input
              id="txtPass"
              name="txtPass"
              type="password"
              required
              minLength={6}
              maxLength={15}
              placeholder="Từ 6 đến 15 ký tự (chữ, số)"
              value={txtPass}
              onChange={(e) => setTxtPass(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">Độ dài 6-15 ký tự, không chứa ký tự đặc biệt.</p>
          </div>

          {/* Nhóm nút bấm: btnDangnhap & btnThoat */}
          <div className="pt-2 flex gap-3">
            <button
              id="btnDangnhap"
              name="btnDangnhap"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            <button
              id="btnThoat"
              name="btnThoat"
              type="button"
              onClick={handleThoat}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-all"
            >
              Thoát
            </button>
          </div>
        </form>

        {/* Bảng test mẫu theo đúng các ca yêu cầu trong đề bài */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            🧪 Bấm thử các ca kiểm thử theo đề bài:
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillTestCase('admin123', '123456')}
              className="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-left transition-colors flex items-center justify-between"
            >
              <span>1. Hợp lệ & Đúng (admin123 / 123456)</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Vào frmMain</span>
            </button>

            <button
              type="button"
              onClick={() => fillTestCase('userlocked', '123456')}
              className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 text-left transition-colors flex items-center justify-between"
            >
              <span>2. Tài khoản đã bị khóa (userlocked / 123456)</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">Tài khoản đã bị khóa!!!</span>
            </button>

            <button
              type="button"
              onClick={() => fillTestCase('admin123', 'saiMatKhau99')}
              className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-left transition-colors flex items-center justify-between"
            >
              <span>3. Mật khẩu không đúng (admin123 / saiMatKhau99)</span>
              <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded">Tài khoản hoặc mk không đúng!!!</span>
            </button>

            <button
              type="button"
              onClick={() => fillTestCase('abc@#$', '123')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-400 text-left transition-colors flex items-center justify-between"
            >
              <span>4. Chứa ký tự đặc biệt hoặc quá ngắn (abc@#$ / 123)</span>
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">Tài khoản hoặc mk không đúng!!!</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
}
