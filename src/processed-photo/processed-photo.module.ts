import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedPhoto } from './processed-photo.entity';
import { ProcessedPhotoService } from './processed-photo.service';
import { ProcessedPhotoController } from './processed-photo.controller';
import { UserE } from '../user/user.entity';
import { PhotoModule } from '../photo/photo.module'; // Importa PhotoModule

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessedPhoto, UserE]),
    PhotoModule,  // Asegúrate de importar PhotoModule para usar el repositorio de Photo
  ],
  providers: [ProcessedPhotoService],
  controllers: [ProcessedPhotoController],
})
export class ProcessedPhotoModule {}
