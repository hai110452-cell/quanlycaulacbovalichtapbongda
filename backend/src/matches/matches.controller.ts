import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll(@Query('status') status?: string) { return this.matchesService.findAll(status); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.matchesService.create(body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.matchesService.remove(id); }
}

