import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),  // Llave secreta definida en el archivo .env
        signOptions: { expiresIn: '1h' },  // El token expira en 1 hora
      }),
    }),
    UserModule,  // Importa el módulo de usuario para validación de credenciales
  ],
  providers: [AuthService, JwtStrategy],  // Servicio de autenticación y estrategia de JWT
  controllers: [AuthController],
  exports: [AuthService],  // Exporta el servicio de autenticación
})
export class AuthModule {}
