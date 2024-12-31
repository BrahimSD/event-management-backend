import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':username')
  async getNotifications(@Param('username') username: string) {
    return this.notificationsService.getNotifications(username);
  }

  @Get('settings/:username')
  async getNotificationSettings(@Param('username') username: string) {
    return this.notificationsService.getSettings(username);
  }

  @Put('settings/:username')
  async updateNotificationSettings(
    @Param('username') username: string,
    @Body() settings: any
  ) {
    return this.notificationsService.updateSettings(username, settings);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}