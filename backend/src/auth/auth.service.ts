import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { txtID, txtPass } = loginDto;
    const accountId = txtID.trim();
    const password = txtPass.trim();

    // Kiểm tra regex: min 6, max 15, chỉ chữ và số
    const validRegex = /^[a-zA-Z0-9]{6,15}$/;
    if (!validRegex.test(accountId) || !validRegex.test(password)) {
      throw new BadRequestException('Tài khoản hoặc mật khẩu không đúng!!!');
    }

    // Tìm user theo username hoặc email
    const user = await this.usersRepository.findOne({
      where: [{ username: accountId }, { email: accountId }],
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng!!!');
    }

    // Kiểm tra tài khoản bị khóa
    if (user.isLocked) {
      throw new ForbiddenException({ isLocked: true, message: 'Tài khoản đã bị khóa!!!' });
    }

    // Xác thực mật khẩu
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng!!!');
    }

    // Tạo JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      message: 'Đăng nhập thành công!',
      user: userWithoutPassword,
      token,
    };
  }

  async register(registerDto: RegisterDto) {
    const { name, email, password, username, role = 'player', phone } = registerDto;

    if (!name || !email || !password) {
      throw new BadRequestException('Vui lòng điền đầy đủ họ tên, email và mật khẩu!');
    }

    const cleanUsername = (
      username ||
      email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') ||
      `user${Date.now().toString().slice(-4)}`
    ).toLowerCase();

    // Kiểm tra tồn tại
    const existing = await this.usersRepository.findOne({
      where: [{ email: email.toLowerCase().trim() }, { username: cleanUsername }],
    });

    if (existing) {
      throw new ConflictException('Email hoặc Tài khoản này đã tồn tại trên hệ thống!');
    }

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
    });

    const savedUser = await this.usersRepository.save(newUser);

    const payload = { sub: savedUser.id, email: savedUser.email, username: savedUser.username };
    const token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = savedUser;
    return {
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: userWithoutPassword,
      token,
    };
  }
}

