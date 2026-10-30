import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  async findAll(status?: string) {
    let query = this.matchesRepository.createQueryBuilder('match');
    if (status && status !== 'Tất cả') {
      query = query.where('match.status = :status', { status });
    }
    query = query.orderBy('match.createdAt', 'DESC');
    const matches = await query.getMany();
    return { success: true, total: matches.length, data: matches };
  }

  async create(body: any) {
    const id = `match-${Date.now()}`;
    const newMatch = this.matchesRepository.create({
      id,
      opponent: body.opponent || 'Đối thủ FC',
      opponentLogo: body.opponentLogo || null,
      matchType: body.matchType || 'Giao hữu',
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '16:00',
      fieldName: body.fieldName || '',
      homeScore: Number(body.homeScore ?? 0),
      awayScore: Number(body.awayScore ?? 0),
      status: body.status || 'Đã kết thúc',
      goalScorers: body.goalScorers || [],
      mvp: body.mvp || null,
      yellowCards: Number(body.yellowCards ?? 0),
      redCards: Number(body.redCards ?? 0),
      notes: body.notes || '',
    });
    const saved = await this.matchesRepository.save(newMatch);
    return { success: true, message: 'Lưu kết quả trận đấu thành công!', data: saved };
  }

  async remove(id: string) {
    const match = await this.matchesRepository.findOne({ where: { id } });
    if (!match) throw new NotFoundException('Không tìm thấy trận đấu');
    await this.matchesRepository.remove(match);
    return { success: true, message: 'Xóa trận đấu thành công!', data: { id } };
  }
}

