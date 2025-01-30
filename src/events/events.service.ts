import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../services/cloudinary.service';
import { Event } from './schemas/event.schema';
import { User } from '../users/schemas/user.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private notifiedEvents = new Set<string>();

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationsService: NotificationsService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.setupStatusUpdateJob();
  }

  private setupStatusUpdateJob() {
    setInterval(() => this.updateEventStatuses(), 1000 * 60 * 60);
  }

  private async updateEventStatuses() {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(
        now.getTime() + 24 * 60 * 60 * 1000,
      );

      await this.eventModel
        .updateMany(
          {
            date: { $lt: now },
            status: { $ne: 'completed' },
          },
          {
            $set: { status: 'completed' },
          },
        )
        .exec();

      await this.eventModel
        .updateMany(
          {
            date: {
              $gt: now,
              $lte: twentyFourHoursFromNow,
            },
            status: 'upcoming',
          },
          {
            $set: { status: 'ongoing' },
          },
        )
        .exec();

      await this.eventModel
        .updateMany(
          {
            date: { $gt: twentyFourHoursFromNow },
            status: { $ne: 'upcoming' },
          },
          {
            $set: { status: 'upcoming' },
          },
        )
        .exec();

      const updatedEvents = await this.eventModel
        .find({
          $or: [{ status: 'ongoing' }, { status: 'completed' }],
        })
        .exec();

      for (const event of updatedEvents) {
        const notificationKey = `${event._id}-${event.status}`;
        if (!this.notifiedEvents.has(notificationKey)) {
          await this.notifyStatusChange(event);
          this.notifiedEvents.add(notificationKey);
        }
      }
    } catch (error) {
      this.logger.error(`Error updating event statuses: ${error.message}`);
    }
  }

  private async notifyStatusChange(event: Event) {
    const message = this.getStatusChangeMessage(event);
    if (!message) return;

    try {
      await this.notificationsService.createNotification({
        userId: event.organizer,
        message,
        type: 'event_status_change',
        data: { eventId: event._id, status: event.status },
      });

      const notifiedUsers = new Set([event.organizer]);
      for (const participant of event.participants) {
        if (!notifiedUsers.has(participant)) {
          await this.notificationsService.createNotification({
            userId: participant,
            message,
            type: 'event_status_change',
            data: { eventId: event._id, status: event.status },
          });
          notifiedUsers.add(participant);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending notifications: ${error.message}`);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await this.eventModel.findByIdAndDelete(id).exec();
      this.notifiedEvents.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting event: ${error.message}`);
      throw error;
    }
  }

  private getStatusChangeMessage(event: Event): string | null {
    switch (event.status) {
      case 'ongoing':
        return `Your event "${event.name}" is starting soon!`;
      case 'completed':
        return `Your event "${event.name}" has been completed.`;
      default:
        return null;
    }
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    try {
      let imageUrl = null;
      if (createEventDto.image) {
        imageUrl = await this.cloudinaryService.uploadImage(createEventDto.image);
      }
  
      const dateTime = new Date(createEventDto.date);
      const time = createEventDto.time || '00:00';
      const [hours, minutes] = time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));
  
      const newEvent = new this.eventModel({
        ...createEventDto,
        image: imageUrl,
        date: dateTime,
        time: time,
        status: 'upcoming'
      });
  
      const savedEvent = await newEvent.save();
  
      // Notify followers about the new event
      const organizer = await this.userModel.findOne({
        username: createEventDto.organizer,
      });
      
      if (organizer?.followers?.length) {
        for (const follower of organizer.followers) {
          await this.notificationsService.createNotification({
            userId: follower,
            message: `${createEventDto.organizer} has created a new event: ${createEventDto.name}`,
            type: 'new_event',
            data: { eventId: savedEvent._id }
          });
        }
      }
  
      return savedEvent;
    } catch (error) {
      this.logger.error(`Error creating event: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<Event[]> {
    await this.updateEventStatuses();
    return this.eventModel.find().sort({ date: 1 }).exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    username: string,
  ): Promise<Event> {
    const event = await this.findOne(id);
    if (event.organizer !== username) {
      throw new ForbiddenException('You are not the organizer of this event');
    }
    Object.assign(event, updateEventDto);
    return event.save();
  }

  async remove(id: string, username: string): Promise<Event> {
    const event = await this.findOne(id);
    if (event.organizer !== username) {
      throw new ForbiddenException('You are not the organizer of this event');
    }
    return this.eventModel.findByIdAndDelete(id).exec();
  }

  async register(eventId: string, username: string): Promise<Event> {
    const event = await this.findOne(eventId);

    if (event.status === 'completed') {
      throw new ForbiddenException('Cannot register for completed events');
    }

    if (!event.participants.includes(username)) {
      event.participants.push(username);
      await event.save();

      await this.notificationsService.createNotification({
        userId: event.organizer,
        message: `${username} has registered for your event: ${event.name}`,
        type: 'event_registration',
        data: { eventId: event._id },
      });

      await this.userModel.findOneAndUpdate(
        { username },
        { $push: { attendedEvents: eventId } },
      );
    }

    return event;
  }

  async unregister(eventId: string, username: string): Promise<Event> {
    const event = await this.findOne(eventId);
    event.participants = event.participants.filter((user) => user !== username);
    await event.save();

    // Remove from user's attended events
    await this.userModel.findOneAndUpdate(
      { username },
      { $pull: { attendedEvents: eventId } },
    );

    return event;
  }
}
