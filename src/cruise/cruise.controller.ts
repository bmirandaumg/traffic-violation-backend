import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CruiseService } from './cruise.service';
import { CreateCruiseDto } from './dto/create-cruise.dto';
import { UpdateCruiseDto } from './dto/update-cruise.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cruise')
@UseGuards(JwtAuthGuard) 
export class CruiseController {
  constructor(private readonly cruiseService: CruiseService) {}

  @Post()
  create(@Body() createCruiseDto: CreateCruiseDto) {
    return this.cruiseService.create(createCruiseDto);
  }

  @Get()
  findAll() {
    return this.cruiseService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCruiseDto: UpdateCruiseDto) {
    return this.cruiseService.update(+id, updateCruiseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cruiseService.remove(+id);
  }
}
