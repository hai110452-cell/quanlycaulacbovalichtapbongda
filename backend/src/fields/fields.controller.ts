import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FieldsService } from './fields.service';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  findAll() { return this.fieldsService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.fieldsService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.fieldsService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.fieldsService.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.fieldsService.remove(id); }
}

