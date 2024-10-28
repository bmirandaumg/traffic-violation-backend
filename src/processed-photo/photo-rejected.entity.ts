import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ProcessedPhoto } from '../processed-photo/processed-photo.entity';
import { RejectionReason } from '../rejection-reason/rejection-reason.entity';

@Entity('photo_rejected')
export class PhotoRejected {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProcessedPhoto, (processedPhoto) => processedPhoto.id, { nullable: false })
  processedPhoto: ProcessedPhoto;

  @ManyToOne(() => RejectionReason, (rejectionReason) => rejectionReason.id, { nullable: false })
  rejectionReason: RejectionReason;
}
