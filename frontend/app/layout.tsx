import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Quản Lý Câu Lạc Bộ & Lịch Tập Bóng Đá - Sao Vàng FC',
  description: 'Hệ thống quản lý câu lạc bộ, danh sách cầu thủ, lịch tập luyện và điểm danh bóng đá chuyên nghiệp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
            © 2026 Quản Lý Câu Lạc Bộ & Lịch Tập Bóng Đá. Hệ thống phát triển bằng Next.js Fullstack (Frontend & Backend).
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
