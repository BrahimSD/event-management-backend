import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { LoggerMiddleware } from './logger.middleware';
import { ChatModule } from './chat/chat.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CloudinaryModule } from './services/cloudinary.module';
import { CarsharingModule } from './carsharing/carsharing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    CloudinaryModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ChatModule,
    CarsharingModule,
    AppConfigModule,
    NotificationsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}