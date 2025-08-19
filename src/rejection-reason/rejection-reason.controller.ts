import { Controller, Get, Post, Body, Param, Delete,UseGuards } from '@nestjs/common';
import { RejectionReasonService } from './rejection-reason.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rejection-reason')
export class RejectionReasonController {
  constructor(private readonly rejectionReasonService: RejectionReasonService) {}

  // Create a new rejection reason
  @Post()
  async create(@Body('description') description: string) {
    return this.rejectionReasonService.create(description);
  }

  //
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.rejectionReasonService.delete(id);
  }

  // Listar todos los motivos de rechazo
  @Get()
  async findAll() {
    return this.rejectionReasonService.findAll();
  }

  // Obtener un motivo de rechazo por ID
  @Get(':id')
  async findById(@Param('id') id: number) {
    return this.rejectionReasonService.findById(id);
  }
}
