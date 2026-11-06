'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLoading: boolean;
}

const defaultDemoUsers: Record<UserRole, User> = {
  admin: {
    id: 'u-admin',
    name: 'Chủ Sân C1 (Admin)',
    email: 'admin@sanc1.vn',
    role: 'admin',
    phone: '0983830955',
  },
  staff: {
    id: 'u-staff',
    name: 'Nhân Viên Quản Lý Ca (Staff)',
    email: 'staff@sanc1.vn',
    role: 'staff',
    phone: '0906424006',
  },
  manager: {
    id: 'u-manager',
    name: 'Quản Lý CLB (Manager)',
    email: 'manager@sanc1.vn',
    role: 'manager',
    phone: '0906424006',
  },
  coach: {
    id: 'u-coach',
    name: 'HLV. Nguyễn Văn Huấn',
    email: 'coach.huan@sanc1.vn',
    role: 'coach',
    phone: '0912345678',
  },
  user: {
    id: 'u-user',
    name: 'Khách Hàng Đặt Sân',
    email: 'khachhang@sanc1.vn',
    role: 'user',
    phone: '0908767623',
  },
  player: {
    id: 'u-player',
    name: 'Nguyễn Quang Hải (#19)',
    email: 'quanghai19@sanc1.vn',
    role: 'player',
    phone: '0934567890',
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('saovang_user') || localStorage.getItem('user');
      const storedToken = localStorage.getItem('saovang_token') || localStorage.getItem('token');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        const validToken =
          storedToken && storedToken !== 'undefined' && storedToken !== 'null'
            ? storedToken
            : 'token-' + (parsed.role || 'user');
        setToken(validToken);

        // Đồng bộ 2 chiều các key lưu trữ để tương thích toàn hệ thống
        const str = JSON.stringify(parsed);
        localStorage.setItem('saovang_user', str);
        localStorage.setItem('user', str);
        localStorage.setItem('saovang_token', validToken);
        localStorage.setItem('token', validToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error('Lỗi đọc auth từ localStorage:', e);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: User, newToken?: string) => {
    const finalToken = newToken || 'token-' + (newUser.role || 'user');
    setUser(newUser);
    setToken(finalToken);
    try {
      const str = JSON.stringify(newUser);
      localStorage.setItem('saovang_user', str);
      localStorage.setItem('user', str);
      localStorage.setItem('saovang_token', finalToken);
      localStorage.setItem('token', finalToken);
    } catch (e) {
      console.warn('Lỗi lưu auth vào localStorage:', e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('saovang_user');
      localStorage.removeItem('saovang_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch {}
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser = defaultDemoUsers[newRole] || defaultDemoUsers.admin;
    const finalToken = 'token-' + newRole;
    setUser(targetUser);
    setToken(finalToken);
    try {
      const str = JSON.stringify(targetUser);
      localStorage.setItem('saovang_user', str);
      localStorage.setItem('user', str);
      localStorage.setItem('saovang_token', finalToken);
      localStorage.setItem('token', finalToken);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
