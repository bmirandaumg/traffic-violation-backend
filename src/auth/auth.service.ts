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

  async generateRefreshToken(user: any): Promise<string> {
    const payload = {sub: user.id, username: user.username};
    return this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '1d',
      secret: process.env.JWT_REFRESH_SECRET,
    }); // El refresh token dura 7 días
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');
      const accessToken = this.jwtService.sign(
        { username: user.username, sub: user.id, role: user.role },
        { expiresIn: '1h', secret: process.env.JWT_SECRET }
      );
      return { access_token: accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
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