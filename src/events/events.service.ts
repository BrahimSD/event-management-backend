import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const newEvent = new this.eventModel(createEventDto);
    return newEvent.save();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, username: string): Promise<Event> {
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
    if (!event.participants.includes(username)) {
      event.participants.push(username);
      return event.save();
    }
    return event;
  }

  async unregister(eventId: string, username: string): Promise<Event> {
    const event = await this.findOne(eventId);
    event.participants = event.participants.filter((user) => user !== username);
    return event.save();
  }
}