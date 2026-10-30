import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendancesRepository: Repository<Attendance>,
  ) {}

  async findAll(scheduleId?: string, playerId?: string) {
    let query = this.attendancesRepository.createQueryBuilder('attendance');
    if (scheduleId && playerId) {
      query = query.where('attendance.scheduleId = :scheduleId AND attendance.playerId = :playerId', { scheduleId, playerId });
    } else if (scheduleId) {
      query = query.where('attendance.scheduleId = :scheduleId', { scheduleId });
    }
    const attendances = await query.getMany();
    return { success: true, total: attendances.length, data: attendances };
  }

  async saveAttendances(body: any) {
    // Hỗ trợ cả mảng và single record (giống behavior gốc)
    if (Array.isArray(body)) {
      for (const item of body) {
        const id = item.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await this.attendancesRepository
          .createQueryBuilder()
          .insert()
          .into(Attendance)
          .values({
            id,
            scheduleId: item.scheduleId,
            playerId: item.playerId,
            playerName: item.playerName,
            status: item.status || 'Có mặt',
            checkInTime: item.checkInTime || null,
            note: item.note || null,
          })
          .orUpdate(['status', 'check_in_time', 'note'], ['id'])
          .execute();
      }
      return { success: true, message: 'Lưu điểm danh hàng loạt thành công!', total: body.length };
    }

    // Single record
    const id = body.id || `att-${Date.now()}`;
    await this.attendancesRepository
      .createQueryBuilder()
      .insert()
      .into(Attendance)
      .values({
        id,
        scheduleId: body.scheduleId,
        playerId: body.playerId,
        playerName: body.playerName,
        status: body.status || 'Có mặt',
        checkInTime: body.checkInTime || null,
        note: body.note || null,
      })
      .orUpdate(['status', 'check_in_time', 'note'], ['id'])
      .execute();

    const saved = await this.attendancesRepository.findOne({ where: { id } });
    return { success: true, message: 'Cập nhật điểm danh thành công!', data: saved };
  }
}

