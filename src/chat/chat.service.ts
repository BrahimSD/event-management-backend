import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const sender = await this.userModel.findOne({ username: senderId });
    const receiver = await this.userModel.findOne({ username: receiverId });

    const newMessage = new this.messageModel({
      sender: sender._id,
      receiver: receiver._id,
      content,
    });
    return newMessage.save();
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const user1 = await this.userModel.findOne({ username: userId1 });
    const user2 = await this.userModel.findOne({ username: userId2 });

    return this.messageModel
      .find({
        $or: [
          { sender: user1._id, receiver: user2._id },
          { sender: user2._id, receiver: user1._id },
        ],
      })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 })
      .exec();
  }
}