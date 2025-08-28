import { Injectable } from '@nestjs/common';
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
    cruise:string,
    timestamp:string,
    speed_limit_kmh:number,
    current_speed_kmh:number,
    lpNumber:string,
    lpType:string,
  ): Promise<void> {
    const urlProcessedPhoto = process.env.SPEED_EVENTS_URL;
    const payload = {
      cruise,
      timestamp,
      speed_limit_kmh,
      current_speed_kmh,
      lpNumber,
      lpType,
    };

    try{
      const response = await axios.post(urlProcessedPhoto, payload,{
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    }catch (error) {
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
