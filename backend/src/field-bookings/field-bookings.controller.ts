import { Controller, Get, Post, Put, Delete, Body, Query } from '@nestjs/common';
import { FieldBookingsService } from './field-bookings.service';

@Controller('field-bookings')
export class FieldBookingsController {
  constructor(private readonly service: FieldBookingsService) {}

  @Get()
  findAll(@Query('date') date?: string, @Query('fieldId') fieldId?: string) {
    return this.service.findAll(date, fieldId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put()
  updateStatus(
    @Query('id') id: string,
    @Query('action') action: string,
    @Query('fieldId') fieldId?: string,
    @Query('date') date?: string,
    @Query('slotTime') slotTime?: string,
  ) {
    return this.service.updateStatus(id, action, fieldId, date, slotTime);
  }

  @Delete()
  remove(
    @Query('id') id: string,
    @Query('fieldId') fieldId?: string,
    @Query('date') date?: string,
    @Query('slotTime') slotTime?: string,
  ) {
    return this.service.remove(id, fieldId, date, slotTime);
  }
}

