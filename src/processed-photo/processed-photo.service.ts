import { Injectable } from '@nestjs/common';
import { PhotoService } from '../photo/photo.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotoProcessing } from './photo-processing.entity';
import { PhotoSuccess } from './photo-success.entity';
import { PhotoRejection } from './photo-rejection.entity';
import { Photo } from '../photo/photo.entity';
import { UserE } from '../user/user.entity';
import axios from 'axios';

@Injectable()
export class ProcessedPhotoService {
  constructor(
    @InjectRepository(PhotoProcessing)
    private readonly photoProcessingRepository: Repository<PhotoProcessing>,
    @InjectRepository(PhotoSuccess)
    private readonly photoSuccessRepository: Repository<PhotoSuccess>,
    @InjectRepository(PhotoRejection)
    private readonly photoRejectionRepository: Repository<PhotoRejection>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(UserE)
    private readonly userRepository: Repository<UserE>,
    private readonly photoService: PhotoService,
  ) {}

  // Enviar evento de velocidad al endpoint externo - Solo responsabilidad HTTP
  async sendSpeedEvent(
    cruise: string,
    timestamp: string,
    speed_limit_kmh: number,
    current_speed_kmh: number,
    lpNumber: string,
    lpType: string,
  ): Promise<{ success: boolean, trafficFineId?: number, payload?: any, errorMessage?: string }> {

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

    console.log('[sendSpeedEvent] Enviando payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await axios.post(urlProcessedPhoto, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Permite manejar manualmente el status
      });
      
      console.log('[sendSpeedEvent] Respuesta del endpoint:', response.status, response.data);
      
      // Solo si el POST fue exitoso (2xx), retornar datos de éxito
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          trafficFineId: response.data?.trafficFineId,
          payload: payload
        };
      } else {
        return {
          success: false,
          errorMessage: `POST falló con status ${response.status}: ${JSON.stringify(response.data)}`
        };
      }
    } catch (error) {
      // Si falla el POST, retornar error
      console.error('[sendSpeedEvent] Error al enviar el evento de velocidad:', error);
      return {
        success: false,
        errorMessage: `Error al enviar el evento de velocidad: ${error.response?.data?.message || error.message}`
      };
    }
  }

  // Procesar foto exitosa - Persiste en base de datos y elimina archivo
  async processSuccessfulPhoto(
    photoId:number,
    trafficFineId: number,
    payload: any,
    userId: number
  ): Promise<void> {
    const processedBy = await this.userRepository.findOne({ where: { id: userId } });
    if (!processedBy) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo) {
      throw new Error(`Foto con ID ${photoId} no encontrada`);
    }
    try {
      // 1. Crear registro en photo_processing
      const photoProcessing = this.photoProcessingRepository.create({
        idPhoto: photo.id,
        idUser: processedBy.id,
        startTime: photo.locked_at,
        endTime: new Date(),
        processingType: 'success'
      });

      const savedProcessing = await this.photoProcessingRepository.save(photoProcessing);

      // 2. Crear registro en photo_success
      const photoSuccess = this.photoSuccessRepository.create({
        processingId: savedProcessing.id,
        trafficFineId: trafficFineId,
        speedEventPayload: payload
      });

      await this.photoSuccessRepository.save(photoSuccess);

      // 3. Actualizar el status de la foto a procesada
      await this.photoRepository.update(photo.id, { 
        id_photo_status: 1 // Asumiendo que 3 es "procesada exitosamente"
      });

      // 4. Eliminar archivo físico
      await this.photoService.deletePhotoAndFile(photo.id);

      console.log(`[processSuccessfulPhoto] Foto ${photo.id} procesada exitosamente`);

    } catch (error) {
      console.error(`[processSuccessfulPhoto] Error al procesar foto ${photo.id}:`, error);
      throw new Error(`Error al procesar foto exitosa: ${error.message}`);
    }
  }

  // Procesar foto rechazada - Persiste en base de datos
  async processRejectedPhoto(
    photoId: number,
    rejectionReasonId: number,
    userId: number 
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo) {
      throw new Error(`Foto con ID ${photoId} no encontrada`);
    }
    if (photo.id_photo_status !== 0) {
      throw new Error(`La foto con ID ${photoId} no está en estado 'pendiente' y no puede ser rechazada.`);
    }
    try {
      // 1. Crear registro en photo_processing
      const photoProcessing = this.photoProcessingRepository.create({
        idPhoto: photo.id,
        idUser: user.id,
        startTime: photo.locked_at,
        endTime: new Date(),
        processingType: 'rejected'
      });

      const savedProcessing = await this.photoProcessingRepository.save(photoProcessing);

      // 2. Crear registro en photo_rejection
      const photoRejection = this.photoRejectionRepository.create({
        processingId: savedProcessing.id,
        rejectionReasonId: rejectionReasonId
      });



      await this.photoRejectionRepository.save(photoRejection);

      // 3. Actualizar el status de la foto a rechazada
      await this.photoRepository.update(photo.id, { 
        id_photo_status: 2 // Asumiendo que 2 es "rechazada"
      });

      await this.photoService.deletePhotoAndFile(photo.id);

      console.log(`[processRejectedPhoto] Foto ${photo.id} marcada como rechazada`);

    } catch (error) {
      console.error(`[processRejectedPhoto] Error al procesar foto rechazada ${photo.id}:`, error);
      throw new Error(`Error al procesar foto rechazada: ${error.message}`);
    }
  }

  // Obtener todas las fotos procesadas
  async findAll(): Promise<PhotoProcessing[]> {
    return this.photoProcessingRepository.find({
      relations: ['photo', 'user']
    });
  }

  // Obtener una foto procesada por ID
  async findOne(id: number): Promise<PhotoProcessing> {
    return this.photoProcessingRepository.findOne({
      where: { id },
      relations: ['photo', 'user']
    });
  }
    /**
     * Orquesta el procesamiento exitoso de una multa:
     * 1. Llama a sendSpeedEvent
     * 2. Elimina la foto física
     * 3. Registra el procesamiento exitoso
     * Devuelve mensaje de éxito si todo sale bien
     */
    async processTrafficFine(
      photoId: number,
      userId: number,
      speedEventParams: {
        cruise: string,
        timestamp: string,
        speed_limit_kmh: number,
        current_speed_kmh: number,
        lpNumber: string,
        lpType: string
      }
  ): Promise<{ photoProcessed: boolean; message: string }> {
      // 1. Llamar a sendSpeedEvent
    const validatedPhotoStatus = await this.photoRepository.findOne({ where: { id: photoId } });
    if (validatedPhotoStatus?.id_photo_status !== 0) 
      throw new Error(`La foto con ID ${photoId} no está en estado 'pendiente' y no puede ser procesada.`);


      const result = await this.sendSpeedEvent(
        speedEventParams.cruise,
        speedEventParams.timestamp,
        speedEventParams.speed_limit_kmh,
        speedEventParams.current_speed_kmh,
        speedEventParams.lpNumber,
        speedEventParams.lpType
      );

      if (!result.success) {
        throw new Error(result.errorMessage || 'Error al enviar evento de velocidad');
      }

      // 2. Eliminar archivo físico
      await this.photoService.deletePhotoAndFile(photoId);

      // 3. Registrar procesamiento exitoso
      await this.processSuccessfulPhoto(photoId, result.trafficFineId, result.payload, userId);

      return {
        photoProcessed: true,
        message: 'Traffic fine processed successfully'
      };
    }
}