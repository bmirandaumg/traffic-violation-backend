import { Module } from '@nestjs/common';
import { PhotoModule } from './photo/photo.module.js';
import { ProcessedPhotoModule } from './processed-photo/processed-photo.module';
import { RejectionReasonModule } from './rejection-reason/rejection-reason.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    PhotoModule,
    ProcessedPhotoModule,
    RejectionReasonModule,
    UserModule,
    AuthModule,
    DatabaseModule,
  ],
})
export class AppModule {}
