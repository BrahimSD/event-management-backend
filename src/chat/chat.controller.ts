import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages/:senderId/:receiverId')
  async getMessages(
    @Param('senderId') senderId: string,
    @Param('receiverId') receiverId: string
  ) {
    return this.chatService.getMessages(senderId, receiverId);
  }

  @Post('messages')
  async createMessage(@Body() messageData: { senderId: string; receiverId: string; content: string }) {
    return this.chatService.createMessage(
      messageData.senderId,
      messageData.receiverId,
      messageData.content
    );
  }
}