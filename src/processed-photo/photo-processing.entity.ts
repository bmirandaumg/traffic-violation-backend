import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Photo } from '../photo/photo.entity';
import { UserE } from '../user/user.entity';

@Entity('photo_processing')
export class PhotoProcessing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_photo' })
  idPhoto: number;

  @Column({ name: 'id_user' })
  idUser: number;

  @Column({ name: 'start_time' })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ name: 'processing_type', length: 20 })
  processingType: 'success' | 'rejected';

  // Relaciones
  @ManyToOne(() => Photo)
  @JoinColumn({ name: 'id_photo' })
  photo: Photo;

  @ManyToOne(() => UserE)
  @JoinColumn({ name: 'id_user' })
  user: UserE;
}