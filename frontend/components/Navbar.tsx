'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'teams';
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // 7 core modules chính thức đưa lên trên cùng web
  const navItems = [
    { href: '/?tab=teams', tab: 'teams', label: 'Quản Lý Đội', icon: '🛡️' },
    { href: '/?tab=members', tab: 'members', label: 'Quản Lý Thành Viên', icon: '🏃' },
    { href: '/?tab=coaches', tab: 'coaches', label: 'Huấn Luyện Viên', icon: '📋' },
    { href: '/?tab=schedules', tab: 'schedules', label: 'Quản Lý Lịch Tập', icon: '📅' },
    { href: '/?tab=attendance', tab: 'attendance', label: 'Quản Lý Điểm Danh', icon: '✅' },
    { href: '/?tab=finances', tab: 'finances', label: 'Phí Sinh Hoạt & Quỹ', icon: '💰' },
    { href: '/?tab=announcements', tab: 'announcements', label: 'Quản Lý Thông Báo', icon: '📢' },
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-400/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            Admin
          </span>
        );
      case 'coach':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-bold border border-amber-400/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            HLV
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-400/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            Thành Viên
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] border-b-2 border-emerald-500/50 text-white shadow-xl transition-all">
      <div className="w-full max-w-[1780px] mx-auto px-3 sm:px-5 h-18 flex items-center justify-between gap-2.5">
        {/* LOGO & BRAND */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white p-0.5 shadow-md shadow-emerald-900/40 group-hover:scale-105 transition-all flex items-center justify-center text-emerald-800 font-extrabold text-xl">
            ⚽
          </div>
          <div>
            <div className="font-extrabold text-base tracking-wide text-white flex items-center gap-2">
              <span>SAO VÀNG FC</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 font-extrabold border border-emerald-400/40">
                CLB
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-200 hidden 2xl:block">
              Hệ thống Điều hành Đội bóng & Sinh hoạt
            </p>
          </div>
        </Link>

        {/* 7 NAV ITEMS - THANH ĐIỀU HƯỚNG TRÊN CÙNG WEB (CHUYỂN TAB TRỰC TIẾP) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#022c22]/85 p-1 rounded-2xl border border-emerald-500/40 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === '/' && currentTab === item.tab;
            return (
              <Link
                key={item.tab}
                href={item.href}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-emerald-950 font-extrabold shadow-md shadow-emerald-950/30 scale-[1.02]'
                    : 'text-emerald-100 hover:text-white hover:bg-emerald-700/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT CONTROLS: NOTIFICATIONS + USER BADGE + LOGOUT */}
        <div className="flex items-center gap-2 shrink-0">

          {/* NOTIFICATION BUTTON */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative w-10 h-10 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-500/40 flex items-center justify-center text-base text-white transition-all shadow-sm"
              title="Thông báo câu lạc bộ"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROPDOWN */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border-2 border-emerald-600 shadow-2xl p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-950">Thông Báo CLB</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {notifications.length} tin
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-emerald-700 hover:underline font-bold"
                    >
                      Đã đọc hết
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 mt-3 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">Không có thông báo mới nào</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          n.read
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : 'bg-emerald-50 border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-xs text-emerald-950">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="pt-3 mt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={clearAll}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      Xóa tất cả thông báo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AUTH CONTROLS: ĐĂNG NHẬP / ĐĂNG KÝ (KHI CHƯA ĐĂNG NHẬP) HOẶC USER PROFILE MENU (KHI ĐÃ ĐĂNG NHẬP) */}
          {user ? (
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-[#022c22]/90 border border-emerald-500/50 p-1.5 rounded-2xl shadow-md">
                {/* User info trigger */}
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-emerald-800/60 transition-all text-left"
                  title="Nhấn để xem thông tin tài khoản và tùy chọn đăng nhập/đăng ký"
                >
                  <div className="w-8 h-8 rounded-xl bg-white text-emerald-800 font-extrabold flex items-center justify-center text-sm shadow-sm ring-2 ring-emerald-400/40">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white line-clamp-1 max-w-[120px] sm:max-w-[160px]">
                      {user?.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getRoleBadge(user?.role)}
                      <span className="text-[10px] text-emerald-300">▼</span>
                    </div>
                  </div>
                </button>

                {/* Direct Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-600 border border-rose-400/30 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <span className="hidden sm:inline">Đăng xuất</span>
                  <span>🚪</span>
                </button>
              </div>

              {/* USER & AUTH DROPDOWN MENU */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border-2 border-emerald-600 shadow-2xl p-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-3 mb-2 border-b border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Đang đăng nhập với</p>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email || 'user@saovangfc.vn'}</p>
                    <div className="mt-2">{getRoleBadge(user.role)}</div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <Link
                      href="/login"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-950 font-bold hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
                    >
                      <span>🔑</span>
                      <span>Đăng nhập tài khoản khác</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-950 font-bold hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
                    >
                      <span>📝</span>
                      <span>Đăng ký tài khoản mới</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 font-bold hover:bg-rose-50 transition-all text-left border border-transparent hover:border-rose-200"
                    >
                      <span>🚪</span>
                      <span>Đăng xuất (Trở về chế độ Khách)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-800/90 hover:bg-emerald-700 border border-emerald-500/50 shadow-sm transition-all flex items-center gap-1.5"
                title="Đăng nhập tài khoản"
              >
                <span>🔑</span>
                <span>Đăng Nhập</span>
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-emerald-950 bg-white hover:bg-emerald-50 border border-white shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5"
                title="Đăng ký tài khoản mới"
              >
                <span>📝</span>
                <span>Đăng Ký</span>
              </Link>
            </div>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-white"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="lg:hidden border-t-2 border-emerald-500/50 bg-[#064e3b] p-4 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navItems.map((item) => {
              const isActive = pathname === '/' && currentTab === item.tab;
              return (
                <Link
                  key={item.tab}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    isActive
                      ? 'bg-white text-emerald-950 font-black border-white shadow-md'
                      : 'bg-emerald-800/60 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile User Info & Auth Links */}
          <div className="pt-2 border-t border-emerald-600 flex items-center justify-between text-xs">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-white">
                  <span className="font-bold">{user?.name}</span>
                  <span>{getRoleBadge(user?.role)}</span>
                </div>
                <button
                  onClick={() => { logout(); setShowMobileMenu(false); }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <span>Đăng xuất</span>
                  <span>🚪</span>
                </button>
              </>
            ) : (
              <div className="w-full flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex-1 text-center py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs border border-emerald-500 shadow-sm"
                >
                  🔑 Đăng Nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex-1 text-center py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-bold rounded-xl text-xs shadow-md"
                >
                  📝 Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="sticky top-0 z-50 bg-[#064e3b] h-18 text-white shadow-xl" />}>
      <NavbarContent />
    </Suspense>
  );
}
