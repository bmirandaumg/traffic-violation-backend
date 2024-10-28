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
      return this.authService.login(user);
    } catch (error) {
      console.error('Error during login:', error);
      throw new UnauthorizedException('Login failed');
    }
  }
}
