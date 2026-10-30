import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AttendancesService } from './attendances.service';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  findAll(@Query('scheduleId') scheduleId?: string, @Query('playerId') playerId?: string) {
    return this.attendancesService.findAll(scheduleId, playerId);
  }

  @Post()
  saveAttendances(@Body() body: any) {
    return this.attendancesService.saveAttendances(body);
  }
}

