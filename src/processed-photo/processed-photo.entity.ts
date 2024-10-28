import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Photo } from '../photo/photo.entity';
import { UserE } from '../user/user.entity';
import { RejectionReason } from '../rejection-reason/rejection-reason.entity';

@Entity('processed_photo')  // Nombre de la tabla en la base de datos
export class ProcessedPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Photo)
  @JoinColumn({ name: 'id_photo' })  // Llave foránea a la tabla "photo"
  photo: Photo;

  @ManyToOne(() => UserE)
  @JoinColumn({ name: 'id_user' })  // Llave foránea a la tabla "user_e" (usuario)
  user: UserE;

  @Column()
  start_time: Date;  // Cuándo comenzó el procesamiento de la foto

  @Column({ nullable: true })
  end_time: Date;  // Cuándo finalizó el procesamiento

  @ManyToOne(() => RejectionReason, { nullable: true })
  @JoinColumn({ name: 'id_rejection_reason' })  // Llave foránea opcional a la tabla "rejection_reason"
  rejectionReason: RejectionReason;  // Motivo de rechazo si el procesamiento no fue exitoso
}
