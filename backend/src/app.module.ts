import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlayersModule } from './players/players.module';
import { FieldsModule } from './fields/fields.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AttendancesModule } from './attendances/attendances.module';
import { MatchesModule } from './matches/matches.module';
import { ClubsModule } from './clubs/clubs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamsModule } from './teams/teams.module';
import { AppController } from './app.controller';

// Entities
import { User } from './users/user.entity';
import { Player } from './players/player.entity';
import { Field } from './fields/field.entity';
import { Schedule } from './schedules/schedule.entity';
import { Attendance } from './attendances/attendance.entity';
import { Match } from './matches/match.entity';
import { Club } from './clubs/club.entity';
import { Notification } from './notifications/notification.entity';
import { Team } from './teams/team.entity';

@Module({
  imports: [
    // Load biến môi trường từ .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Kết nối PostgreSQL qua connection string
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: {
          rejectUnauthorized: false,
        },
        entities: [User, Player, Field, Schedule, Attendance, Match, Club, Notification, Team],
        synchronize: true, // Tự động tạo/cập nhật bảng (chỉ dùng development)
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    PlayersModule,
    FieldsModule,
    SchedulesModule,
    AttendancesModule,
    MatchesModule,
    ClubsModule,
    NotificationsModule,
    TeamsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

