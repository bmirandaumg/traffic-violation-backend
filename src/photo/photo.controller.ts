
import { 
  Controller, UseGuards, Delete, Param, BadRequestException, 
  Get, Query, Post, Body, Patch, Req 
} from '@nestjs/common';
import { PhotoService } from './photo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('photos')
@UseGuards(JwtAuthGuard) 
export class PhotoController {
  constructor(
    private readonly photoService: PhotoService,
  ) {}



  // El endpoint send-speed-event debe estar en ProcessedPhotoController, no aquí.

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

    // Extraer speedLimit y measuredSpeed como números si existen
    let speedLimit = null;
    let measuredSpeed = null;
    if (photo.photo_info) {
      // speedLimit: puede venir como "70 km/h"
      if (photo.photo_info.speedLimit) {
        const match = String(photo.photo_info.speedLimit).match(/(-?\d+)/);
        speedLimit = match ? Number(match[1]) : null;
      }
      // measuredSpeed: puede venir como "-80 km/h (DEP)"
      if (photo.photo_info.measuredSpeed) {
        const match = String(photo.photo_info.measuredSpeed).match(/(-?\d+)/);
        measuredSpeed = match ? Math.abs(Number(match[1])) : null;
      }
    }

    // Excluir campos no deseados de photo_info y preparar timestamp
    const { distance, fileName, videoNumber, serialNumber, date, time, ...filteredPhotoInfo } = photo.photo_info || {};

    // Construir timestamp usando photo_date (YYYY-MM-DD) y time de photo_info
    let timestamp = null;
    if (photo.photo_date && time) {
      // Obtener datePart robustamente (YYYY-MM-DD)
      let datePart: string | null = null;
      if (photo.photo_date instanceof Date) {
        if (!isNaN(photo.photo_date.getTime())) {
          datePart = photo.photo_date.toISOString().slice(0, 10);
        }
      } else if (typeof photo.photo_date === 'string') {
        // Si viene como string, intentar extraer la fecha
        const dateStr = String(photo.photo_date);
        const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
        datePart = match ? match[0] : null;
      }
      if (datePart) {
        let cleanTime = time.trim();
        // Convertir AM/PM a 24h
        const ampmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
        if (ampmMatch) {
          let [ , hh, mm, ss, ampm ] = ampmMatch;
          hh = hh.padStart(2, '0');
          mm = mm.padStart(2, '0');
          ss = (ss || '00').padStart(2, '0');
          if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hh !== '12') {
              hh = String(Number(hh) + 12).padStart(2, '0');
            } else if (ampm.toUpperCase() === 'AM' && hh === '12') {
              hh = '00';
            }
          }
          cleanTime = `${hh}:${mm}:${ss}`;
        }
        // Validar formato antes de crear Date
        const isoString = `${datePart}T${cleanTime}Z`;
        console.log('[getPhotoById] datePart:', datePart, '| cleanTime:', cleanTime, '| isoString:', isoString);
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(isoString)) {
          const utcDate = new Date(isoString);
          if (!isNaN(utcDate.getTime())) {
            timestamp = utcDate.toISOString();
          } else {
            console.warn('[getPhotoById] Fecha inválida:', isoString);
          }
        } else {
          console.warn('[getPhotoById] String ISO inválido:', isoString);
        }
      } else {
        console.warn('[getPhotoById] photo_date no es un Date válido ni un string con formato YYYY-MM-DD:', photo.photo_date);
      }
      let cleanTime = time.trim();
      // Convertir AM/PM a 24h
      const ampmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
      if (ampmMatch) {
        let [ , hh, mm, ss, ampm ] = ampmMatch;
        hh = hh.padStart(2, '0');
        mm = mm.padStart(2, '0');
        ss = (ss || '00').padStart(2, '0');
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hh !== '12') {
            hh = String(Number(hh) + 12).padStart(2, '0');
          } else if (ampm.toUpperCase() === 'AM' && hh === '12') {
            hh = '00';
          }
        }
        cleanTime = `${hh}:${mm}:${ss}`;
      }
      // Validar formato antes de crear Date
      const isoString = `${datePart}T${cleanTime}Z`;
      console.log('[getPhotoById] datePart:', datePart, '| cleanTime:', cleanTime, '| isoString:', isoString);
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(isoString)) {
        const utcDate = new Date(isoString);
        if (!isNaN(utcDate.getTime())) {
          timestamp = utcDate.toISOString();
        } else {
          console.warn('[getPhotoById] Fecha inválida:', isoString);
        }
      } else {
        console.warn('[getPhotoById] String ISO inválido:', isoString);
      }
    }

    // Determinar si la info SAT es completa
    const isSatVehicleInfoFound = !!(
      consultaVehiculo &&
      typeof consultaVehiculo === 'object' &&
      consultaVehiculo.ESTADO &&
      consultaVehiculo.PLACA &&
      consultaVehiculo.MARCA &&
      consultaVehiculo.LINEA &&
      consultaVehiculo.MODELO &&
      consultaVehiculo.COLOR &&
      consultaVehiculo.TIPO &&
      consultaVehiculo.USO &&
      consultaVehiculo.CC
    );

    return {
      id: photo.id,
      photo_info: {
        ...filteredPhotoInfo,
        speedLimit,
        measuredSpeed,
        timestamp,
      },
      // plate_parts: {
      //   prefix,
      //   numbers,
      //   suffix,
      //   message: plateMessage,
      // },
      isSatVehicleInfoFound,
      consultaVehiculo: isSatVehicleInfoFound ? consultaVehiculo : null,
      photo_base64,
      photo_date: photo.photo_date,
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
    @Req() req: any,
  ) {
    const idCruiseNumber = Number(idCruise);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const userId = req.user?.id;
    console.log({ photoDate, idCruiseNumber, pageNumber, limitNumber, userId });

    if (isNaN(idCruiseNumber) || isNaN(pageNumber) || isNaN(limitNumber)) {
      throw new BadRequestException('Invalid query parameters');
    }

    return this.photoService.getFilteredPhotos(photoDate, idCruiseNumber, pageNumber, limitNumber, userId);
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
