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
import { UserRole } from '../../types';

export class SocketService {
  private _io: SocketIOServer | null = null;
  private _connectedUsers: Map<string, Set<string>> = new Map();
  private _messageQueue: Map<string, ChatMessage[]> = new Map();
  private _notificationService: INotificationService | null = null;

  constructor(
    private _chatService: IChatService,
    private _tokenService: ITokenService,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository
  ) {}

  setNotificationService(notificationService: INotificationService): void {
    this._notificationService = notificationService;
  }

  initialize(server: HttpServer): void {
    this._io = new SocketIOServer(server, {
      cors: {
        origin: env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 20000,
      pingInterval: 25000,
    });
    this._setupSocketEvents();
  }

  private async _updateUserLastSeen(userId: string, role: string): Promise<void> {
    const lastSeen = new Date();
    if (role === UserRole.Patient) {
      await this._patientRepository.update(userId, { lastSeen });
    } else if (role === UserRole.Doctor) {
      await this._doctorRepository.update(userId, { lastSeen });
    }
  }

  private _broadcastUserStatus(userId: string, isOnline: boolean, lastSeen?: Date): void {
    if (!this._io) return;
    this._io.emit('userStatusUpdate', {
      userId,
      isOnline,
      lastSeen: lastSeen ? lastSeen.toISOString() : null,
    });
    logger.info(`Broadcasted user status: userId=${userId}, isOnline=${isOnline}`);
  }

  private _setupSocketEvents(): void {
    if (!this._io) {
      throw new Error('Socket.IO server not initialized');
    }

    this._io.use(async (socket: Socket, next) => {
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
          const decoded = this._tokenService.verifyAccessToken(accessToken);
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
            const { userId, role } = await this._tokenService.verifyRefreshToken(refreshToken);
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

    this._io.on('connection', async (socket: Socket) => {
      const userId = socket.data.userId;
      const role = socket.data.role;
      if (!userId || !role) {
        logger.warn('No userId or role in socket data, disconnecting');
        socket.disconnect(true);
        return;
      }

      if (!this._connectedUsers.has(userId)) {
        this._connectedUsers.set(userId, new Set());
      }
      this._connectedUsers.get(userId)!.add(socket.id);
      logger.info(
        `User connected: ${userId}, socketId=${socket.id}, totalSockets=${this._connectedUsers.get(userId)!.size}`
      );

      // Update last seen and broadcast online status
      await this._updateUserLastSeen(userId, role);
      this._broadcastUserStatus(userId, true);

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

          const receiverSocketIds = this._connectedUsers.get(message.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveMessage to: ${message.receiverId}, socketId: ${socketId}`, {
                messagePayload,
              });
              this._io!.to(socketId).emit('receiveMessage', messagePayload);
            });
            logger.info(`Message sent to receiver: ${message.receiverId}`);
          } else {
            logger.warn(`Receiver not connected: ${message.receiverId}, queuing message`);
            this.queueMessage(message.receiverId, messagePayload);
          }

          const senderSocketIds = this._connectedUsers.get(message.senderId);
          if (senderSocketIds && senderSocketIds.size > 0) {
            const senderPayload = { ...messagePayload, isSender: true };
            senderSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveMessage to: ${message.senderId}, socketId: ${socketId}`, {
                senderPayload,
              });
              this._io!.to(socketId).emit('receiveMessage', senderPayload);
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

          const message = await this._chatService
            .getMessages(data.userId, '', {})
            .then((messages) => messages.find((m) => m._id === data.messageId));
          if (!message) {
            throw new Error('Message not found');
          }

          const receiverId = message.senderId === data.userId ? message.receiverId : message.senderId;
          const receiverSocketIds = this._connectedUsers.get(receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveReaction to: ${receiverId}, socketId: ${socketId}`, {
                reactionPayload,
              });
              this._io!.to(socketId).emit('receiveReaction', reactionPayload);
            });
            logger.info(`Reaction sent to receiver: ${receiverId}`);
          }

          const senderSocketIds = this._connectedUsers.get(data.userId);
          if (senderSocketIds && senderSocketIds.size > 0) {
            senderSocketIds.forEach((socketId) => {
              logger.info(`Emitting receiveReaction to: ${data.userId}, socketId: ${socketId}`, {
                reactionPayload,
              });
              this._io!.to(socketId).emit('receiveReaction', reactionPayload);
            });
            logger.info(`Reaction sent to sender: ${data.userId}`);
          }
        } catch (error: any) {
          logger.error(`Send reaction error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('sendNotification', async (notification: Notification) => {
        if (!this._notificationService) {
          logger.error('Notification service not available');
          socket.emit('error', { message: 'Notification service not available' });
          return;
        }
        try {
          await this._notificationService.sendNotification(notification);
          const receiverSocketIds = this._connectedUsers.get(notification.userId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('receiveNotification', notification);
            });
            logger.info(`Notification sent to: ${notification.userId}`);
          }
        } catch (error: any) {
          logger.error(`Send notification error: ${error.message}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('initiateVideoCall', async (data: { appointmentId: string; receiverId: string }) => {
        try {
          logger.info('Received initiateVideoCall:', { data });
          const receiverSocketIds = this._connectedUsers.get(data.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('incomingCall', {
                appointmentId: data.appointmentId,
                callerId: userId,
                callerRole: role,
              });
            });
            logger.info(`Incoming call sent to: ${data.receiverId}`);
          } else {
            logger.warn(`Receiver not connected for video call: ${data.receiverId}`);
            socket.emit('error', { message: 'Receiver not available' });
          }
        } catch (error: any) {
          logger.error(`Initiate video call error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('acceptCall', async (data: { appointmentId: string; callerId: string }) => {
        try {
          logger.info('Received acceptCall:', { data });
          const callerSocketIds = this._connectedUsers.get(data.callerId);
          if (callerSocketIds && callerSocketIds.size > 0) {
            callerSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('callAccepted', {
                appointmentId: data.appointmentId,
                acceptorId: userId,
              });
            });
            logger.info(`Call accepted sent to: ${data.callerId}`);
          }
        } catch (error: any) {
          logger.error(`Accept call error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('rejectCall', async (data: { appointmentId: string; callerId: string }) => {
        try {
          logger.info('Received rejectCall:', { data });
          const callerSocketIds = this._connectedUsers.get(data.callerId);
          if (callerSocketIds && callerSocketIds.size > 0) {
            callerSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('callRejected', {
                appointmentId: data.appointmentId,
                rejectorId: userId,
              });
            });
            logger.info(`Call rejected sent to: ${data.callerId}`);
          }
        } catch (error: any) {
          logger.error(`Reject call error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('signal', async (data: { appointmentId: string; receiverId: string; signal: any }) => {
        try {
          logger.info('Received signal:', { appointmentId: data.appointmentId });
          const receiverSocketIds = this._connectedUsers.get(data.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('signal', {
                appointmentId: data.appointmentId,
                senderId: userId,
                signal: data.signal,
              });
            });
            logger.info(`Signal sent to: ${data.receiverId}`);
          }
        } catch (error: any) {
          logger.error(`Signal error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('endCall', async (data: { appointmentId: string; receiverId: string }) => {
        try {
          logger.info('Received endCall:', { data });
          const receiverSocketIds = this._connectedUsers.get(data.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('callEnded', {
                appointmentId: data.appointmentId,
                enderId: userId,
              });
            });
            logger.info(`Call ended sent to: ${data.receiverId}`);
          }
        } catch (error: any) {
          logger.error(`End call error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('handRaise', async (data: { appointmentId: string; receiverId: string; isRaised: boolean }) => {
        try {
          logger.info('Received handRaise:', { data });
          const receiverSocketIds = this._connectedUsers.get(data.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('handRaise', {
                appointmentId: data.appointmentId,
                userId,
                isRaised: data.isRaised,
              });
            });
            logger.info(`Hand raise sent to: ${data.receiverId}`);
          }
        } catch (error: any) {
          logger.error(`Hand raise error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('muteStatus', async (data: { appointmentId: string; receiverId: string; isMuted: boolean }) => {
        try {
          logger.info('Received muteStatus:', { data });
          const receiverSocketIds = this._connectedUsers.get(data.receiverId);
          if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach((socketId) => {
              this._io!.to(socketId).emit('muteStatus', {
                appointmentId: data.appointmentId,
                userId,
                isMuted: data.isMuted,
              });
            });
            logger.info(`Mute status sent to: ${data.receiverId}`);
          }
        } catch (error: any) {
          logger.error(`Mute status error: ${error}`);
          socket.emit('error', { message: (error as Error).message });
        }
      });

      socket.on('disconnect', async () => {
        const userSockets = this._connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this._connectedUsers.delete(userId);
            await this._updateUserLastSeen(userId, role);
            this._broadcastUserStatus(userId, false, new Date());
          }
          logger.info(
            `User socket disconnected: ${userId}, socketId=${socket.id}, remainingSockets=${userSockets?.size || 0}`
          );
        }
      });
    });
  }

  private queueMessage(userId: string, message: ChatMessage): void {
    if (!this._messageQueue.has(userId)) {
      this._messageQueue.set(userId, []);
    }
    this._messageQueue.get(userId)!.push(message);
    logger.info(`Message queued for user: ${userId}, queueSize=${this._messageQueue.get(userId)!.length}`);
  }

  private deliverQueuedMessages(userId: string, socket: Socket): void {
    const queuedMessages = this._messageQueue.get(userId);
    if (queuedMessages && queuedMessages.length > 0) {
      queuedMessages.forEach((message) => {
        socket.emit('receiveMessage', message);
        logger.info(`Delivered queued message to: ${userId}`, { message });
      });
      this._messageQueue.delete(userId);
      logger.info(`Cleared message queue for user: ${userId}`);
    }
  }

  async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
    const socketIds = this._connectedUsers.get(userId);
    if (socketIds && socketIds.size > 0 && this._io) {
      socketIds.forEach((socketId) => {
        this._io!.to(socketId).emit('receiveNotification', notification);
      });
      logger.info(`Notification sent to user: ${userId}, socketCount=${socketIds.size}`);
    }
  }

  async sendMessageToUsers(message: ChatMessage): Promise<void> {
    if (!this._io) {
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

    const receiverSocketIds = this._connectedUsers.get(message.receiverId);
    if (receiverSocketIds && receiverSocketIds.size > 0) {
      receiverSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveMessage to: ${message.receiverId}, socketId: ${socketId}`, {
          messagePayload,
        });
        this._io!.to(socketId).emit('receiveMessage', messagePayload);
      });
      logger.info(`Message sent to receiver: ${message.receiverId}`);
    } else {
      logger.warn(`Receiver not connected: ${message.receiverId}, queuing message`);
      this.queueMessage(message.receiverId, messagePayload);
    }

    const senderSocketIds = this._connectedUsers.get(message.senderId);
    if (senderSocketIds && senderSocketIds.size > 0) {
      const senderPayload = { ...messagePayload, isSender: true };
      senderSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveMessage to: ${message.senderId}, socketId: ${socketId}`, {
          senderPayload,
        });
        this._io!.to(socketId).emit('receiveMessage', senderPayload);
      });
      logger.info(`Message sent to sender: ${message.senderId}`);
    }
  }

  async sendReactionToUsers(messageId: string, emoji: string, userId: string, receiverId: string): Promise<void> {
    if (!this._io) {
      throw new Error('Socket.IO server not initialized');
    }

    const reactionPayload = {
      messageId,
      emoji,
      userId,
    };

    const receiverSocketIds = this._connectedUsers.get(receiverId);
    if (receiverSocketIds && receiverSocketIds.size > 0) {
      receiverSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveReaction to: ${receiverId}, socketId: ${socketId}`, {
          reactionPayload,
        });
        this._io!.to(socketId).emit('receiveReaction', reactionPayload);
      });
      logger.info(`Reaction sent to receiver: ${receiverId}`);
    }

    const senderSocketIds = this._connectedUsers.get(userId);
    if (senderSocketIds && senderSocketIds.size > 0) {
      senderSocketIds.forEach((socketId) => {
        logger.info(`Emitting receiveReaction to: ${userId}, socketId: ${socketId}`, {
          reactionPayload,
        });
        this._io!.to(socketId).emit('receiveReaction', reactionPayload);
      });
      logger.info(`Reaction sent to sender: ${userId}`);
    }
  }

  isUserOnline(userId: string): boolean {
    return this._connectedUsers.has(userId) && this._connectedUsers.get(userId)!.size > 0;
  }

  async getUserLastSeen(userId: string, role: string): Promise<Date | null> {
    if (role === UserRole.Patient) {
      const patient = await this._patientRepository.findById(userId);
      return patient?.lastSeen || null;
    } else if (role === UserRole.Doctor) {
      const doctor = await this._doctorRepository.findById(userId);
      return doctor?.lastSeen || null;
    }
    return null;
  }
}
