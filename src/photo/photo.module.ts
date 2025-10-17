import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';
import { PhotoGateway } from './photo.gateway';
import { Cruise } from '../cruise/entities/cruise.entity';
import { PhotoStatus } from './photo-status.entity';

import { UserE } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Cruise, PhotoStatus, UserE])],
  providers: [PhotoService, PhotoGateway],
  controllers: [PhotoController],
  exports: [TypeOrmModule, PhotoService],
})
export class PhotoModule {}
