import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ required: true })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);