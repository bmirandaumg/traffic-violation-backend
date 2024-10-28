import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RejectionReasonService } from './rejection-reason.service';

@Controller('rejection-reason')
export class RejectionReasonController {
  constructor(private readonly rejectionReasonService: RejectionReasonService) {}

  // Crear un nuevo motivo de rechazo
  @Post()
  async create(@Body('description') description: string) {
    return this.rejectionReasonService.create(description);
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
