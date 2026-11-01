import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll() { return this.notificationsService.findAll(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.notificationsService.create(body); }

  @Patch()
  markAsRead(@Body() body: any) { return this.notificationsService.markAsRead(body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.notificationsService.remove(id); }

  @Delete()
  removeAll() { return this.notificationsService.removeAll(); }
}

