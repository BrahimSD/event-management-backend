import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class NotificationSettings extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ default: true })
  eventReminders: boolean;

  @Prop({ default: true })
  registrationConfirmation: boolean;

  @Prop({ default: true })
  newEventsFromFollowed: boolean;
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);