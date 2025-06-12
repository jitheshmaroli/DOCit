/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { IChatService } from '../../core/interfaces/services/IChatService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { IVideoCallService } from '../../core/interfaces/services/IVideoCallService';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { env } from '../../config/env';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { Notification } from '../../core/entities/Notification';
import { AuthenticationError } from '../../utils/errors';
import logger from '../../utils/logger';
import * as cookie from 'cookie';

export class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private notificationService: INotificationService | null = null;

  constructor(
    private chatService: IChatService,
    private videoCallService: IVideoCallService,
    private tokenService: ITokenService
  ) {}

  setNotificationService(notificationService: INotificationService): void {
    this.notificationService = notificationService;
  }

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
    });
    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.io.use(async (socket: Socket, next) => {
      try {
        if (!cookie.parse) {
          throw new Error('Cookie parsing module not available');
        }

        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader || typeof cookieHeader !== 'string') {
          logger.error('No cookie header provided or invalid format', {
            headers: socket.handshake.headers,
          });
          return next(new AuthenticationError('No cookies provided'));
        }

        let cookies: Record<string, string | undefined>;
        try {
          cookies = cookie.parse(cookieHeader);
        } catch (parseError: any) {
          logger.error('Failed to parse cookies', { error: parseError.message, cookieHeader });
          return next(new AuthenticationError('Invalid cookie format'));
        }

        const accessToken = cookies['accessToken'];
        if (!accessToken) {
          logger.error('No accessToken found in cookies', { cookies });
          return next(new AuthenticationError('No access token provided'));
        }

        try {
          const decoded = this.tokenService.verifyAccessToken(accessToken);
          socket.data.userId = decoded.userId;
          socket.data.role = decoded.role;
          logger.info(`Socket authenticated: userId=${decoded.userId}, role=${decoded.role}`);
          next();
        } catch {
          const refreshToken = cookies['refreshToken'];
          if (!refreshToken) {
            logger.error('No refreshToken found in cookies', { cookies });
            throw new AuthenticationError('No refresh token provided');
          }

          try {
            const { userId, role } = await this.tokenService.verifyRefreshToken(refreshToken);
            socket.data.userId = userId;
            socket.data.role = role;
            logger.info(`Socket authenticated with refreshed token: userId=${userId}, role=${role}`);
            next();
          } catch (refreshError: any) {
            logger.error(`Refresh token verification failed: ${refreshError.message}`, { cookies });
            throw new AuthenticationError('Invalid refresh token');
          }
        }
      } catch (error: any) {
        logger.error(`Authentication failed: ${error.message}`, {
          headers: socket.handshake.headers,
        });
        next(new AuthenticationError(error.message || 'Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      if (!userId) {
        logger.warn('No userId in socket data, disconnecting');
        socket.disconnect();
        return;
      }

      this.connectedUsers.set(userId, socket.id);
      logger.info(`User connected: ${userId}, socketId=${socket.id}`);

      socket.on('sendMessage', async (message: ChatMessage) => {
        try {
          console.log('Received sendMessage payload:', message);
          const messagePayload = {
            id: message._id,
            message: message.message,
            senderId: message.senderId,
            senderName: message.senderName || 'Unknown',
            createdAt: message.createdAt || new Date(),
            isSender: false,
          };

          const receiverSocketId = this.connectedUsers.get(message.receiverId);
          if (receiverSocketId) {
            this.io!.to(receiverSocketId).emit('receiveMessage', {
              ...messagePayload,
              isSender: false,
            });
            logger.info(`Message sent to receiver: ${message.receiverId}`);
          } else {
            logger.warn(`Receiver not connected: ${message.receiverId}`);
          }

          // Do not emit to sender to avoid duplicate processing
          logger.info(`Message notification sent for: ${userId}`);
        } catch (error: any) {
          logger.error(`Send message error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('sendNotification', async (notification: Notification) => {
        if (!this.notificationService) {
          logger.error('Notification service not available');
          socket.emit('error', { message: 'Notification service not available' });
          return;
        }
        try {
          await this.notificationService.sendNotification(notification);
          const receiverSocketId = this.connectedUsers.get(notification.userId);
          if (receiverSocketId) {
            this.io!.to(receiverSocketId).emit('receiveNotification', notification);
            logger.info(`Notification sent to: ${notification.userId}`);
          }
        } catch (error: any) {
          logger.error(`Send notification error: ${error.message}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      // Map to keep track of roomId <-> userId
      const callRooms: Map<string, { initiator: string; receiver: string }> = new Map();

      socket.on('startCall', (data: { caller: string; receiver: string; appointmentId: string; roomId?: string }) => {
        // Generate a roomId if not provided
        const roomId = data.roomId || `${data.appointmentId}-${Date.now()}`;
        callRooms.set(roomId, { initiator: data.caller, receiver: data.receiver });

        const receiverSocketId = this.connectedUsers.get(data.receiver);
        if (receiverSocketId) {
          this.io!.to(receiverSocketId).emit('incomingCall', {
            caller: data.caller,
            roomId,
            appointmentId: data.appointmentId,
          });
          logger.info(`Incoming call sent to: ${data.receiver}`);
        }
      });

      socket.on('acceptCall', (data: { caller: string; receiver: string; roomId: string; appointmentId: string }) => {
        const initiatorSocketId = this.connectedUsers.get(data.caller);
        if (initiatorSocketId) {
          this.io!.to(initiatorSocketId).emit('callAccepted', {
            receiver: data.receiver,
            roomId: data.roomId,
            appointmentId: data.appointmentId,
          });
          logger.info(`Call accepted sent to: ${data.caller}`);
        }
      });

      socket.on('offer', (data: { offer: any; roomId: string }) => {
        const room = callRooms.get(data.roomId);
        if (room) {
          const receiverSocketId = this.connectedUsers.get(room.receiver);
          if (receiverSocketId) {
            this.io!.to(receiverSocketId).emit('videoCallSignal', {
              signal: data.offer,
              from: room.initiator,
              appointmentId: data.roomId.split('-')[0],
              roomId: data.roomId,
            });
          }
        }
      });

      socket.on('answer', (data: { answer: any; roomId: string }) => {
        const room = callRooms.get(data.roomId);
        if (room) {
          const initiatorSocketId = this.connectedUsers.get(room.initiator);
          if (initiatorSocketId) {
            this.io!.to(initiatorSocketId).emit('videoCallSignal', {
              signal: data.answer,
              from: room.receiver,
              appointmentId: data.roomId.split('-')[0],
              roomId: data.roomId,
            });
          }
        }
      });

      socket.on('iceCandidate', (data: { candidate: any; roomId: string }) => {
        const room = callRooms.get(data.roomId);
        if (room) {
          // Forward candidate to both peers
          [room.initiator, room.receiver].forEach((userId) => {
            const socketId = this.connectedUsers.get(userId);
            if (socketId) {
              this.io!.to(socketId).emit('videoCallSignal', {
                signal: data.candidate,
                from: userId,
                appointmentId: data.roomId.split('-')[0],
                roomId: data.roomId,
              });
            }
          });
        }
      });

      socket.on('endCall', (data: { roomId: string }) => {
        const room = callRooms.get(data.roomId);
        if (room) {
          [room.initiator, room.receiver].forEach((userId) => {
            const socketId = this.connectedUsers.get(userId);
            if (socketId) {
              this.io!.to(socketId).emit('callEnded', { roomId: data.roomId });
            }
          });
          callRooms.delete(data.roomId);
        }
      });

      socket.on('disconnect', () => {
        this.connectedUsers.delete(userId);
        logger.info(`User disconnected: ${userId}, socketId=${socket.id}`);
      });
    });
  }

  async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit('receiveNotification', notification);
      logger.info(`Notification sent to user: ${userId}`);
    }
  }
}
