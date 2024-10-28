import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProcessedPhotoService } from './processed-photo.service';

@Controller('processed-photo')
export class ProcessedPhotoController {
  constructor(private readonly processedPhotoService: ProcessedPhotoService) {}

  // Endpoint para crear un nuevo registro de foto procesada
  @Post()
  async createProcessedPhoto(
    @Body('id_photo') idPhoto: number,
    @Body('id_user') idUser: number,
    @Body('start_time') startTime: Date,
    @Body('end_time') endTime: Date,
    @Body('id_rejection_reason') idRejectionReason?: number,
  ) {
    return this.processedPhotoService.createProcessedPhoto(
      idPhoto,
      idUser,
      startTime,
      endTime,
      idRejectionReason,
    );
  }

  // Endpoint para obtener todas las fotos procesadas
  @Get()
  async findAll() {
    return this.processedPhotoService.findAll();
  }

  // Endpoint para obtener una foto procesada por su ID
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.processedPhotoService.findOne(id);
  }
}
