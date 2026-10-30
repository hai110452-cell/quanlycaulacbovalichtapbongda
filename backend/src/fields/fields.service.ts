import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Field } from './field.entity';

@Injectable()
export class FieldsService {
  constructor(
    @InjectRepository(Field)
    private fieldsRepository: Repository<Field>,
  ) {}

  async findAll() {
    const fields = await this.fieldsRepository.find({ order: { name: 'ASC' } });
    return { success: true, total: fields.length, data: fields };
  }

  async findOne(id: string) {
    const field = await this.fieldsRepository.findOne({ where: { id } });
    if (!field) throw new NotFoundException('Không tìm thấy sân bóng');
    return { success: true, data: field };
  }

  async create(body: any) {
    const id = `field-${Date.now()}`;
    const newField = this.fieldsRepository.create({
      id,
      name: body.name || 'Sân bóng mới',
      location: body.location || '',
      fieldType: body.fieldType || 'Sân 7 người',
      surfaceType: body.surfaceType || 'Cỏ nhân tạo',
      status: body.status || 'Khả dụng',
    });
    const saved = await this.fieldsRepository.save(newField);
    return { success: true, message: 'Thêm sân bóng thành công!', data: saved };
  }

  async update(id: string, body: any) {
    const field = await this.fieldsRepository.findOne({ where: { id } });
    if (!field) throw new NotFoundException('Không tìm thấy sân bóng');
    Object.assign(field, {
      name: body.name ?? field.name,
      location: body.location ?? field.location,
      fieldType: body.fieldType ?? field.fieldType,
      surfaceType: body.surfaceType ?? field.surfaceType,
      status: body.status ?? field.status,
    });
    const updated = await this.fieldsRepository.save(field);
    return { success: true, message: 'Cập nhật sân bóng thành công!', data: updated };
  }

  async remove(id: string) {
    const field = await this.fieldsRepository.findOne({ where: { id } });
    if (!field) throw new NotFoundException('Không tìm thấy sân bóng');
    await this.fieldsRepository.remove(field);
    return { success: true, message: 'Xóa sân bóng thành công!', data: { id } };
  }
}

