import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiStatus() {
    return {
      name: '⚽ Quản Lý Câu Lạc Bộ & Lịch Tập Bóng Đá API',
      status: 'online',
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL (Connected)',
      endpoints: {
        clubs: '/api/clubs',
        players: '/api/players',
        fields: '/api/fields',
        schedules: '/api/schedules',
        attendances: '/api/attendances',
        matches: '/api/matches',
        notifications: '/api/notifications',
        users: '/api/users',
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          me: 'GET /api/auth/me',
        },
      },
      frontend: 'http://localhost:3000',
    };
  }
}
