import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards, SetMetadata } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './role.guard';

@SetMetadata('roles', ['admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async registerUser(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('email') email: string,
    @Body('roleId') roleId: number,
  ) {
    try {
      return await this.userService.createUser(username, password, email, roleId);
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error('Error registering user');
    }
  }

  //Endpoint to list roles
  @Get('roles')
async getAllRoles() {
  return this.userService.getAllRoles();
}

  // Endpoint para buscar por username
  @Get('find-by-username')
  async findByUsername(@Query('username') username: string) {
    try {
      return await this.userService.findByUsername(username);
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Error finding user by username');
    }
  }

  // Endpoint para buscar por ID
  @Get(':id')
  async findById(@Param('id') id: number) {
    try {
      return await this.userService.findById(id);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Error finding user by ID');
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<void> {
    try {
      await this.userService.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error deleting user');
    }
  }
}
