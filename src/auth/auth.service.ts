import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserE } from '../user/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // Valida las credenciales del usuario
  async validateUser(username: string, password: string): Promise<UserE | null> {
    try {
      const user = await this.userService.findByUsername(username);
      if (user && await bcrypt.compare(password, user.password)) {
        return user;
      }
      throw new UnauthorizedException('Invalid credentials');
    } catch (error) {
      console.error('Error validating user:', error);
      throw new InternalServerErrorException('Error during validation');
    }
  }

  // Genera el JWT después de validar al usuario
  async login(user: UserE) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),  // Retorna el JWT firmado
      email: user.email,
      username: user.username,
    };
  }
}