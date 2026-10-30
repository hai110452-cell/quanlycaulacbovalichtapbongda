import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return {
      success: true,
      total: users.length,
      data: users.map(({ password, ...u }) => u),
    };
  }

  async create(body: any) {
    const { name, email, username, password, role = 'player', phone, isLocked = false } = body;

    if (!name || !email || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu!' };
    }

    const cleanUsername = (username || email.split('@')[0]).toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;

    const newUser = this.usersRepository.create({
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username: cleanUsername,
      password: hashedPassword,
      role,
      phone: phone || '',
      isLocked: Boolean(isLocked),
    });

    const saved = await this.usersRepository.save(newUser);
    const { password: _, ...result } = saved;
    return {
      success: true,
      message: 'Tạo người dùng thành công!',
      data: result,
    };
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng #${id}`);
    }
    await this.usersRepository.remove(user);
    return { success: true, message: 'Đã xóa người dùng thành công!' };
  }
}

