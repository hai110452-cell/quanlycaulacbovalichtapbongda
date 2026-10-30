# Cấu trúc NestJS Backend - Quản Lý CLB Bóng Đá

## Thư mục src/

```
src/
├── main.ts                         # Entry point, cấu hình port & CORS
├── app.module.ts                   # Root module, kết nối DB
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts          # POST /api/auth/login, /register
│   ├── auth.service.ts
│   ├── jwt.strategy.ts             # Passport JWT
│   ├── jwt-auth.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts         # GET/POST /api/users
│   ├── users.service.ts
│   └── user.entity.ts
│
├── players/
│   ├── players.module.ts
│   ├── players.controller.ts       # CRUD /api/players
│   ├── players.service.ts
│   └── player.entity.ts
│
├── fields/
│   ├── fields.module.ts
│   ├── fields.controller.ts        # CRUD /api/fields
│   ├── fields.service.ts
│   └── field.entity.ts
│
├── schedules/
│   ├── schedules.module.ts
│   ├── schedules.controller.ts     # CRUD /api/schedules
│   ├── schedules.service.ts
│   └── schedule.entity.ts
│
├── attendances/
│   ├── attendances.module.ts
│   ├── attendances.controller.ts   # GET/POST /api/attendances
│   ├── attendances.service.ts
│   └── attendance.entity.ts
│
├── matches/
│   ├── matches.module.ts
│   ├── matches.controller.ts       # GET/POST/DELETE /api/matches
│   ├── matches.service.ts
│   └── match.entity.ts
│
├── clubs/
│   ├── clubs.module.ts
│   ├── clubs.controller.ts         # GET/PUT /api/clubs
│   ├── clubs.service.ts
│   └── club.entity.ts
│
└── notifications/
    ├── notifications.module.ts
    ├── notifications.controller.ts  # GET/POST/PATCH/DELETE /api/notifications
    ├── notifications.service.ts
    └── notification.entity.ts
```

