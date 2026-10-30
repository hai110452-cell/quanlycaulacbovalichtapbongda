import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'SAO VÀNG FC • HỆ THỐNG QUẢN LÝ CÂU LẠC BỘ BÓNG ĐÁ',
  description: 'Trung tâm quản trị toàn diện: Đội bóng, Thành viên, Huấn luyện viên, Lịch tập, Điểm danh, Phí sinh hoạt và Thông báo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#f0fdf4] text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="border-t-2 border-emerald-700 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white py-7 shadow-inner">
              <div className="max-w-[1720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-extrabold text-white tracking-wider text-sm">
                    SAO VÀNG FOOTBALL CLUB • PROFESSIONAL CLUB MANAGEMENT SYSTEM
                  </span>
                </div>
                <p className="text-emerald-100 text-xs">
                  © 2026 Quản Lý Câu Lạc Bộ & Lịch Tập Bóng Đá. Tông màu chủ đạo Xanh Lá Sân Cỏ.
                </p>
                <div className="flex items-center gap-4 text-emerald-200 text-xs font-semibold">
                  <span className="bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-600">Trụ sở: SVĐ Quốc Gia Mỹ Đình</span>
                  <span>•</span>
                  <span className="bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-600">Hotline: 0901.234.567</span>
                </div>
              </div>
            </footer>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
