import { Server as SocketIOServer } from 'socket.io';

export const emitToUser = (
  io: SocketIOServer,
  connectedUsers: Map<string, string>,
  userId: string,
  event: string,
  data: unknown
): void => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};
