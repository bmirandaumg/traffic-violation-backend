
import { 
  Controller, UseGuards, Delete, Param, BadRequestException, 
  Get, Query, Post, Body, Patch, Req 
} from '@nestjs/common';
import { PhotoService } from './photo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('photos')
@UseGuards(JwtAuthGuard) 
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get(':id')
  async getPhotoById(@Param('id') id: string) {
    const photoId = Number(id);
    if (isNaN(photoId)) {
      throw new BadRequestException('ID inválido');
    }
    const photo = await this.photoService.getPhotoById(photoId);
    if (!photo) {
      throw new BadRequestException('Foto no encontrada');
    }

    // Lógica para devolver base64
    let photo_base64 = null;
    const rawPath = (photo.photo_path || '').trim();
    const isUrl = /^https?:\/\//i.test(rawPath);
    if (!isUrl && rawPath) {
      const path = await import('path');
      const fs = await import('fs/promises');
      const baseDir = process.env.IMAGES_BASE_DIR
        ? path.resolve(process.env.IMAGES_BASE_DIR)
        : process.cwd();
      const resolvedPath = path.isAbsolute(rawPath)
        ? path.normalize(rawPath)
        : path.normalize(path.join(baseDir, rawPath));
      try {
        const buffer = await fs.readFile(resolvedPath);
        photo_base64 = buffer.toString('base64');
      } catch (err) {
        photo_base64 = null;
      }
    }

    // Extraer y separar el plate
    let plate = (photo.photo_info?.vehicle?.plate || '')
      .replace(/\s+/g, '') // quitar espacios
      .replace(/[^a-zA-Z0-9]/g, ''); // quitar cualquier símbolo que no sea letra o número
    let prefix = '', numbers = '', suffix = '';
    let plateMessage = undefined;
    const match = plate.match(/^([A-Za-z]+)?(\d+)([A-Za-z]+)?$/);
    if (match) {
      prefix = match[1] || '';
      numbers = match[2] || '';
      suffix = match[3] || '';
    } else {
      plateMessage = 'Placa no encontrada o formato no válido';
    }

    // Preparar datos para consultar-vehiculo
    let consultaVehiculo = null;
    if (numbers && suffix && prefix) {
      const placa = numbers + suffix;
      const tipo = prefix + '0';
      try {
        consultaVehiculo = await this.photoService.consultarVehiculo(placa, tipo);
      } catch (err) {
        consultaVehiculo = { error: 'Error al consultar vehículo', detalle: (err as any)?.message || err };
      }
    }

    return {
      id: photo.id,
      photo_info: photo.photo_info,
      plate_parts: {
        prefix,
        numbers,
        suffix,
        message: plateMessage,
      },
      consultaVehiculo,
      photo_base64,
    };
  }

  @Delete(':id')
  async deletePhoto(@Param('id') id: string) {
    const photoId = Number(id);
    if (isNaN(photoId)) {
      throw new BadRequestException('ID inválido');
    }
    await this.photoService.deletePhotoAndFile(photoId);
    return { message: 'Foto y archivo eliminados correctamente' };
  }

  @Get()
  async getPhotos(
    @Query('photo_date') photoDate: string,
    @Query('id_cruise') idCruise: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const idCruiseNumber = Number(idCruise);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    console.log({ photoDate, idCruiseNumber, pageNumber, limitNumber });

    if (isNaN(idCruiseNumber) || isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new BadRequestException('Invalid query parameters');
    }

    return this.photoService.getFilteredPhotos(photoDate, idCruiseNumber, pageNumber, limitNumber);
  }
    @Post('reject')
  async rejectPhoto(
    @Body('photoId') photoId: number,
    @Body('userId') userId: number,
    @Body('rejectionReasonId') rejectionReasonId: number,
  ) {
    return this.photoService.rejectPhoto(photoId, userId, rejectionReasonId);
  }
  @Post('consultar-vehiculo')
async consultarVehiculo(@Body('placa') placa: string, @Body('tipo') tipo: string) {
  return this.photoService.consultarVehiculo(placa, tipo);
}
  
  @Patch(':id/take')
  async takePhoto(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.photoService.lockPhoto(id, userId);
  }

  @Patch(':id/release')
  async releasePhoto(@Param('id') id: number) {
    return this.photoService.unlockPhoto(id);
  }
}
