import { Controller, Get, Put, Body } from '@nestjs/common';
import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  findOne() { return this.clubsService.findOne(); }

  @Put()
  update(@Body() body: any) { return this.clubsService.update(body); }
}

