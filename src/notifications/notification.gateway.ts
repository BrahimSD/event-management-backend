import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/notifications'
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    const username = this.connectedUsers.get(client.id);
    if (username) {
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, username: string) {
    this.connectedUsers.set(client.id, username);
    client.join(username);
    return { event: 'joined', data: username };
  }

  notifyUser(username: string, notification: any) {
    this.server.to(username).emit('newNotification', notification);
  }
}