import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map(user => ({
      username: user.username,
      role: user.role,
      avatar: user.avatar
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
    role: user.role,
    avatar: user.avatar,
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
}