import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async findAll() {
    const notifications = await this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
    });
    return {
      success: true,
      total: notifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
      data: notifications,
    };
  }

  async create(body: any) {
    const newNotif = this.notificationsRepository.create({
      id: `notif-${Date.now()}`,
      title: body.title || 'Thông báo lịch tập',
      message: body.message || '',
      type: body.type || 'new',
      timestamp: body.timestamp || new Date().toLocaleString('vi-VN'),
      read: false,
      scheduleId: body.scheduleId || null,
    });
    const saved = await this.notificationsRepository.save(newNotif);
    return { success: true, message: 'Tạo thông báo thành công', data: saved };
  }

  async markAsRead(body: any) {
    if (body.markAllAsRead) {
      await this.notificationsRepository.update({}, { read: true });
      return { success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
    }
    if (body.id) {
      await this.notificationsRepository.update({ id: body.id }, { read: true });
      return { success: true, message: 'Cập nhật trạng thái thông báo thành công' };
    }
    return { success: true };
  }

  async removeAll() {
    await this.notificationsRepository.clear();
    return { success: true, message: 'Đã xóa toàn bộ lịch sử thông báo' };
  }
}

