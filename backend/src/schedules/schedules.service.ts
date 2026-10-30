import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
  ) {}

  async findAll(status?: string, date?: string) {
    let query = this.schedulesRepository.createQueryBuilder('schedule');
    if (status && status !== 'Tất cả') {
      query = query.where('schedule.status = :status', { status });
    }
    if (date) {
      query = query.andWhere('schedule.date = :date', { date });
    }
    query = query.orderBy('schedule.date', 'ASC').addOrderBy('schedule.startTime', 'ASC');
    const schedules = await query.getMany();
    return { success: true, total: schedules.length, data: schedules };
  }

  async findOne(id: string) {
    const schedule = await this.schedulesRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch tập');
    return { success: true, data: schedule };
  }

  async create(body: any) {
    const id = `sched-${Date.now()}`;
    const newSchedule = this.schedulesRepository.create({
      id,
      title: body.title || 'Buổi tập mới',
      type: body.type || 'Tập thể lực',
      date: body.date || new Date().toISOString().split('T')[0],
      startTime: body.startTime || '18:00',
      endTime: body.endTime || '20:00',
      fieldId: body.fieldId || '',
      fieldName: body.fieldName || '',
      coach: body.coach || '',
      status: body.status || 'Sắp diễn ra',
      notes: body.notes || '',
    });
    const saved = await this.schedulesRepository.save(newSchedule);
    return { success: true, message: 'Tạo lịch tập luyện thành công!', data: saved };
  }

  async update(id: string, body: any) {
    const schedule = await this.schedulesRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch tập');
    Object.assign(schedule, {
      title: body.title ?? schedule.title,
      type: body.type ?? schedule.type,
      date: body.date ?? schedule.date,
      startTime: body.startTime ?? schedule.startTime,
      endTime: body.endTime ?? schedule.endTime,
      fieldId: body.fieldId ?? schedule.fieldId,
      fieldName: body.fieldName ?? schedule.fieldName,
      coach: body.coach ?? schedule.coach,
      status: body.status ?? schedule.status,
      notes: body.notes ?? schedule.notes,
    });
    const updated = await this.schedulesRepository.save(schedule);
    return { success: true, message: 'Cập nhật lịch tập thành công!', data: updated };
  }

  async remove(id: string) {
    const schedule = await this.schedulesRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch tập');
    await this.schedulesRepository.remove(schedule);
    return { success: true, message: 'Đã hủy/xóa lịch tập thành công!', data: { id } };
  }
}

