import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, default: '00:00' })
  time: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  organizer: string;

  @Prop()
  image: string;

  @Prop({ type: [String], default: [] })
  participants: string[];

  @Prop({ 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  })
  status: EventStatus;

  get dateTime(): Date {
    const [hours, minutes] = this.time.split(':');
    const dateTime = new Date(this.date);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    return dateTime;
  }
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Add method to check if registration is allowed
EventSchema.methods.canRegister = function(): boolean {
  return this.status !== 'completed';
};

// Add middleware to automatically update status before each save
EventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDateTime = this.dateTime;

  if (eventDateTime < now) {
    this.status = 'completed';
  } else {
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    this.status = eventDateTime <= twentyFourHoursFromNow ? 'ongoing' : 'upcoming';
  }
  next();
});

// Add middleware to update status before each find
EventSchema.pre('find', async function(next) {
  const now = new Date();
  
  // Update completed events
  await this.model.updateMany(
    {
      date: { $lt: now },
      status: { $ne: 'completed' }
    },
    {
      $set: { status: 'completed' }
    }
  );

  // Update ongoing events
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await this.model.updateMany(
    {
      date: { 
        $gt: now,
        $lte: twentyFourHoursFromNow 
      },
      status: 'upcoming'
    },
    {
      $set: { status: 'ongoing' }
    }
  );

  next();
});