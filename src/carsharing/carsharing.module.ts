import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarsharingService } from './carsharing.service';
import { CarsharingController } from './carsharing.controller';
import { CarSharing, CarSharingSchema } from './schemas/carsharing.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarSharing.name, schema: CarSharingSchema },
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema }
    ]),
    EventsModule
  ],
  controllers: [CarsharingController],
  providers: [CarsharingService],
  exports: [CarsharingService]
})
export class CarsharingModule {}