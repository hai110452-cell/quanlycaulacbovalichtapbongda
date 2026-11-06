import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Lấy API Key từ Header hoặc Query Param
    const apiKey =
      request.headers['x-api-key'] ||
      request.headers['api-key'] ||
      request.query?.api_key;

    const validApiKey = this.configService.get<string>('API_KEY') || 'football-c1-secret-api-key-2026';

    if (!apiKey) {
      throw new UnauthorizedException('Thiếu API Key trong yêu cầu (Vui lòng đính kèm header x-api-key)');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('API Key không hợp lệ hoặc đã hết hạn');
    }

    return true;
  }
}

