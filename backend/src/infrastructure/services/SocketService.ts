import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
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
import { IChatRepository } from '../../core/interfaces/repositories/IChatRepository';
import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';

interface AuthenticatedSocketData {
  userId: string;
  role: UserRole;
}

interface SendMessagePayload extends Omit<ChatMessage, 'isSender'> {
  isSender: boolean;
}

interface ReactionPayload {
  messageId: string;
  emoji: string;
  userId: string;
}

interface IncomingCallPayload {
  appointmentId: string;
  callerId: string;
  callerRole: UserRole;
}

interface CallResponsePayload {
  appointmentId: string;
  acceptorId?: string;
  rejectorId?: string;
}

interface SignalPayload {
  appointmentId: string;
  senderId: string;
  signal: unknown;
}

interface HandRaisePayload {
  appointmentId: string;
  userId: string;
  isRaised: boolean;
}

interface MuteStatusPayload {
  appointmentId: string;
  userId: string;
  isMuted: boolean;
}

interface CallEndPayload {
  appointmentId: string;
  enderId: string;
}

export class SocketService {
  private _io: SocketIOServer | null = null;
  private _connectedUsers: Map<string, Set<string>> = new Map(); // userId → socketIds
  private _messageQueue: Map<string, SendMessagePayload[]> = new Map();

  constructor(
    private _chatRepository: IChatRepository,
    private _tokenService: ITokenService,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _notificationRepository: INotificationRepository
  ) {}

