import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldBooking } from './field-booking.entity';
import { FieldBookingsService } from './field-bookings.service';
import { FieldBookingsController } from './field-bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FieldBooking])],
  controllers: [FieldBookingsController],
  providers: [FieldBookingsService],
  exports: [FieldBookingsService],
})
export class FieldBookingsModule {}

