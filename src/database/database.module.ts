import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Cargar configuración desde archivos .env
    ConfigModule.forRoot({
      isGlobal: true, // Hace que la configuración esté disponible globalmente
    }),

    // Conexión con la base de datos usando TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        autoLoadEntities: true, // Encuentra las entidades
        synchronize: true, // Cambia a `false` en producción
      }),
    }),
  ],
})
export class DatabaseModule {}
