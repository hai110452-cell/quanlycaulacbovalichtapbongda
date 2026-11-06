'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications, getFeatureMetadata, detectNotificationTab } from '@/context/NotificationContext';

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'home';
  const { user, logout, switchRole } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    navigateToFeature,
    openNotificationDetail,
  } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  const handleNotificationClick = (n: any) => {
    openNotificationDetail(n);
    setShowNotifDropdown(false);
  };

  const handleDirectNavigate = (n: any, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(n.id);
    setShowNotifDropdown(false);
    const targetTab = n.tab || detectNotificationTab(n.title, n.message);
    navigateToFeature(targetTab, n.link);
  };

  // Phân quyền hiển thị Menu chuẩn 5 vai trò:
  // 1. ADMIN (Chủ sân): Toàn quyền hệ thống, xem báo cáo doanh thu tổng năm, tạo mới sân bóng, quản lý nhân viên cấp cao.
  // 2. MANAGER (Quản lý sân bãi & điều phối): Sân bãi & thiết bị, duyệt/dời lịch & xử lý trùng lịch, duyệt CLB & gán quyền HLV, xuất biên lai & xem doanh thu ca/ngày.
  // 3. STAFF (Nhân viên ca trực): Trực ca, bàn giao sân thực tế, kiểm đếm thiết bị phụ trợ, ghi nhận thanh toán tại quầy.
  // 4. COACH (Huấn luyện viên): Quản lý lịch tập & điểm danh đội mình, chỉ xem thanh toán & thông báo.
  // 5. USER (Khách hàng / Cầu thủ): Xem lịch trống, đặt sân, xem lịch sử và quản lý thông tin cá nhân.
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isStaff = user?.role === 'staff';
  const isCoach = user?.role === 'coach';

  const visibleNavItems = !user
    ? [
        { href: '/', tab: 'home', label: 'Trang Chủ', icon: '🏠' },
        { href: '/?tab=fields', tab: 'fields', label: 'Tìm Sân C1', icon: '🔍' },
        { href: '/?tab=booking-schedule', tab: 'booking-schedule', label: 'Lịch Đặt Sân', icon: '📅' },
        { href: '/?tab=contact', tab: 'contact', label: 'Liên Hệ 24/7', icon: '📞' },
      ]
    : isAdmin
    ? [
        { href: '/', tab: 'home', label: 'Trang Chủ', icon: '🏠' },
        { href: '/?tab=fields', tab: 'fields', label: 'Quản Lý Sân', icon: '🏟️' },
        { href: '/?tab=booking-schedule', tab: 'booking-schedule', label: 'Lịch Đặt Sân', icon: '📅' },
        { href: '/?tab=members', tab: 'members', label: 'Quản Lý Cầu Thủ', icon: '🏃' },
        { href: '/?tab=finances', tab: 'finances', label: 'Quản Lý Doanh Thu', icon: '💰' },
        { href: '/?tab=teams', tab: 'teams', label: 'Tuyến Đội', icon: '🛡️' },
        { href: '/?tab=announcements', tab: 'announcements', label: 'Thông Báo', icon: '📢' },
      ]
    : isManager
    ? [
        { href: '/', tab: 'home', label: 'Trang Chủ', icon: '🏠' },
        { href: '/?tab=fields', tab: 'fields', label: 'Sân Bãi & Thiết Bị', icon: '🏟️' },
        { href: '/?tab=booking-schedule', tab: 'booking-schedule', label: 'Lịch Đặt & Điều Phối', icon: '📅' },
        { href: '/?tab=members', tab: 'members', label: 'Quản Lý Cầu Thủ', icon: '🏃' },
        { href: '/?tab=finances', tab: 'finances', label: 'Thanh Toán & Hóa Đơn Ca', icon: '💳' },
        { href: '/?tab=announcements', tab: 'announcements', label: 'Thông Báo Điều Hành', icon: '📢' },
      ]
    : isCoach
    ? [
        { href: '/', tab: 'home', label: 'Trang Chủ', icon: '🏠' },
        { href: '/?tab=schedules', tab: 'schedules', label: 'Lịch Tập Đội Bóng', icon: '⏱️' },
        { href: '/?tab=attendance', tab: 'attendance', label: 'Điểm Danh Buổi Tập', icon: '✅' },
        { href: '/?tab=members', tab: 'members', label: 'Hồ Sơ Cầu Thủ', icon: '🏃' },
        { href: '/?tab=announcements', tab: 'announcements', label: 'Xem Thông Báo CLB', icon: '📢' },
      ]
    : isStaff
    ? [
        { href: '/', tab: 'home', label: 'Trang Chủ', icon: '🏠' },
        { href: '/?tab=fields', tab: 'fields', label: 'Kiểm Tra Sân & Kho', icon: '🏟️' },
        { href: '/?tab=booking-schedule', tab: 'booking-schedule', label: 'Lịch Nhận Sân', icon: '📅' },
        { href: '/?tab=attendance', tab: 'attendance', label: 'Hỗ Trợ Điểm Danh', icon: '✅' },
        { href: '/?tab=finances', tab: 'finances', label: 'Ghi Nhận Thu Ca', icon: '💳' },
        { href: '/?tab=announcements', tab: 'announcements', label: 'Bảng Tin Ca', icon: '📢' },
      ]
    : [
        // USER (Khách hàng / Cầu thủ)
        { href: '/', tab: 'home', label: 'Trang Chủ', icon: '🏠' },
        { href: '/?tab=fields', tab: 'fields', label: 'Xem Lịch Trống & Giá', icon: '🔍' },
        { href: '/?tab=booking-schedule', tab: 'booking-schedule', label: 'Đặt Sân Trực Tuyến', icon: '⚽' },
        { href: '/?tab=schedules', tab: 'schedules', label: 'Lịch Sử / Lịch Của Tôi', icon: '📅' },
        { href: '/?tab=attendance', tab: 'attendance', label: 'Thông Tin Cá Nhân', icon: '👤' },
        { href: '/?tab=announcements', tab: 'announcements', label: 'Thông Báo Sân C1', icon: '📢' },
      ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold border border-rose-400/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            👑 Chủ Sân
          </span>
        );
      case 'manager':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold border border-teal-400/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            👔 Quản Lý
          </span>
        );
      case 'staff':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-400/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            ⚡ Nhân Viên
          </span>
        );
      case 'coach':
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 font-extrabold border border-sky-400/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            🧢 Huấn Luyện Viên
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-extrabold border border-emerald-400/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            ⚽ Cầu Thủ
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
              <span>SÂN BÓNG C1</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 font-extrabold border border-emerald-400/40">
                CLB
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-200 hidden 2xl:block">
              Hệ thống Điều hành Đội bóng & Sinh hoạt
            </p>
          </div>
        </Link>

        {/* NAV ITEMS - PHÂN QUYỀN: CUSTOMER CHỈ THẤY TRANG CHỦ, THÀNH VIÊN NỘI BỘ MỞ KHÓA TOÀN BỘ */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#022c22]/85 p-1 rounded-2xl border border-emerald-500/40 overflow-x-auto">
          {visibleNavItems.map((item) => {
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

          {/* NOTIFICATION BUTTON - CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP / CÓ QUYỀN */}
          {user && (
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

                  <div className="max-h-80 overflow-y-auto space-y-2.5 mt-3 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="text-3xl block mb-2">🔔</span>
                        <p className="text-xs text-slate-400 font-medium">Không có thông báo mới nào</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const targetTab = n.tab || detectNotificationTab(n.title, n.message);
                        const feat = getFeatureMetadata(targetTab);

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all hover:shadow-lg hover:border-emerald-500 group ${
                              n.read
                                ? 'bg-slate-50/90 border-slate-200 opacity-85 hover:opacity-100'
                                : 'bg-emerald-50/90 border-emerald-300 shadow-sm ring-1 ring-emerald-400/20'
                            }`}
                            title="Nhấn để xem chi tiết thông báo"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-xs text-emerald-950 flex-1 truncate group-hover:text-emerald-700">
                                {n.title}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-slate-400 font-semibold">{n.timestamp}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(n.id);
                                  }}
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-bold"
                                  title="Xóa thông báo này"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border ${feat.color}`}
                              >
                                {feat.icon} {feat.name}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleNotificationClick(n)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-300 transition-all"
                                >
                                  Chi tiết 👁️
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDirectNavigate(n, e)}
                                  className="text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded-md shadow-sm transition-all flex items-center gap-0.5"
                                  title="Chuyển ngay đến tính năng này"
                                >
                                  Đi đến →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-3 mt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setShowNotifDropdown(false);
                        navigateToFeature('announcements');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline font-extrabold flex items-center gap-1"
                    >
                      <span>📢</span>
                      <span>Xem bảng tin CLB</span>
                    </button>

                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUTH CONTROLS: ĐÃ ĐĂNG NHẬP HIỂN THỊ MENU TÀI KHOẢN, CHƯA ĐĂNG NHẬP HIỂN THỊ NÚT ĐĂNG NHẬP / ĐĂNG KÝ */}
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
            <div className="relative">
              {/* Nút gộp Đăng Nhập & Đăng Ký */}
              <button
                type="button"
                onClick={() => setShowQuickLogin(!showQuickLogin)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 font-black text-xs shadow-md shadow-emerald-950/30 flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                title="Đăng nhập hoặc đăng ký tài khoản"
              >
                <span>🔑</span>
                <span>Đăng Nhập / Đăng Ký</span>
                <span className="text-[10px] text-emerald-900 ml-0.5">▼</span>
              </button>

              {/* DROPDOWN MENU GỘP ĐĂNG NHẬP / ĐĂNG KÝ */}
              {showQuickLogin && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white border-2 border-emerald-600 shadow-2xl p-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="pb-2.5 mb-2.5 border-b border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                        <span>⚽</span> Tài Khoản Sân Bóng C1
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Truy cập hệ thống đặt sân & quản lý CLB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickLogin(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-black p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 2 LỰA CHỌN CHÍNH: ĐĂNG NHẬP HOẶC ĐĂNG KÝ */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Link
                      href="/login"
                      onClick={() => setShowQuickLogin(false)}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 text-center shadow-sm transition-all"
                    >
                      <span className="text-base">🔑</span>
                      <span>Đăng Nhập</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowQuickLogin(false)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-emerald-950 hover:text-emerald-800 font-extrabold text-xs flex flex-col items-center justify-center gap-1 text-center border border-emerald-200 transition-all"
                    >
                      <span className="text-base">📝</span>
                      <span>Đăng Ký Mới</span>
                    </Link>
                  </div>

                  {/* DANH SÁCH ĐĂNG NHẬP NHANH 1-CHẠM THEO VAI TRÒ */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span>⚡</span> Hoặc chọn vai trò đăng nhập nhanh:
                    </p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          switchRole('admin');
                          setShowQuickLogin(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-black">
                            👑
                          </span>
                          <div>
                            <strong className="text-xs text-slate-900 group-hover:text-rose-700 block">Chủ Sân (Admin)</strong>
                            <span className="text-[10px] text-slate-400">Toàn quyền hệ thống Sân C1</span>
                          </div>
                        </div>
                        <span className="text-xs text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vào →</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole('manager');
                          setShowQuickLogin(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-black">
                            👔
                          </span>
                          <div>
                            <strong className="text-xs text-slate-900 group-hover:text-teal-700 block">Quản Lý (Manager)</strong>
                            <span className="text-[10px] text-slate-400">Điều phối lịch & sân bãi</span>
                          </div>
                        </div>
                        <span className="text-xs text-teal-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vào →</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole('coach');
                          setShowQuickLogin(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-black">
                            🧢
                          </span>
                          <div>
                            <strong className="text-xs text-slate-900 group-hover:text-sky-700 block">Huấn Luyện Viên (Coach)</strong>
                            <span className="text-[10px] text-slate-400">Lịch tập & điểm danh đội</span>
                          </div>
                        </div>
                        <span className="text-xs text-sky-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vào →</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole('staff');
                          setShowQuickLogin(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-black">
                            ⚡
                          </span>
                          <div>
                            <strong className="text-xs text-slate-900 group-hover:text-amber-700 block">Nhân Viên (Staff)</strong>
                            <span className="text-[10px] text-slate-400">Trực ca & bàn giao sân</span>
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vào →</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole('user');
                          setShowQuickLogin(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black">
                            ⚽
                          </span>
                          <div>
                            <strong className="text-xs text-slate-900 group-hover:text-emerald-700 block">Khách Hàng / Cầu Thủ</strong>
                            <span className="text-[10px] text-slate-400">Đặt sân trực tuyến 24/24</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vào →</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
            {visibleNavItems.map((item) => {
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

          {/* Mobile User Info & Logout hoặc Cụm Đăng Nhập */}
          {user ? (
            <div className="pt-2 border-t border-emerald-600 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white">
                <span className="font-bold">{user?.name}</span>
                <span>{getRoleBadge(user?.role)}</span>
              </div>
              <button
                onClick={() => { logout(); setShowMobileMenu(false); }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Đăng xuất</span>
                <span>🚪</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-emerald-600/70 space-y-2.5">
              <Link
                href="/login"
                onClick={() => setShowMobileMenu(false)}
                className="w-full py-2.5 text-center bg-white hover:bg-slate-100 text-emerald-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>🔑</span>
                <span>Đăng Nhập / Đăng Ký Tài Khoản</span>
              </Link>

              {/* Nút chọn vai trò nhanh 1-chạm trên Mobile */}
              <div className="pt-2 border-t border-emerald-700/50">
                <p className="text-[11px] text-emerald-200 font-bold mb-1.5 flex items-center gap-1">
                  <span>⚡</span> Đăng nhập nhanh 1-chạm:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('admin');
                      setShowMobileMenu(false);
                    }}
                    className="p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-left flex items-center gap-1.5 border border-emerald-600 cursor-pointer"
                  >
                    <span>👑</span> <span>Chủ Sân</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('manager');
                      setShowMobileMenu(false);
                    }}
                    className="p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-left flex items-center gap-1.5 border border-emerald-600 cursor-pointer"
                  >
                    <span>👔</span> <span>Quản Lý</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('coach');
                      setShowMobileMenu(false);
                    }}
                    className="p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-left flex items-center gap-1.5 border border-emerald-600 cursor-pointer"
                  >
                    <span>🧢</span> <span>Huấn Luyện Viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('staff');
                      setShowMobileMenu(false);
                    }}
                    className="p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-left flex items-center gap-1.5 border border-emerald-600 cursor-pointer"
                  >
                    <span>⚡</span> <span>Nhân Viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('user');
                      setShowMobileMenu(false);
                    }}
                    className="col-span-2 p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-left flex items-center justify-center gap-1.5 border border-emerald-500 cursor-pointer"
                  >
                    <span>⚽</span> <span>Khách Hàng / Cầu Thủ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
