import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RejectionReason } from './rejection-reason.entity';
import { RejectionReasonService } from './rejection-reason.service';
import { RejectionReasonController } from './rejection-reason.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RejectionReason])],
  providers: [RejectionReasonService],
  controllers: [RejectionReasonController],
  exports: [RejectionReasonService], // Exporta el servicio si es necesario en otros módulos
})
export class RejectionReasonModule {}
