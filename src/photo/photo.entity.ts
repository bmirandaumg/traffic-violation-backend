import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cruise } from '../cruise/entities/cruise.entity';
@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  photo_date: Date;

  @Column()
  photo_name: string;

  @Column()
  photo_path: string;

  @Column({ default: 0 })
  id_photo_status: number;

  @Column({ nullable: true })
  locked_by: number;

  @Column({ nullable: true })
  locked_at: Date;

  @Column()  // Este campo asegura el mapeo directo del ID de Cruise
  id_cruise: number;

  @ManyToOne(() => Cruise, (cruise) => cruise.photos)
  @JoinColumn({ name: 'id_cruise' })  // Une la relación usando id_cruise
  cruise: Cruise;

  @Column({ type: 'jsonb', default: {} })
  photo_info: any;
}
