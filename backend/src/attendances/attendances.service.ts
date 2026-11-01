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
    query = query.orderBy('attendance.id', 'ASC');
    const attendances = await query.getMany();
    return { success: true, total: attendances.length, data: attendances };
  }

  async saveAttendances(body: any) {
    const rawList = Array.isArray(body)
      ? body
      : Array.isArray(body?.attendances)
      ? body.attendances
      : [body];
    const defaultScheduleId = body?.scheduleId || 'sched-001';

    for (const item of rawList) {
      if (!item) continue;
      const id = item.id;
      let att = id ? await this.attendancesRepository.findOne({ where: { id } }) : null;
      if (!att && item.playerId) {
        att = await this.attendancesRepository.findOne({ where: { playerId: item.playerId } });
      }
      if (att) {
        att.status = item.status || att.status;
        if (item.note !== undefined) att.note = item.note;
        if (item.playerName) att.playerName = item.playerName;
        if (item.checkInTime) att.checkInTime = item.checkInTime;
        await this.attendancesRepository.save(att);
      } else {
        const newAtt = this.attendancesRepository.create({
          id: id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          scheduleId: item.scheduleId || defaultScheduleId,
          playerId: item.playerId || `p-${Date.now()}`,
          playerName: item.playerName || '',
          status: item.status || 'Có mặt',
          checkInTime: item.checkInTime || null,
          note: item.note || null,
        });
        await this.attendancesRepository.save(newAtt);
      }
    }
    return { success: true, message: 'Lưu điểm danh thành công!', total: rawList.length };
  }
}

