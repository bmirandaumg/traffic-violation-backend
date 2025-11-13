
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserE } from './user.entity';
import { Role } from './role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserE)
    private readonly userRepository: Repository<UserE>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // Función para hashear la contraseña
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Crear un nuevo usuario y hashear la contraseña antes de guardarlo
  async createUser(username: string, plainPassword: string, email: string, roleId: number): Promise<UserE> {
    try {
      const hashedPassword = await this.hashPassword(plainPassword);
      // Busca el rol por id
      const role = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!role) throw new InternalServerErrorException('Role not found');
      const newUser = this.userRepository.create({ username, password: hashedPassword, email, role });
      return this.userRepository.save(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Error creating user');
    }
  }

    async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }
  
    async deleteUser(username:string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.userRepository.remove(user);
  }

  // Encontrar un usuario por su nombre de usuario
  async findByUsername(username: string): Promise<UserE | undefined> {
    try {
      const user = await this.userRepository.findOne({ where: { username } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new InternalServerErrorException('Error finding user by username');
    }
  }


  // Encontrar un usuario por su ID
  async findById(id: number): Promise<UserE | undefined> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new InternalServerErrorException('Error finding user by ID');
    }
  }

  // Obtener los roles de un usuario por su ID
  async getUserRoles(userId: number): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],  // Asegúrate de cargar la relación de roles
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Devuelve los nombres de los roles
    return [user.role.name];  // Ajusta si tienes varios roles
  }

}
