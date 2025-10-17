import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('rejection_reason')  // Nombre de la tabla en la base de datos
export class RejectionReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;  // Descripción del motivo de rechazo

}
