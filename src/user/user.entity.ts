import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('user_e')  // Nombre de la tabla en la base de datos
export class UserE {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;  // Nombre de usuario

  @Column()
  password: string;  // Contraseña encriptada

  @Column({ unique: true })
  email: string;  // Correo electrónico único

  // Relación muchos a uno con la tabla "role"
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })  // Relaciona con el campo "role_id" en la tabla "user_e"
  role: Role;
}