import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { UserE } from '../user/user.entity';
import { UserController } from '../user/user.controller';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // Extrae el token del encabezado Authorization
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),  // Secreto de firma definido en el archivo .env
    });
  }

  // Valida el token JWT y obtiene el usuario correspondiente
  async validate(payload: any): Promise<UserE> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}