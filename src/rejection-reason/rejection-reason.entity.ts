import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProcessedPhoto } from '../processed-photo/processed-photo.entity';

@Entity('rejection_reason')  // Nombre de la tabla en la base de datos
export class RejectionReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;  // Descripción del motivo de rechazo

  // Relación uno a muchos con la tabla "processed_photo"
  @OneToMany(() => ProcessedPhoto, (processedPhoto) => processedPhoto.rejectionReason)
  processedPhotos: ProcessedPhoto[];  // Fotos que fueron rechazadas con este motivo
}
