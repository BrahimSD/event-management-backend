import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigController } from './config.controller';

@Module({
  imports: [NestConfigModule],
  controllers: [ConfigController],
})
export class ConfigModule {}