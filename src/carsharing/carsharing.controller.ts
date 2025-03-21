import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CarsharingService } from './carsharing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriverResponse } from './interfaces/driver.interface';

@Controller('carsharing')
export class CarsharingController {
  constructor(private readonly carsharingService: CarsharingService) {}

  @Get('drivers')
  async getAllDrivers(): Promise<DriverResponse[]> {
    return this.carsharingService.getDrivers();
  }

  @Get('events/:eventId/drivers')
  async getDriversForEvent(@Param('eventId') eventId: string): Promise<DriverResponse[]> {
    return this.carsharingService.getDriversForEvent(eventId);
  }

  @Get('user/:username')
  async getUserCarSharings(@Param('username') username: string): Promise<DriverResponse[]> {
    try {
      return await this.carsharingService.getUserCarSharings(username);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('passenger/:username')
  async getUserRides(@Param('username') username: string): Promise<DriverResponse[]> {
    try {
      return await this.carsharingService.getUserRides(username);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCarSharing(@Body() carSharingData: any, @Request() req) {
    try {
      const result = await this.carsharingService.createOrUpdateCarSharing(
        req.user.username, 
        carSharingData
      );
      return {
        success: true,
        message: 'Car sharing created successfully',
        data: result
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCarSharing(
    @Param('id') id: string,
    @Body() carSharingData: any,
    @Request() req
  ) {
    try {
      const result = await this.carsharingService.createOrUpdateCarSharing(
        req.user.username, 
        { ...carSharingData, id }
      );
      return {
        success: true,
        message: 'Car sharing updated successfully',
        data: result
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('events/:eventId')
  async deleteCarSharing(
    @Param('eventId') eventId: string,
    @Request() req
  ) {
    try {
      await this.carsharingService.deleteCarSharing(req.user.username, eventId);
      return {
        success: true,
        message: 'Car sharing deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinRide(@Param('id') id: string, @Request() req) {
    try {
      await this.carsharingService.joinRide(req.user.username, id);
      return {
        success: true,
        message: 'Successfully joined the ride'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leaveRide(@Param('id') id: string, @Request() req) {
    try {
      await this.carsharingService.leaveRide(req.user.username, id);
      return {
        success: true,
        message: 'Successfully left the ride'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}