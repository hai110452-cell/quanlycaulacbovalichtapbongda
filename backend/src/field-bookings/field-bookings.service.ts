import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FieldBooking } from './field-booking.entity';

@Injectable()
export class FieldBookingsService {
  constructor(
    @InjectRepository(FieldBooking)
    private readonly bookingRepo: Repository<FieldBooking>,
  ) {}

  async findAll(date?: string, fieldId?: string) {
    const query = this.bookingRepo.createQueryBuilder('fb');
    if (date) query.andWhere('fb.booking_date = :date', { date });
    if (fieldId && fieldId !== 'all') query.andWhere('fb.field_id = :fieldId', { fieldId });
    query.orderBy('fb.booking_date', 'ASC').addOrderBy('fb.slot_time', 'ASC');
    const data = await query.getMany();
    return { success: true, total: data.length, data };
  }

  async create(body: any) {
    const bookingId = body.id || `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const receiptCode = body.receiptCode || `C1-BK-${Date.now().toString().slice(-6)}`;
    const newBooking = this.bookingRepo.create({
      id: bookingId,
      fieldId: body.fieldId,
      fieldName: body.fieldName || 'Sân bóng C1',
      bookingDate: body.bookingDate,
      slotId: body.slotId || 'slot-custom',
      slotTime: body.slotTime,
      slotLabel: body.slotLabel || 'Ca đặt theo yêu cầu',
      price: body.price || 400000,
      isBooked: true,
      status: body.status || 'pending',
      receiptCode,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      teamName: body.teamName || '',
      services: body.services || '',
      notes: body.notes || '',
    });
    const saved = await this.bookingRepo.save(newBooking);
    return {
      success: true,
      message: 'Đặt sân thành công!',
      data: saved,
      receiptCode,
    };
  }

  async updateStatus(id: string, action: string, fieldId?: string, date?: string, slotTime?: string) {
    const updatePayload: any =
      action === 'approve'
        ? { status: 'approved', isBooked: true }
        : {
            status: 'rejected',
            isBooked: false,
            customerName: null,
            customerPhone: null,
            teamName: null,
            services: null,
            notes: null,
          };

    if (id) {
      await this.bookingRepo.update(id, updatePayload);
    }
    if (fieldId && date && slotTime) {
      await this.bookingRepo
        .createQueryBuilder()
        .update(FieldBooking)
        .set(updatePayload)
        .where('field_id = :fieldId AND booking_date = :date AND slot_time = :slotTime', {
          fieldId,
          date,
          slotTime,
        })
        .execute();
    }
    return {
      success: true,
      message: action === 'approve' ? 'Đã phê duyệt ca đặt sân' : 'Đã từ chối đơn đặt sân',
    };
  }

  async remove(id: string, fieldId?: string, date?: string, slotTime?: string) {
    const clearPayload = {
      isBooked: false,
      status: 'available',
      customerName: null as any,
      customerPhone: null as any,
      teamName: null as any,
      services: null as any,
      notes: null as any,
    };

    if (id) {
      await this.bookingRepo.update(id, clearPayload);
    }
    if (fieldId && date && slotTime) {
      await this.bookingRepo
        .createQueryBuilder()
        .update(FieldBooking)
        .set(clearPayload)
        .where('field_id = :fieldId AND booking_date = :date AND slot_time = :slotTime', {
          fieldId,
          date,
          slotTime,
        })
        .execute();
    }
    return { success: true, message: 'Đã hủy ca đặt sân thành công' };
  }
}

