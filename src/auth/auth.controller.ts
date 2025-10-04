import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';


@Controller('auth')  // Define la base /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint de login
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(loginDto.username, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
        // Modificado para devolver access_token y refresh_token
        const loginResult = await this.authService.login(user);
        const refreshToken = await this.authService.generateRefreshToken(user);
        return {
          ...loginResult,
          refresh_token: refreshToken,
        };
    } catch (error) {
      console.error('Error during login:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    try {
      return await this.authService.refreshAccessToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }
  
}
