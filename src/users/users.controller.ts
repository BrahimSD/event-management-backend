import { Controller, Get, Put, Post, Body, NotFoundException, Param, UseGuards, Request , ForbiddenException, BadRequestException} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DriverResponse } from "../carsharing/interfaces/driver.interface";
import { CarsharingService } from "../carsharing/carsharing.service";


@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService, 
    private readonly carsharingService: CarsharingService
  ) {}

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map(user => ({
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      about: user.about,
      location: user.location
    }));
  }

  @Get('drivers')
  async getDrivers(): Promise<DriverResponse[]> {
    return this.carsharingService.getDrivers();
  }

  @Get('drivers/:eventId')
  async getDriversForEvent(@Param('eventId') eventId: string): Promise<DriverResponse[]> {
    return this.carsharingService.getDriversForEvent(eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':username/car-settings')
  async updateCarSettings(
    @Param('username') username: string,
    @Body() carSettings: any,
    @Request() req
  ) {
    if (req.user.username !== username) {
      throw new ForbiddenException('You can only update your own car settings');
    }
  
    try {
      await this.usersService.updateCarSettings(username, { hasCar: true });
      await this.carsharingService.createOrUpdateCarSharing(username, carSettings);
      return { success: true, message: 'Car settings updated successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':username')
  async getUserDetails(@Param('username') username: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      about: user.about,
      location: user.location,
      followers: user.followers || [],
      following: user.following || [],
      createdEvents: user.createdEvents,
      attendedEvents: user.attendedEvents
    };
  }

  @Put(':username/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('username') username: string,
    @Body() updateData: any,
    @Request() req
  ) {
    // Vérifier que l'utilisateur ne modifie que son propre profil
    if (req.user.username !== username) {
      throw new ForbiddenException('You can only update your own profile');
    }

    try {
      const updatedUser = await this.usersService.updateProfile(username, updateData);
      return {
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        about: updatedUser.about,
        location: updatedUser.location
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':username/avatar')
  async getUserAvatar(@Param('username') username: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { avatar: user.avatar };
  }

  @Put(':username')
  async updateUser(
    @Param('username') username: string, 
    @Body() updateData: any
  ) {
    try {
      const user = await this.usersService.update(username, updateData);
      return {
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        about: user.about,
        location: user.location
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/follow')
  async followUser(@Param('username') username: string, @Request() req) {
    const currentUser = req.user.username;
    const user = await this.usersService.follow(username, currentUser);
    return {
      username: user.username,
      followers: user.followers,
      following: user.following
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/unfollow')
  async unfollowUser(@Param('username') username: string, @Request() req) {
    const currentUser = req.user.username;
    const user = await this.usersService.unfollow(username, currentUser);
    return {
      username: user.username,
      followers: user.followers,
      following: user.following
    };
  }
}