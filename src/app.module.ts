import { Module } from '@nestjs/common';
import { PhotoModule } from './photo/photo.module.js';
import { ProcessedPhotoModule } from './processed-photo/processed-photo.module';
import { RejectionReasonModule } from './rejection-reason/rejection-reason.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CruiseModule } from './cruise/cruise.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    PhotoModule,
    ProcessedPhotoModule,
    RejectionReasonModule,
    UserModule,
    AuthModule,
    DatabaseModule,
    CruiseModule,
  ],
})
export class AppModule {}
