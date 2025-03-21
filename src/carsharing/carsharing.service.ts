import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CarSharing } from './schemas/carsharing.schema';
import { User } from '../users/schemas/user.schema';
import { Event } from '../events/schemas/event.schema';
import { EventsService } from '../events/events.service';
import { DriverResponse } from './interfaces/driver.interface';

@Injectable()
export class CarsharingService {
  constructor(
    @InjectModel(CarSharing.name) private carsharingModel: Model<CarSharing>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    private eventsService: EventsService,
  ) {}

  async createOrUpdateCarSharing(
    username: string,
    carSharingData: any,
  ): Promise<CarSharing> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const event = await this.eventModel.findById(carSharingData.eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.participants.includes(username)) {
      throw new ConflictException(
        'You must be registered for the event to offer a ride',
      );
    }

    let carsharing = await this.carsharingModel
      .findOne({
        driver: user._id,
        event: event._id,
      })
      .exec();

    if (!carsharing) {
      carsharing = new this.carsharingModel({
        driver: user._id,
        event: event._id,
        eventName: event.name,
        eventLocation: event.location,
        eventDate: event.date,
        seats: carSharingData.seats || 4,
        departureLocation: carSharingData.departureLocation || user.location,
        departureCoords: carSharingData.departureCoords,
        departureTime: carSharingData.departureTime || new Date(),
        available: true,
        passengers: [],
      });
    } else {
      carsharing.seats = carSharingData.seats || carsharing.seats;
      carsharing.departureLocation =
        carSharingData.departureLocation || carsharing.departureLocation;
      carsharing.departureCoords =
        carSharingData.departureCoords || carsharing.departureCoords;
      carsharing.departureTime =
        carSharingData.departureTime || carsharing.departureTime;
      carsharing.available = true;
    }

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { hasCar: true } },
    );

    return carsharing.save();
  }

  async deleteCarSharing(username: string, eventId: string): Promise<void> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const result = await this.carsharingModel
      .deleteOne({
        driver: user._id,
        event: event._id,
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Car sharing offer not found');
    }

    const otherOfferings = await this.carsharingModel
      .countDocuments({ driver: user._id })
      .exec();
    if (otherOfferings === 0) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { hasCar: false } },
      );
    }
  }

  async getDrivers(eventId?: string): Promise<DriverResponse[]> {
    try {
      let query = {};
      if (eventId) {
        query = { event: eventId };
      }

      const carSharings = await this.carsharingModel
        .find(query)
        .populate('driver', 'username avatar location')
        .populate('event', 'name location date')
        .exec();

      return this.mapCarSharingsToDriverResponses(carSharings);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return [];
    }
  }

  async getDriversForEvent(eventId: string): Promise<DriverResponse[]> {
    return this.getDrivers(eventId);
  }

  async joinRide(username: string, carsharingId: string): Promise<CarSharing> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const carsharing = await this.carsharingModel.findById(carsharingId).exec();
    if (!carsharing) {
      throw new NotFoundException('Car sharing offer not found');
    }

    if (carsharing.passengers.length >= carsharing.seats) {
      throw new ConflictException('No seats available');
    }

    const isAlreadyJoined = carsharing.passengers.some(
      (p) => p.toString() === user._id.toString(),
    );

    if (isAlreadyJoined) {
      throw new ConflictException('You are already in this ride');
    }

    await this.carsharingModel.updateOne(
      { _id: carsharing._id },
      { $push: { passengers: user._id } },
    );

    return this.carsharingModel.findById(carsharingId).exec();
  }

  async leaveRide(username: string, carsharingId: string): Promise<CarSharing> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const carsharing = await this.carsharingModel.findById(carsharingId).exec();
    if (!carsharing) {
      throw new NotFoundException('Car sharing offer not found');
    }

    await this.carsharingModel.updateOne(
      { _id: carsharing._id },
      { $pull: { passengers: user._id } },
    );

    return this.carsharingModel.findById(carsharingId).exec();
  }

  private mapCarSharingsToDriverResponses(
    carSharings: any[],
    includePassengers = false,
  ): DriverResponse[] {
    return carSharings.map((cs) => {
      const passengersCount = cs.passengers ? cs.passengers.length : 0;
      const availableSeats = Math.max(0, cs.seats - passengersCount);

      const driverResponse: DriverResponse = {
        _id: cs._id.toString(),
        username:
          cs.driver['username'] ||
          (typeof cs.driver === 'string' ? cs.driver : ''),
        avatar: cs.driver['avatar'] || 'assets/default-avatar.png',
        departure: cs.departureLocation,
        departureCoords: cs.departureCoords,
        eventId: cs.event['_id']
          ? cs.event['_id'].toString()
          : cs.event.toString(),
        eventName: cs.eventName,
        eventLocation: cs.eventLocation,
        eventDate: cs.eventDate,
        eventCoords: cs.eventCoords,
        seats: cs.seats,
        availableSeats: availableSeats,
        departureTime: cs.departureTime,
        available: cs.available && availableSeats > 0,
      };

      if (includePassengers && cs.passengers && Array.isArray(cs.passengers)) {
        driverResponse.passengers = cs.passengers.map((p) => ({
          username: p['username'],
          avatar: p['avatar'] || 'assets/default-avatar.png',
        }));
      }

      if (cs.driver && typeof cs.driver !== 'string' && cs.driver['username']) {
        driverResponse.driver = {
          username: cs.driver['username'],
          avatar: cs.driver['avatar'] || 'assets/default-avatar.png',
        };
      }

      return driverResponse;
    });
  }

  async getUserCarSharings(username: string): Promise<DriverResponse[]> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const carSharings = await this.carsharingModel
      .find({ driver: user._id })
      .populate('event', 'name location date')
      .populate({
        path: 'passengers',
        select: 'username avatar',
      })
      .exec();

    return this.mapCarSharingsToDriverResponses(carSharings, true);
  }

  async getUserRides(username: string): Promise<DriverResponse[]> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const carSharings = await this.carsharingModel
      .find({ passengers: user._id })
      .populate('driver', 'username avatar')
      .populate('event', 'name location date')
      .exec();

    return this.mapCarSharingsToDriverResponses(carSharings, true);
  }
}
