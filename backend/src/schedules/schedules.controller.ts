import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('date') date?: string) {
    return this.schedulesService.findAll(status, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.schedulesService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.schedulesService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.schedulesService.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.schedulesService.remove(id); }
}

