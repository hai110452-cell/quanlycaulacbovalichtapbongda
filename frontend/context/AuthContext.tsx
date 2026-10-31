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
    name: 'Ban Lãnh Đạo (Admin)',
    email: 'admin@saovangfc.vn',
    role: 'admin',
    phone: '0901234567',
  },
  coach: {
    id: 'u-coach',
    name: 'HLV. Nguyễn Văn Huấn',
    email: 'coach.huan@saovangfc.vn',
    role: 'coach',
    phone: '0912345678',
  },
  player: {
    id: 'u-player',
    name: 'Nguyễn Quang Hải (#19)',
    email: 'quanghai19@saovangfc.vn',
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
      const storedUser = localStorage.getItem('saovang_user');
      const storedToken = localStorage.getItem('saovang_token');
      if (storedUser && storedUser !== 'undefined' && storedToken && storedToken !== 'undefined') {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else {
        localStorage.removeItem('saovang_user');
        localStorage.removeItem('saovang_token');
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error('Lỗi đọc auth từ localStorage:', e);
      localStorage.removeItem('saovang_user');
      localStorage.removeItem('saovang_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('saovang_user', JSON.stringify(newUser));
    localStorage.setItem('saovang_token', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('saovang_user');
    localStorage.removeItem('saovang_token');
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser = defaultDemoUsers[newRole];
    setUser(targetUser);
    localStorage.setItem('saovang_user', JSON.stringify(targetUser));
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
