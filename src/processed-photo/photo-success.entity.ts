import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PhotoProcessing } from './photo-processing.entity';

@Entity('photo_success')
export class PhotoSuccess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'processing_id' })
  processingId: number;

  @Column({ name: 'traffic_fine_id', nullable: true })
  trafficFineId: number;

  @Column({ name: 'speed_event_payload', type: 'jsonb', nullable: true })
  speedEventPayload: any;

  // Relaciones
  @ManyToOne(() => PhotoProcessing)
  @JoinColumn({ name: 'processing_id' })
  processing: PhotoProcessing;
}