/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { IChatService } from '../../core/interfaces/services/IChatService';
import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { ITokenService } from '../../core/interfaces/services/ITokenService';
import { env } from '../../config/env';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { Notification } from '../../core/entities/Notification';
import { AuthenticationError } from '../../utils/errors';
import logger from '../../utils/logger';
import * as cookie from 'cookie';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';

export class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map();
  private messageQueue: Map<string, ChatMessage[]> = new Map();
  private notificationService: INotificationService | null = null;

  constructor(
    private chatService: IChatService,
    private tokenService: ITokenService,
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  setNotificationService(notificationService: INotificationService): void {
    this.notificationService = notificationService;
  }

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 20000,
      pingInterval: 25000,
    });
    this.setupSocketEvents();
  }

  private async updateLastSeen(userId: string, role: string): Promise<void> {
    try {
      if (role === 'patient') {
        await this.patientRepository.update(userId, { lastSeen: new Date() });
      } else if (role === 'doctor') {
        await this.doctorRepository.update(userId, { lastSeen: new Date() });
      }
    } catch (error) {
      logger.error(`Failed to update last seen for user ${userId}:`, error);
    }
  }

  private setupSocketEvents(): void {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    this.io.use(async (socket: Socket, next) => {
      try {
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

    this.io.on('connection', async (socket: Socket) => {
      const userId = socket.data.userId;
      const role = socket.data.role;
      if (!userId || !role) {
        logger.warn('No userId or role in socket data, disconnecting');
        socket.disconnect(true);
        return;
      }

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);
      logger.info(
        `User connected: ${userId}, socketId=${socket.id}, totalSockets=${this.connectedUsers.get(userId)!.size}`
      );

      await this.updateLastSeen(userId, role);
      this.io!.emit('userStatus', { userId, status: 'online' });

      this.deliverQueuedMessages(userId, socket);

      socket.on('sendMessage', async (message: ChatMessage) => {
        try {
          logger.info('Received sendMessage payload:', { message });
          const messagePayload = {
            _id: message._id,
            message: message.message,
            senderId: message.senderId,
            senderName: message.senderName || 'Unknown',
            createdAt: message.createdAt || new Date(),
            isSender: false,
            receiverId: message.receiverId,
            attachment: message.attachment,
            reactions: message.reactions || [],
            unreadBy: message.unreadBy || [message.receiverId],
          };

          // Emit to receiver
          const receiverSocketIds = this.connectedUsers.get(message.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveMessage to: ${message.receiverId}, socketId: ${socketId}`, {
                messagePayload,
              });
              this.io!.to(socketId).emit('receiveMessage', messagePayload);
            });
            logger.info(`Message sent to receiver: ${message.receiverId}`);
          } else {
            logger.warn(`Receiver not connected: ${message.receiverId}, queuing message`);
            this.queueMessage(message.receiverId, messagePayload);
          }

          // Emit to sender
          const senderSocketIds = this.connectedUsers.get(message.senderId);
          if (senderSocketIds && senderSocketIds.size > 0) {
            const senderPayload = { ...messagePayload, isSender: true };
            senderSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveMessage to: ${message.senderId}, socketId: ${socketId}`, {
                senderPayload,
              });
              this.io!.to(socketId).emit('receiveMessage', senderPayload);
            });
            logger.info(`Message sent to sender: ${message.senderId}`);
          }
        } catch (error: any) {
          logger.error(`Send message error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('sendReaction', async (data: { messageId: string; emoji: string; userId: string }) => {
        try {
          logger.info('Received sendReaction payload:', { data });
          const reactionPayload = {
            messageId: data.messageId,
            emoji: data.emoji,
            userId: data.userId,
          };

          const message = await this.chatService
            .getMessages(data.userId, '', {})
            .then((messages) => messages.find((m) => m._id === data.messageId));
          if (!message) {
            throw new Error('Message not found');
          }

          // Emit to receiver
          const receiverId = message.senderId === data.userId ? message.receiverId : message.senderId;
          const receiverSocketIds = this.connectedUsers.get(receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveReaction to: ${receiverId}, socketId: ${socketId}`, {
                reactionPayload,
              });
              this.io!.to(socketId).emit('receiveReaction', reactionPayload);
            });
            logger.info(`Reaction sent to receiver: ${receiverId}`);
          }

          // Emit to sender
          const senderSocketIds = this.connectedUsers.get(data.userId);
          if (senderSocketIds && senderSocketIds.size > 0) {
            senderSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveReaction to: ${data.userId}, socketId: ${socketId}`, {
                reactionPayload,
              });
              this.io!.to(socketId).emit('receiveReaction', reactionPayload);
            });
            logger.info(`Reaction sent to sender: ${data.userId}`);
          }
        } catch (error: any) {
          logger.error(`Send reaction error: ${error}`);
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
          const receiverSocketIds = this.connectedUsers.get(notification.userId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this.io!.to(socketId).emit('receiveNotification', notification);
            });
            logger.info(`Notification sent to: ${notification.userId}`);
          }
        } catch (error: any) {
          logger.error(`Send notification error: ${error.message}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('offer', (data: { appointmentId: string; to: string; from: string; offer: any }) => {
        const receiverSocketIds = this.connectedUsers.get(data.to);
        if (receiverSocketIds && receiverSocketIds.size > 0) {
          receiverSocketIds.forEach((socketId) => {
            this.io!.to(socketId).emit('receiveOffer', {
              offer: data.offer,
              from: data.from,
              appointmentId: data.appointmentId,
            });
          });
          logger.info(`Offer sent to: ${data.to} for appointment: ${data.appointmentId}`);
        } else {
          logger.warn(`Receiver not connected for offer: ${data.to}`);
          socket.emit('error', { message: 'Receiver not connected' });
        }
      });

      socket.on('answer', (data: { appointmentId: string; to: string; from: string; answer: any }) => {
        const receiverSocketIds = this.connectedUsers.get(data.to);
        if (receiverSocketIds && receiverSocketIds.size > 0) {
          receiverSocketIds.forEach((socketId) => {
            this.io!.to(socketId).emit('receiveAnswer', { answer: data.answer, appointmentId: data.appointmentId });
          });
          logger.info(`Answer sent to: ${data.to} for appointment: ${data.appointmentId}`);
        }
      });

      socket.on('iceCandidate', (data: { appointmentId: string; to: string; from: string; candidate: any }) => {
        const receiverSocketIds = this.connectedUsers.get(data.to);
        if (receiverSocketIds && receiverSocketIds.size > 0) {
          receiverSocketIds.forEach((socketId) => {
            this.io!.to(socketId).emit('receiveIceCandidate', {
              candidate: data.candidate,
              appointmentId: data.appointmentId,
              from: data.from,
            });
          });
          logger.info(
            `ICE candidate sent to: ${data.to} for appointment: ${data.appointmentId} candidata: ${data.candidate}`
          );
        }
      });

      socket.on('endCall', (data: { appointmentId: string; to: string; from: string }) => {
        const receiverSocketIds = this.connectedUsers.get(data.to);
        if (receiverSocketIds && receiverSocketIds.size > 0) {
          receiverSocketIds.forEach((socketId) => {
            this.io!.to(socketId).emit('callEnded', { appointmentId: data.appointmentId });
          });
          logger.info(`Call ended signal sent to: ${data.to} for appointment: ${data.appointmentId}`);
        }
      });

      socket.on('disconnect', async () => {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
            await this.updateLastSeen(userId, role);
            this.io!.emit('userStatus', { userId, status: 'offline', lastSeen: new Date().toISOString() });
          }
          logger.info(
            `User socket disconnected: ${userId}, socketId=${socket.id}, remainingSockets=${userSockets?.size || 0}`
          );
        }
      });
    });
  }

  private queueMessage(userId: string, message: ChatMessage): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    this.messageQueue.get(userId)!.push(message);
    logger.info(`Message queued for user: ${userId}, queueSize=${this.messageQueue.get(userId)!.length}`);
  }

  private deliverQueuedMessages(userId: string, socket: Socket): void {
    const queuedMessages = this.messageQueue.get(userId);
    if (queuedMessages && queuedMessages.length > 0) {
      queuedMessages.forEach((message) => {
        socket.emit('receiveMessage', message);
        logger.info(`Delivered queued message to: ${userId}`, { message });
      });
      this.messageQueue.delete(userId);
      logger.info(`Cleared message queue for user: ${userId}`);
    }
  }

  async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.size > 0 && this.io) {
      socketIds.forEach((socketId) => {
        this.io!.to(socketId).emit('receiveNotification', notification);
      });
      logger.info(`Notification sent to user: ${userId}, socketCount=${socketIds.size}`);
    }
  }

  async sendMessageToUsers(message: ChatMessage): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    const messagePayload = {
      _id: message._id,
      message: message.message,
      senderId: message.senderId,
      senderName: message.senderName || 'Unknown',
      createdAt: message.createdAt || new Date(),
      isSender: false,
      receiverId: message.receiverId,
      attachment: message.attachment,
      reactions: message.reactions || [],
      unreadBy: message.unreadBy || [message.receiverId],
    };

    // Emit to receiver
    const receiverSocketIds = this.connectedUsers.get(message.receiverId);
    if (receiverSocketIds && receiverSocketIds.size > 0) {
      receiverSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveMessage to: ${message.receiverId}, socketId: ${socketId}`, {
          messagePayload,
        });
        this.io!.to(socketId).emit('receiveMessage', messagePayload);
      });
      logger.info(`Message sent to receiver: ${message.receiverId}`);
    } else {
      logger.warn(`Receiver not connected: ${message.receiverId}, queuing message`);
      this.queueMessage(message.receiverId, messagePayload);
    }

    // Emit to sender
    const senderSocketIds = this.connectedUsers.get(message.senderId);
    if (senderSocketIds && senderSocketIds.size > 0) {
      const senderPayload = { ...messagePayload, isSender: true };
      senderSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveMessage to: ${message.senderId}, socketId: ${socketId}`, {
          senderPayload,
        });
        this.io!.to(socketId).emit('receiveMessage', senderPayload);
      });
      logger.info(`Message sent to sender: ${message.senderId}`);
    }
  }

  async sendReactionToUsers(messageId: string, emoji: string, userId: string, receiverId: string): Promise<void> {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }

    const reactionPayload = {
      messageId,
      emoji,
      userId,
    };

    // Emit to receiver
    const receiverSocketIds = this.connectedUsers.get(receiverId);
    if (receiverSocketIds && receiverSocketIds.size > 0) {
      receiverSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveReaction to: ${receiverId}, socketId: ${socketId}`, {
          reactionPayload,
        });
        this.io!.to(socketId).emit('receiveReaction', reactionPayload);
      });
      logger.info(`Reaction sent to receiver: ${receiverId}`);
    }

    // Emit to sender
    const senderSocketIds = this.connectedUsers.get(userId);
    if (senderSocketIds && senderSocketIds.size > 0) {
      senderSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveReaction to: ${userId}, socketId: ${socketId}`, {
          reactionPayload,
        });
        this.io!.to(socketId).emit('receiveReaction', reactionPayload);
      });
      logger.info(`Reaction sent to sender: ${userId}`);
    }
  }
}
