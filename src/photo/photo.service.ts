import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, LessThanOrEqual } from 'typeorm';
import { Photo } from './photo.entity';
import { PhotoGateway } from './photo.gateway';
import { addHours } from 'date-fns';


@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly photoGateway: PhotoGateway,  // Inyecta el gateway
  ) {}

  async getFilteredPhotos(
    photoDate: string,
    idCruise: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Photo[], number]> {
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;
    const oneHourAgo = addHours(new Date(), -1);

// Verificar los valores de entrada

return this.photoRepository.createQueryBuilder('photo')
  .where('photo.photo_date = :photoDate', { photoDate })
  .andWhere('photo.id_cruise = :idCruise', { idCruise })  // Filtro directo sobre id_cruise
  .andWhere('photo.id_photo_status = :status', { status: 0 }) 
  .andWhere('(photo.locked_by IS NULL AND (photo.locked_at IS NULL OR photo.locked_at <= :oneHourAgo))', { oneHourAgo })
  .skip(skip)
  .take(limit)
  .getManyAndCount();
  }

  async lockPhoto(photoId: number, userId: number): Promise<void> {
    await this.photoRepository.update(photoId, {
      locked_by: userId,
      locked_at: new Date(),
    });

    // Emite el evento para actualizar a los usuarios
    this.photoGateway.notifyPhotoLockUpdate(photoId, true);
  }

  async unlockPhoto(photoId: number): Promise<void> {
    await this.photoRepository.update(photoId, {
      locked_by: null,
      locked_at: null,
    });

    // Emite el evento para actualizar a los usuarios
    this.photoGateway.notifyPhotoLockUpdate(photoId, false);
  }
}
