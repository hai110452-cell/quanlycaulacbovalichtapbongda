import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Not } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
  ) {}

  async findAll(position?: string, search?: string) {
    let players: Player[];

    if (position && position !== 'Tất cả') {
      players = await this.playersRepository.find({
        where: { position },
        order: { jerseyNumber: 'ASC' },
      });
    } else if (search) {
      players = await this.playersRepository.find({
        where: [
          { name: ILike(`%${search}%`) },
        ],
        order: { jerseyNumber: 'ASC' },
      });
    } else {
      players = await this.playersRepository.find({
        order: { jerseyNumber: 'ASC' },
      });
    }

    return {
      success: true,
      total: players.length,
      data: players,
    };
  }

  async findOne(id: string) {
    const player = await this.playersRepository.findOne({ where: { id } });
    if (!player) {
      throw new NotFoundException('Không tìm thấy cầu thủ');
    }
    return { success: true, data: player };
  }

  async create(body: any) {
    const nameClean = (body.name || '').trim();
    const jerseyNum = Number(body.jerseyNumber);

    // 1. Kiểm tra trùng số áo
    if (jerseyNum) {
      const existingJersey = await this.playersRepository.findOne({
        where: { jerseyNumber: jerseyNum },
      });
      if (existingJersey) {
        throw new BadRequestException(
          `Trùng dữ liệu: Số áo #${jerseyNum} đã được đăng ký cho cầu thủ "${existingJersey.name}". Vui lòng chọn số áo khác!`,
        );
      }
    }

    // 2. Kiểm tra trùng họ tên
    if (nameClean) {
      const existingName = await this.playersRepository.findOne({
        where: { name: ILike(nameClean) },
      });
      if (existingName) {
        throw new BadRequestException(
          `Trùng dữ liệu: Cầu thủ mang tên "${nameClean}" đã tồn tại trong danh sách!`,
        );
      }
    }

    // 3. Kiểm tra trùng số điện thoại
    if (body.phone && body.phone.trim()) {
      const phoneClean = body.phone.trim();
      const existingPhone = await this.playersRepository.findOne({
        where: { phone: phoneClean },
      });
      if (existingPhone) {
        throw new BadRequestException(
          `Trùng dữ liệu: Số điện thoại "${phoneClean}" đã được sử dụng bởi cầu thủ "${existingPhone.name}"!`,
        );
      }
    }

    const id = `player-${Date.now()}`;
    const joinedDate = new Date().toISOString().split('T')[0];

    const newPlayer = this.playersRepository.create({
      id,
      name: nameClean,
      jerseyNumber: jerseyNum || 99,
      position: body.position || 'Tiền vệ',
      dateOfBirth: body.dateOfBirth || '2000-01-01',
      phone: body.phone ? body.phone.trim() : '',
      status: body.status || 'Đang thi đấu',
      joinedDate,
      avatarUrl: body.avatarUrl || null,
    });

    const saved = await this.playersRepository.save(newPlayer);
    return {
      success: true,
      message: 'Thêm cầu thủ thành công!',
      data: saved,
    };
  }

  async update(id: string, body: any) {
    const player = await this.playersRepository.findOne({ where: { id } });
    if (!player) {
      throw new NotFoundException('Không tìm thấy cầu thủ để cập nhật');
    }

    // 1. Kiểm tra trùng số áo (loại trừ chính cầu thủ này)
    if (body.jerseyNumber !== undefined && body.jerseyNumber !== null && body.jerseyNumber !== '') {
      const jerseyNum = Number(body.jerseyNumber);
      const existingJersey = await this.playersRepository.findOne({
        where: { jerseyNumber: jerseyNum, id: Not(id) },
      });
      if (existingJersey) {
        throw new BadRequestException(
          `Trùng dữ liệu: Số áo #${jerseyNum} đã thuộc về cầu thủ "${existingJersey.name}". Vui lòng chọn số áo khác!`,
        );
      }
    }

    // 2. Kiểm tra trùng họ tên
    if (body.name && body.name.trim()) {
      const nameClean = body.name.trim();
      const existingName = await this.playersRepository.findOne({
        where: { name: ILike(nameClean), id: Not(id) },
      });
      if (existingName) {
        throw new BadRequestException(
          `Trùng dữ liệu: Cầu thủ mang tên "${nameClean}" đã tồn tại trong danh sách!`,
        );
      }
    }

    // 3. Kiểm tra trùng số điện thoại
    if (body.phone && body.phone.trim()) {
      const phoneClean = body.phone.trim();
      const existingPhone = await this.playersRepository.findOne({
        where: { phone: phoneClean, id: Not(id) },
      });
      if (existingPhone) {
        throw new BadRequestException(
          `Trùng dữ liệu: Số điện thoại "${phoneClean}" đã được sử dụng bởi cầu thủ "${existingPhone.name}"!`,
        );
      }
    }

    Object.assign(player, {
      name: body.name ? body.name.trim() : player.name,
      jerseyNumber: body.jerseyNumber ? Number(body.jerseyNumber) : player.jerseyNumber,
      position: body.position ?? player.position,
      phone: body.phone ? body.phone.trim() : player.phone,
      status: body.status ?? player.status,
    });

    const updated = await this.playersRepository.save(player);
    return {
      success: true,
      message: 'Cập nhật cầu thủ thành công!',
      data: updated,
    };
  }

  async remove(id: string) {
    const player = await this.playersRepository.findOne({ where: { id } });
    if (!player) {
      return {
        success: true,
        message: 'Cầu thủ không tồn tại hoặc đã được xóa trước đó!',
        data: { id },
      };
    }
    await this.playersRepository.remove(player);
    return {
      success: true,
      message: 'Đã xóa cầu thủ thành công!',
      data: { id, name: player.name },
    };
  }
}

