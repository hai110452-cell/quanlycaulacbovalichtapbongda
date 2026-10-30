import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
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
    const id = `player-${Date.now()}`;
    const joinedDate = new Date().toISOString().split('T')[0];

    const newPlayer = this.playersRepository.create({
      id,
      name: body.name,
      jerseyNumber: Number(body.jerseyNumber) || 99,
      position: body.position || 'Tiền vệ',
      dateOfBirth: body.dateOfBirth || '2000-01-01',
      phone: body.phone || '',
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

    Object.assign(player, {
      name: body.name ?? player.name,
      jerseyNumber: body.jerseyNumber ? Number(body.jerseyNumber) : player.jerseyNumber,
      position: body.position ?? player.position,
      phone: body.phone ?? player.phone,
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
      throw new NotFoundException('Không tìm thấy cầu thủ để xóa');
    }
    await this.playersRepository.remove(player);
    return {
      success: true,
      message: 'Đã xóa cầu thủ thành công!',
      data: { id, name: player.name },
    };
  }
}

