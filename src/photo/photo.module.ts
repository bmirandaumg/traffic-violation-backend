import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';
import { PhotoGateway } from './photo.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  providers: [PhotoService, PhotoGateway],
  controllers: [PhotoController],
  exports: [TypeOrmModule], // Exporta el repositorio de Photo para que otros módulos puedan usarlo
})
export class PhotoModule {}
