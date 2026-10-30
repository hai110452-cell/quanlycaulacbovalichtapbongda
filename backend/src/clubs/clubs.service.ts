import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './club.entity';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
  ) {}

  async findOne() {
    const club = await this.clubsRepository.findOne({ where: { id: 'default-club' } });
    return { success: true, data: club || null };
  }

  async update(body: any) {
    let club = await this.clubsRepository.findOne({ where: { id: 'default-club' } });

    if (!club) {
      // Tạo mới nếu chưa có
      club = this.clubsRepository.create({ id: 'default-club', name: body.name || 'Câu Lạc Bộ Bóng Đá' });
    }

    Object.assign(club, {
      name: body.name ?? club.name,
      shortName: body.shortName ?? club.shortName,
      coach: body.coach ?? club.coach,
      captain: body.captain ?? club.captain,
      homeStadium: body.homeStadium ?? club.homeStadium,
      logoUrl: body.logoUrl ?? club.logoUrl,
      description: body.description ?? club.description,
    });

    const updated = await this.clubsRepository.save(club);
    return { success: true, message: 'Cập nhật thông tin CLB thành công!', data: updated };
  }
}

