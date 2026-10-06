import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.ts';
import { UsersModule } from './users/users.module.ts';
import { AuthModule } from './auth/auth.module.ts';
import { PassportConfigModule } from './auth/passport-config.module.ts';
import { EquipmentModule } from './equipment/equipment.module.ts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        database: configService.getOrThrow<string>('DB_NAME'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    PassportConfigModule,
    UsersModule,
    AuthModule,
    EquipmentModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