  initialize(server: HttpServer): void {
    this._io = new SocketIOServer(server, {
      cors: {
        origin: env.SOCKET_CORS_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 20000,
      pingInterval: 25000,
    });

    this._setupSocketEvents();
  }

  private async _updateUserLastSeen(userId: string, role: UserRole): Promise<void> {
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
      lastSeen: lastSeen?.toISOString() ?? null,
    });
    logger.info(`Broadcasted user status: userId=${userId}, isOnline=${isOnline}`);
  }

  private _setupSocketEvents(): void {
    if (!this._io) throw new Error('Socket.IO server not initialized');

    // Authentication middleware
    this._io.use(async (socket: Socket, next) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader || typeof cookieHeader !== 'string') {
          throw new AuthenticationError('No cookies provided');
        }

        const cookies = cookie.parse(cookieHeader);
        const accessToken = cookies['accessToken'];

        if (!accessToken) throw new AuthenticationError('No access token provided');

        let decoded;
        try {
          decoded = this._tokenService.verifyAccessToken(accessToken);
        } catch {
          const refreshToken = cookies['refreshToken'];
          if (!refreshToken) throw new AuthenticationError('No refresh token provided');
          decoded = await this._tokenService.verifyRefreshToken(refreshToken);
        }

        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;

        logger.info(`Socket authenticated: userId=${decoded.userId}, role=${decoded.role}`);
        next();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        logger.error(`Authentication failed: ${message}`);
        next(new AuthenticationError(message));
      }
    });

    this._io.on('connection', async (socket: Socket) => {
      const userId = (socket.data as AuthenticatedSocketData).userId;
      const role = (socket.data as AuthenticatedSocketData).role;

      if (!userId || !role) {
        socket.disconnect(true);
        return;
      }

      // Track user sockets
      if (!this._connectedUsers.has(userId)) this._connectedUsers.set(userId, new Set());
      this._connectedUsers.get(userId)!.add(socket.id);

      logger.info(`User connected: ${userId}, socketId=${socket.id}`);

      await this._updateUserLastSeen(userId, role);
      this._broadcastUserStatus(userId, true);

      this.deliverQueuedMessages(userId, socket);

      // EVENT HANDLERS

      socket.on('sendMessage', async (message: ChatMessage) => {
        try {
          const basePayload: Omit<SendMessagePayload, 'isSender'> = {
            _id: message._id,
            message: message.message,
            senderId: message.senderId,
            senderName: message.senderName || 'Unknown',
            createdAt: message.createdAt || new Date(),
            receiverId: message.receiverId,
            attachment: message.attachment,
            reactions: message.reactions || [],
            unreadBy: message.unreadBy,
          };

          const receiverPayload: SendMessagePayload = { ...basePayload, isSender: false };
          const senderPayload: SendMessagePayload = { ...basePayload, isSender: true };

          this._sendToUser(message.receiverId!, 'receiveMessage', receiverPayload);
          this._sendToUser(message.senderId!, 'receiveMessage', senderPayload);
        } catch (error) {
          this._handleError(socket, error);
        }
      });

      socket.on('sendReaction', async (data: ReactionPayload) => {
        try {
          const message = await this._chatRepository.findById(data.messageId);
          if (!message) throw new Error('Message not found');

          const receiverId =
            message.senderId?.toString() === data.userId
              ? message.receiverId?.toString()
              : message.senderId?.toString();

          this._sendToUser(receiverId!, 'receiveReaction', data);
          this._sendToUser(data.userId, 'receiveReaction', data);
        } catch (error) {
          this._handleError(socket, error);
        }
      });

      socket.on('sendNotification', async (notification: Notification) => {
        try {
          await this._notificationRepository.create(notification);
          this._sendToUser(notification.userId!, 'receiveNotification', notification);
        } catch (error) {
          this._handleError(socket, error);
        }
      });

      // VIDEO CALL EVENTS

      socket.on('initiateVideoCall', (data: { appointmentId: string; receiverId: string }) => {
        this._sendToUser(data.receiverId, 'incomingCall', {
          appointmentId: data.appointmentId,
          callerId: userId,
          callerRole: role,
        } as IncomingCallPayload);
      });

      socket.on('acceptCall', (data: { appointmentId: string; callerId: string }) => {
        this._sendToUser(data.callerId, 'callAccepted', {
          appointmentId: data.appointmentId,
          acceptorId: userId,
        } as CallResponsePayload);
      });

      socket.on('rejectCall', (data: { appointmentId: string; callerId: string }) => {
        this._sendToUser(data.callerId, 'callRejected', {
          appointmentId: data.appointmentId,
          rejectorId: userId,
        } as CallResponsePayload);
      });

      socket.on('signal', (data: { appointmentId: string; receiverId: string; signal: unknown }) => {
        this._sendToUser(data.receiverId, 'signal', {
          appointmentId: data.appointmentId,
          senderId: userId,
          signal: data.signal,
        } as SignalPayload);
      });

      socket.on('endCall', (data: { appointmentId: string; receiverId: string }) => {
        this._sendToUser(data.receiverId, 'callEnded', {
          appointmentId: data.appointmentId,
          enderId: userId,
        } as CallEndPayload);
      });

      socket.on('handRaise', (data: { appointmentId: string; receiverId: string; isRaised: boolean }) => {
        this._sendToUser(data.receiverId, 'handRaise', {
          appointmentId: data.appointmentId,
          userId,
          isRaised: data.isRaised,
        } as HandRaisePayload);
      });

      socket.on('muteStatus', (data: { appointmentId: string; receiverId: string; isMuted: boolean }) => {
        this._sendToUser(data.receiverId, 'muteStatus', {
          appointmentId: data.appointmentId,
          userId,
          isMuted: data.isMuted,
        } as MuteStatusPayload);
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
        }
      });
    });
  }

  private _sendToUser(userId: string, eventName: string, payload: unknown): void {
    if (!this._io) return;

    const socketIds = this._connectedUsers.get(userId);

    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        this._io!.to(socketId).emit(eventName, payload);
      });
      logger.info(`Emitted ${eventName} to ${userId}`);
    } else if (eventName === 'receiveMessage') {
      this.queueMessage(userId, payload as SendMessagePayload);
    }
  }

  private queueMessage(userId: string, message: SendMessagePayload): void {
    if (!this._messageQueue.has(userId)) this._messageQueue.set(userId, []);
    this._messageQueue.get(userId)!.push(message);
  }

  private deliverQueuedMessages(userId: string, socket: Socket): void {
    const queuedMessages = this._messageQueue.get(userId);
    if (queuedMessages?.length) {
      queuedMessages.forEach((msg) => socket.emit('receiveMessage', msg));
      this._messageQueue.delete(userId);
      logger.info(`Delivered ${queuedMessages.length} queued messages to ${userId}`);
    }
  }

  private _handleError(socket: Socket, error: unknown): void {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error(`Socket error: ${message}`, { error });
    socket.emit('error', { message });
  }

  // Public API
  async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
    this._sendToUser(userId, 'receiveNotification', notification);
  }

  async sendMessageToUsers(message: ChatMessage): Promise<void> {
    const basePayload: Omit<SendMessagePayload, 'isSender'> = {
      _id: message._id,
      message: message.message,
      senderId: message.senderId,
      senderName: message.senderName || 'Unknown',
      createdAt: message.createdAt || new Date(),
      receiverId: message.receiverId,
      attachment: message.attachment,
      reactions: message.reactions || [],
      unreadBy: message.unreadBy,
    };

    this._sendToUser(message.receiverId!, 'receiveMessage', { ...basePayload, isSender: false });
    this._sendToUser(message.senderId!, 'receiveMessage', { ...basePayload, isSender: true });
  }

  isUserOnline(userId: string): boolean {
    return this._connectedUsers.has(userId) && this._connectedUsers.get(userId)!.size > 0;
  }

  async getUserLastSeen(userId: string, role: UserRole): Promise<Date | null> {
    if (role === UserRole.Patient) {
      const patient = await this._patientRepository.findById(userId);
      return patient?.lastSeen ?? null;
    }
    if (role === UserRole.Doctor) {
      const doctor = await this._doctorRepository.findById(userId);
      return doctor?.lastSeen ?? null;
    }
    return null;
  }
}
