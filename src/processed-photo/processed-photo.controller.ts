import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProcessedPhotoService } from './processed-photo.service';

@Controller('processed-photo')
export class ProcessedPhotoController {
  constructor(private readonly processedPhotoService: ProcessedPhotoService) {}

@Post('send-speed-event')
  async sendSpeedEvent(@Body() body: {
    cruise: string;
    timestamp: string;
    speed_limit_kmh: number;
    current_speed_kmh: number;
    lpNumber: string;
    lpType: string;
  }) {
    return this.processedPhotoService.sendSpeedEvent(
      body.cruise,
      body.timestamp,
      body.speed_limit_kmh,
      body.current_speed_kmh,
      body.lpNumber,
      body.lpType,
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
