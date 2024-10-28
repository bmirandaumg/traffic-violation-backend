import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class PhotoGateway {
  @WebSocketServer()
  server: Server;

  notifyPhotoTaken(photoId: number) {
    this.server.emit('photoTaken', { photoId });
  }

  // Método que notifica a los usuarios conectados que una foto ha sido bloqueada/desbloqueada
  notifyPhotoLockUpdate(photoId: number, isLocked: boolean) {
    this.server.emit('photo-lock-update', { photoId, isLocked });
  }
}
