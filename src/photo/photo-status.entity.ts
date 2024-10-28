import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PhotoStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;
}