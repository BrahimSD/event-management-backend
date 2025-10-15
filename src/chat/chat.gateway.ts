import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
      origin: ['http://localhost:4200', 'https://eventmbds.netlify.app'],
      credentials: true,
    },
    namespace: '/chat'
  })
  export class ChatGateway {
    @WebSocketServer()
    server: Server;
    private connectedUsers = new Map<string, string>();
  
    constructor(private chatService: ChatService) {}
  
    @SubscribeMessage('join')
    handleJoin(client: Socket, username: string) {
      // Store the connection
      this.connectedUsers.set(client.id, username);
      // Join a room with their username
      client.join(username);
      // Broadcast user connected status
      this.server.emit('userConnected', username);
      
      // Send current online users to new user
      const onlineUsers = Array.from(this.connectedUsers.values());
      client.emit('onlineUsers', onlineUsers);
      
      return { event: 'joined', data: username };
    }
  
    @SubscribeMessage('sendMessage')
    async handleMessage(client: Socket, data: { senderId: string; receiverId: string; content: string }) {
      try {
        const message = await this.chatService.createMessage(
          data.senderId,
          data.receiverId,
          data.content
        );
  
        const populatedMessage = await message.populate(['sender', 'receiver']);
  
        // Emit to both sender and receiver rooms
        this.server.to(data.senderId).emit('newMessage', populatedMessage);
        this.server.to(data.receiverId).emit('newMessage', populatedMessage);
        
        return populatedMessage;
      } catch (error) {
        console.error('Error sending message:', error);
        client.emit('error', { message: 'Failed to send message' });
      }
    }
  
    handleDisconnect(client: Socket) {
      const username = this.connectedUsers.get(client.id);
      if (username) {
        this.connectedUsers.delete(client.id);
        this.server.emit('userDisconnected', username);
      }
    }
  }