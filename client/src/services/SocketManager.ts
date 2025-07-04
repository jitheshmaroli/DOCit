/* eslint-disable @typescript-eslint/no-explicit-any */
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { Message } from '../types/messageTypes';
import { AppNotification } from '../types/authTypes';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface SocketHandlers {
  onReceiveMessage?: (message: Message) => void;
  onReceiveNotification?: (notification: AppNotification) => void;
  onError?: (error: { message: string }) => void;
  onUserStatus?: (data: {
    userId: string;
    status: 'online' | 'offline';
    lastSeen?: string;
  }) => void;
  onReceiveOffer?: (data: {
    offer: any;
    from: string;
    appointmentId: string;
  }) => void;
  onReceiveAnswer?: (data: {
    answer: any;
    from: string;
    appointmentId: string;
  }) => void;
  onReceiveIceCandidate?: (data: {
    candidate: any;
    from: string;
    appointmentId: string;
  }) => void;
  onCallEnded?: (data: { from: string; appointmentId: string }) => void;
  onReceiveReaction?: (data: {
    messageId: string;
    emoji: string;
    userId: string;
  }) => void;
}

export class SocketManager {
  private static instance: SocketManager | null = null;
  private socket: Socket | null = null;
  private userId: string | null = null;
  private handlers: SocketHandlers = {};
  private connectionPromise: Promise<void> | null = null;
  private reconnectionAttempts = 5;
  private reconnectionDelay = 1000;
  private maxReconnectionDelay = 5000;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public async connect(userId: string): Promise<void> {
    if (this.socket && this.userId === userId && this.socket.connected) {
      console.log('Socket already connected for user:', userId);
      return Promise.resolve();
    }

    this.userId = userId;

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.socket) {
        this.disconnect();
      }

      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.reconnectionAttempts,
        reconnectionDelay: this.reconnectionDelay,
        reconnectionDelayMax: this.maxReconnectionDelay,
        query: { userId },
      });

      this.socket.on('connect', () => {
        console.log('Socket connected for user:', userId);
        this.connectionPromise = null;
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message, {
          userId,
          errorDetails: error,
        });
        toast.error('Failed to connect to real-time service');
        this.connectionPromise = null;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason, { userId });
        if (
          reason === 'io server disconnect' ||
          reason === 'io client disconnect'
        ) {
          this.userId = null;
          this.connectionPromise = null;
        }
      });
    });

    return this.connectionPromise;
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket
      .off('receiveMessage')
      .on('receiveMessage', (message: Message) => {
        console.log('Received message:', message);
        this.handlers.onReceiveMessage?.(message);
      });

    this.socket
      .off('receiveNotification')
      .on('receiveNotification', (notification: AppNotification) => {
        console.log('Received notification:', notification);
        this.handlers.onReceiveNotification?.(notification);
      });

    this.socket
      .off('userStatus')
      .on(
        'userStatus',
        (data: {
          userId: string;
          status: 'online' | 'offline';
          lastSeen?: string;
        }) => {
          console.log('Received userStatus:', data);
          this.handlers.onUserStatus?.(data);
        }
      );

    this.socket
      .off('receiveReaction')
      .on(
        'receiveReaction',
        (data: { messageId: string; emoji: string; userId: string }) => {
          console.log('Received reaction:', data);
          this.handlers.onReceiveReaction?.(data);
        }
      );

    this.socket
      .off('receiveOffer')
      .on(
        'receiveOffer',
        (data: { offer: any; from: string; appointmentId: string }) => {
          console.log('Received offer:', {
            appointmentId: data.appointmentId,
            from: data.from,
          });
          this.handlers.onReceiveOffer?.(data);
        }
      );

    this.socket
      .off('receiveAnswer')
      .on(
        'receiveAnswer',
        (data: { answer: any; from: string; appointmentId: string }) => {
          console.log('Received answer:', {
            appointmentId: data.appointmentId,
            from: data.from,
          });
          this.handlers.onReceiveAnswer?.(data);
        }
      );

    this.socket
      .off('receiveIceCandidate')
      .on(
        'receiveIceCandidate',
        (data: { candidate: any; from: string; appointmentId: string }) => {
          console.log('Received ICE candidate:', {
            appointmentId: data.appointmentId,
            from: data.from,
          });
          console.log('data:', data);
          this.handlers.onReceiveIceCandidate?.(data);
        }
      );

    // this.socket
    //   .off('callEnded')
    //   .on('callEnded', (data: { from: string; appointmentId: string }) => {
    //     console.log('Received callEnded:', data);
    //     this.handlers.onCallEnded?.(data);
    //   });

    this.socket.off('error').on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      toast.error(error.message);
      this.handlers.onError?.(error);
    });
  }

  public registerHandlers(handlers: SocketHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
    if (this.socket && this.socket.connected) {
      this.setupSocketListeners();
    }
  }

  public async emit(
    event: string,
    data:
      | Message
      | AppNotification
      | {
          appointmentId: string;
          to: string;
          from: string;
          offer?: any;
          answer?: any;
          candidate?: any;
        }
      | { roomId: string }
      | { messageId: string; emoji: string; userId: string }
  ): Promise<void> {
    if (!this.userId) {
      console.warn('No userId set, cannot emit:', event);
      toast.error('User not authenticated for real-time communication');
      return;
    }

    if (!this.socket || !this.socket.connected) {
      try {
        await this.connect(this.userId);
      } catch (error) {
        console.error('Failed to reconnect for emit:', event, error);
        toast.error('Failed to emit event due to connection issues');
        return;
      }
    }

    if (this.socket && this.socket.connected) {
      console.log('Emitting event:', event, {
        appointmentId: (data as any).appointmentId,
        to: (data as any).to,
        from: (data as any).from,
        messageId: (data as any).messageId,
      });
      this.socket.emit(event, data);
    } else {
      console.warn('Socket is not connected, cannot emit:', event);
      toast.error('Socket not connected');
    }
  }

  public disconnect(reason: string = 'Manual disconnect'): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log(`Socket disconnected intentionally: ${reason}`);
      this.socket = null;
      this.userId = null;
      this.handlers = {};
      this.connectionPromise = null;
    }
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public async reconnect(): Promise<void> {
    if (this.userId) {
      console.log('Attempting to reconnect socket for user:', this.userId);
      await this.connect(this.userId);
    }
  }
}
