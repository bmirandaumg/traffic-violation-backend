import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserE } from './user.entity';
import { Role } from './role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserE, Role])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],  // Asegúrate de exportar UserService
})
export class UserModule {}
