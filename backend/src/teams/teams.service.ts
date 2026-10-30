import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async findAll() {
    const teams = await this.teamsRepository.find({
      order: { id: 'ASC' },
    });
    return {
      success: true,
      total: teams.length,
      data: teams,
    };
  }

  async findOne(id: string) {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException('Không tìm thấy đội bóng');
    }
    return { success: true, data: team };
  }

  async create(body: any) {
    const id = body.id || `team-${Date.now()}`;
    const newTeam = this.teamsRepository.create({
      id,
      name: body.name,
      level: body.level || 'Đội bóng trực thuộc CLB',
      headCoach: body.headCoach || body.head_coach || 'Chưa phân công',
      captain: body.captain || 'Chưa chỉ định',
      memberCount: Number(body.memberCount || body.member_count) || 0,
      homePitch: body.homePitch || body.home_pitch || 'Sân bóng Sao Vàng',
      establishedYear: Number(body.establishedYear || body.established_year) || 2024,
      description: body.description || '',
      status: body.status || 'Hoạt động',
    });

    const saved = await this.teamsRepository.save(newTeam);
    return {
      success: true,
      message: 'Thêm đội bóng thành công!',
      data: saved,
    };
  }

  async update(id: string, body: any) {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException('Không tìm thấy đội bóng để cập nhật');
    }

    Object.assign(team, {
      name: body.name ?? team.name,
      level: body.level ?? team.level,
      headCoach: body.headCoach ?? body.head_coach ?? team.headCoach,
      captain: body.captain ?? team.captain,
      memberCount: body.memberCount !== undefined ? Number(body.memberCount) : team.memberCount,
      homePitch: body.homePitch ?? body.home_pitch ?? team.homePitch,
      establishedYear: body.establishedYear ? Number(body.establishedYear) : team.establishedYear,
      description: body.description ?? team.description,
      status: body.status ?? team.status,
    });

    const updated = await this.teamsRepository.save(team);
    return {
      success: true,
      message: 'Cập nhật đội bóng thành công!',
      data: updated,
    };
  }

  async remove(id: string) {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException('Không tìm thấy đội bóng để xóa');
    }
    await this.teamsRepository.remove(team);
    return {
      success: true,
      message: 'Đã xóa đội bóng thành công!',
      data: { id, name: team.name },
    };
  }
}
