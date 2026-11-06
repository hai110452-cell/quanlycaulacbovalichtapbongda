import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu endpoint không yêu cầu role cụ thể thì cho phép đi qua
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Bạn không có quyền truy cập endpoint này (Thiếu thông tin vai trò)');
    }

    // Role Admin luôn có toàn quyền
    if (user.role.toLowerCase() === 'admin') {
      return true;
    }

    const hasRole = requiredRoles.some((role) => role.toLowerCase() === user.role.toLowerCase());

    if (!hasRole) {
      throw new ForbiddenException(`Quyền truy cập bị từ chối: Yêu cầu vai trò [${requiredRoles.join(', ')}], nhưng tài khoản là [${user.role}]`);
    }

    return true;
  }
}

