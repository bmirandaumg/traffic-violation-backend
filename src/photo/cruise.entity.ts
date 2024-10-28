import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Photo } from './photo.entity';

@Entity('cruise')  // Nombre de la tabla
export class Cruise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cruise_name: string;

  // Relación uno a muchos con la tabla "photo"
  @OneToMany(() => Photo, (photo) => photo.cruise)
  photos: Photo[];
}