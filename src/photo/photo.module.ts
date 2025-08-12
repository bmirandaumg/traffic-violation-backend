import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';
import { PhotoGateway } from './photo.gateway';
import { ProcessedPhoto } from '../processed-photo/processed-photo.entity';
import { PhotoRejected } from '../processed-photo/photo-rejected.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, ProcessedPhoto, PhotoRejected])],
  providers: [PhotoService, PhotoGateway],
  controllers: [PhotoController],
  exports: [TypeOrmModule], // Exporta el repositorio de Photo para que otros módulos puedan usarlo
})
export class PhotoModule {}
