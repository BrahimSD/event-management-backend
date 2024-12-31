import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { NotificationSettings } from './schemas/notification-settings.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(NotificationSettings.name) private settingsModel: Model<NotificationSettings>
  ) {}

  async getNotifications(username: string): Promise<Notification[]> {
    console.log('Getting notifications for user:', username);
    
    const notifications = await this.notificationModel
      .find({ userId: username })
      .sort({ createdAt: -1 })
      .exec();
    
    console.log('Found notifications:', notifications);
    return notifications;
  }

  async getSettings(username: string): Promise<NotificationSettings> {
    console.log('Getting notification settings for user:', username);
    
    let settings = await this.settingsModel.findOne({ username }).exec();
    console.log('Existing settings:', settings);
    
    if (!settings) {
      console.log('Creating default settings for user:', username);
      settings = await this.settingsModel.create({
        username,
        eventReminders: true,
        registrationConfirmation: true,
        newEventsFromFollowed: true
      });
      console.log('Created default settings:', settings);
    }
    
    return settings;
  }

  async updateSettings(username: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const existingSettings = await this.settingsModel.findOne({ username }).exec();
    if (!existingSettings) {
      return this.settingsModel.create({ username, ...settings });
    }
    return this.settingsModel.findOneAndUpdate(
      { username },
      { $set: settings },
      { new: true }
    ).exec();
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { $set: { read: true } },
      { new: true }
    ).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({ _id: notificationId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async createNotification(data: {
    userId: string;
    message: string;
    type: string;
    data?: any;
  }): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: data.userId,
      message: data.message,
      type: data.type,
      data: data.data || {},
      read: false
    });
    return notification.save();
  }
}