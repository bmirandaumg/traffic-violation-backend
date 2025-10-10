import { Injectable } from '@nestjs/common';
import { PhotoService } from '../photo/photo.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedPhoto } from './processed-photo.entity';
import { Photo } from '../photo/photo.entity';
import { UserE } from '../user/user.entity';
import axios from 'axios';
@Injectable()
export class ProcessedPhotoService {
  constructor(
    @InjectRepository(ProcessedPhoto)
    private readonly processedPhotoRepository: Repository<ProcessedPhoto>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(UserE)
    private readonly userRepository: Repository<UserE>,
    private readonly photoService: PhotoService,
  ) {}

  // Crear un nuevo registro de procesamiento de foto
  async createProcessedPhoto(
    idPhoto: number,
    idUser: number,
    startTime: Date,
    endTime: Date,
    rejectionReasonId?: number,
  ): Promise<ProcessedPhoto> {
    const photo = await this.photoRepository.findOne({ where: { id: idPhoto } });
    const user = await this.userRepository.findOne({ where: { id: idUser } });

    if (!photo || !user) {
      throw new Error('Foto o usuario no encontrados');
    }

    const processedPhoto = this.processedPhotoRepository.create({
      photo,
      user,
      start_time: startTime,
      end_time: endTime,
      rejectionReason: rejectionReasonId ? { id: rejectionReasonId } : null, // Si hay rechazo
    });

    return this.processedPhotoRepository.save(processedPhoto);
  }

  async sendSpeedEvent(
    cruise: string,
    timestamp: string,
    speed_limit_kmh: number,
    current_speed_kmh: number,
    lpNumber: string,
    lpType: string,
    photoId?: number,
  ): Promise<void> {

      const filteredLpType = lpType.replace(/\d/g, '');
      const dateObj = new Date(timestamp);
      const dia = String(dateObj.getUTCDate()).padStart(2, '0');
      const mes = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const año = dateObj.getUTCFullYear();
      const hora = String(dateObj.getUTCHours()).padStart(2, '0');
      const minuto = String(dateObj.getUTCMinutes()).padStart(2, '0');
      const segundo = String(dateObj.getUTCSeconds()).padStart(2, '0');
      const timestampFormateado = `${dia}-${mes}-${año}-${hora}-${minuto}-${segundo}`;


    const urlProcessedPhoto = process.env.SPEED_EVENTS_URL;
    const payload = {
      cruise,
      timestamp: timestampFormateado,
      speed_limit_kmh,
      current_speed_kmh,
      lpNumber,
      lpType: filteredLpType,
    };
console.log('[sendSpeedEvent] Enviando payloadd:', JSON.stringify(payload, null, 2));
    try {
      const response = await axios.post(urlProcessedPhoto, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Permite manejar manualmente el status
      });
      console.log('[sendSpeedEvent] Respuesta del endpoint:', response.status, response.data);
      // Solo si el POST fue exitoso (2xx) y se pasó photoId, elimina la foto
      if (response.status >= 200 && response.status < 300) {
        console.log('[sendSpeedEvent] Valor de photoId recibido:', photoId, 'Tipo:', typeof photoId);
        if (photoId !== undefined && photoId !== null) {
          console.log('[sendSpeedEvent] Eliminando foto con ID:', photoId);
          try {
            await this.photoService.deletePhotoAndFile(Number(photoId));
            console.log('[sendSpeedEvent] Foto eliminada correctamente:', photoId);
          } catch (err) {
            console.error('[sendSpeedEvent] Error al eliminar foto:', photoId, (err as any)?.message || err);
            throw err;
          }
        } else {
          console.warn('[sendSpeedEvent] photoId no proporcionado, no se elimina ninguna foto');
        }
        return response.data;
      } else {
        throw new Error(`POST falló con status ${response.status}: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      // Si falla el POST, no elimina la foto
      console.error('[sendSpeedEvent] Error al enviar el evento de velocidad:', error);
      throw new Error(
        `Error al enviar el evento de velocidad: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // Obtener todas las fotos procesadas
  async findAll(): Promise<ProcessedPhoto[]> {
    return this.processedPhotoRepository.find({
      relations: ['photo', 'user', 'rejectionReason'],
    });
  }

  // Obtener una foto procesada por su ID
  async findOne(id: number): Promise<ProcessedPhoto> {
    return this.processedPhotoRepository.findOne({
      where: { id },
      relations: ['photo', 'user', 'rejectionReason'],
    });
  }
}
