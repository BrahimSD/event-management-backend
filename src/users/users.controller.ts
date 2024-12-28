import { Controller, Get, Put, Post, Body, NotFoundException, Param, UseGuards, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService  ) {}

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