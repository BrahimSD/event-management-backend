import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Event } from '../../events/schemas/event.schema';

class GeoPoint {
  lat: number;
  lng: number;
}

@Schema({ timestamps: true })
export class CarSharing extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  driver: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event: MongooseSchema.Types.ObjectId;
  
  @Prop({ required: true })
  eventName: string;

  @Prop({ required: true })
  eventLocation: string;

  @Prop()
  eventDate: Date;
  
  @Prop({ type: Object })
  eventCoords: GeoPoint;

  @Prop({ default: 4 })
  seats: number;

  @Prop({ required: true })
  departureLocation: string;

  @Prop({ type: Object })
  departureCoords: GeoPoint;

  @Prop({ required: true })
  departureTime: Date;

  @Prop({ default: true })
  available: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  passengers: MongooseSchema.Types.ObjectId[];
}

export const CarSharingSchema = SchemaFactory.createForClass(CarSharing);

// Index pour performance
CarSharingSchema.index({ driver: 1, event: 1 }, { unique: true });