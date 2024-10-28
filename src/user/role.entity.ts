import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserE } from './user.entity';

@Entity('role')  // Nombre de la tabla en la base de datos
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;  // Nombre del rol, por ejemplo "Digitador" o "Administrador"

  @Column()
  description: string;  // Descripción del rol

  // Relación uno a muchos con la tabla "user_e"
  @OneToMany(() => UserE, (user) => user.role)
  users: UserE[];  // Usuarios que tienen este rol
}
