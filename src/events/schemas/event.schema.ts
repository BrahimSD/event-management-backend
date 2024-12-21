import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Event extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  organizer: string;

  @Prop()
  image: string;

  @Prop({ type: [String], default: [] })
  participants: string[];
}

export const EventSchema = SchemaFactory.createForClass(Event);