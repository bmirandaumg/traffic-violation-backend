import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PhotoProcessing } from './photo-processing.entity';
import { RejectionReason } from '../rejection-reason/rejection-reason.entity';

@Entity('photo_rejection')
export class PhotoRejection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'processing_id' })
  processingId: number;

  @Column({ name: 'rejection_reason_id' })
  rejectionReasonId: number;

  // Relaciones
  @ManyToOne(() => PhotoProcessing)
  @JoinColumn({ name: 'processing_id' })
  processing: PhotoProcessing;

  @ManyToOne(() => RejectionReason)
  @JoinColumn({ name: 'rejection_reason_id' })
  rejectionReason: RejectionReason;
}