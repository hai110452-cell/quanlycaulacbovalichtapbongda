import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'SÂN BÓNG C1 • HỆ THỐNG QUẢN LÝ SÂN BÓNG & LỊCH TẬP',
  description: 'Trung tâm quản trị toàn diện: Sân bóng, Đội bóng, Thành viên, Huấn luyện viên, Lịch tập, Điểm danh, Phí sinh hoạt và Thông báo',
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
            <Footer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
