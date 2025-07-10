/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { Message } from '../types/messageTypes';
import { AppNotification } from '../types/authTypes';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface SocketHandlers {
  onReceiveMessage?: (message: Message) => void;
  onReceiveNotification?: (notification: AppNotification) => void;
  onError?: (error: { message: string }) => void;
  onReceiveReaction?: (data: {
    messageId: string;
    emoji: string;
    userId: string;
  }) => void;
  onIncomingCall?: (data: {
    appointmentId: string;
    callerId: string;
    callerRole: string;
  }) => void;
  onCallAccepted?: (data: {
    appointmentId: string;
    acceptorId: string;
  }) => void;
  onCallRejected?: (data: {
    appointmentId: string;
    rejectorId: string;
  }) => void;
  onSignal?: (data: {
    appointmentId: string;
    senderId: string;
    signal: any;
  }) => void;
  onCallEnded?: (data: { appointmentId: string; enderId: string }) => void;
  onHandRaise?: (data: { appointmentId: string; userId: string; isRaised: boolean }) => void;
  onMuteStatus?: (data: { appointmentId: string; userId: string; isMuted: boolean }) => void;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (userId: string) => Promise<void>;
  disconnect: (reason?: string) => void;
  emit: (
    event: string,
    data:
      | Message
      | AppNotification
      | { roomId: string }
      | { messageId: string; emoji: string; userId: string }
      | { appointmentId: string; receiverId: string }
      | { appointmentId: string; receiverId: string; signal: any }
      | { appointmentId: string; callerId: string }
      | { appointmentId: string; receiverId: string; isRaised: boolean }
      | { appointmentId: string; receiverId: string; isMuted: boolean }
  ) => Promise<void>;
  registerHandlers: (handlers: SocketHandlers) => void;
  reconnect: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const handlersRef = useRef<SocketHandlers>({});
  const connectionPromiseRef = useRef<Promise<void> | null>(null);
  const reconnectionAttempts = 5;
  const reconnectionDelay = 1000;
  const maxReconnectionDelay = 5000;

  const setupSocketListeners = (socket: Socket) => {
    socket.off('receiveMessage').on('receiveMessage', (message: Message) => {
      handlersRef.current.onReceiveMessage?.(message);
    });

    socket
      .off('receiveNotification')
      .on('receiveNotification', (notification: AppNotification) => {
        handlersRef.current.onReceiveNotification?.(notification);
      });


    socket
      .off('receiveReaction')
      .on(
        'receiveReaction',
        (data: { messageId: string; emoji: string; userId: string }) => {
          handlersRef.current.onReceiveReaction?.(data);
        }
      );

    socket
      .off('incomingCall')
      .on(
        'incomingCall',
        (data: {
          appointmentId: string;
          callerId: string;
          callerRole: string;
        }) => {
          handlersRef.current.onIncomingCall?.(data);
        }
      );

    socket
      .off('callAccepted')
      .on(
        'callAccepted',
        (data: { appointmentId: string; acceptorId: string }) => {
          handlersRef.current.onCallAccepted?.(data);
        }
      );

    socket
      .off('callRejected')
      .on(
        'callRejected',
        (data: { appointmentId: string; rejectorId: string }) => {
          handlersRef.current.onCallRejected?.(data);
        }
      );

    socket
      .off('signal')
      .on(
        'signal',
        (data: { appointmentId: string; senderId: string; signal: any }) => {
          handlersRef.current.onSignal?.(data);
        }
      );

    socket
      .off('callEnded')
      .on('callEnded', (data: { appointmentId: string; enderId: string }) => {
        handlersRef.current.onCallEnded?.(data);
      });

    socket
      .off('handRaise')
      .on(
        'handRaise',
        (data: { appointmentId: string; userId: string; isRaised: boolean }) => {
          handlersRef.current.onHandRaise?.(data);
        }
      );

    socket
      .off('muteStatus')
      .on(
        'muteStatus',
        (data: { appointmentId: string; userId: string; isMuted: boolean }) => {
          handlersRef.current.onMuteStatus?.(data);
        }
      );

    socket.off('error').on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      toast.error(error.message);
      handlersRef.current.onError?.(error);
    });
  };

  const connect = async (userId: string): Promise<void> => {
    if (socket && userIdRef.current === userId && socket.connected) {
      return Promise.resolve();
    }

    userIdRef.current = userId;

    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    connectionPromiseRef.current = new Promise((resolve, reject) => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts,
        reconnectionDelay,
        reconnectionDelayMax: maxReconnectionDelay,
        query: { userId },
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
        setIsConnected(true);
        connectionPromiseRef.current = null;
        setupSocketListeners(newSocket);
        resolve();
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        toast.error('Failed to connect to real-time service');
        connectionPromiseRef.current = null;
        reject(error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        if (
          reason === 'io server disconnect' ||
          reason === 'io client disconnect'
        ) {
          userIdRef.current = null;
          connectionPromiseRef.current = null;
          setSocket(null);
        }
      });
    });

    return connectionPromiseRef.current;
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      userIdRef.current = null;
      handlersRef.current = {};
      connectionPromiseRef.current = null;
    }
  };

  const emit = async (
    event: string,
    data:
      | Message
      | AppNotification
      | { roomId: string }
      | { messageId: string; emoji: string; userId: string }
      | { appointmentId: string; receiverId: string}
      | { appointmentId: string; receiverId: string; signal: any }
      | { appointmentId: string; callerId: string }
      | { appointmentId: string; receiverId: string; isRaised: boolean }
      | { appointmentId: string; receiverId: string; isMuted: boolean }
  ): Promise<void> => {
    if (!userIdRef.current) {
      toast.error('User not authenticated for real-time communication');
      return;
    }

    if (!socket || !socket.connected) {
      try {
        await connect(userIdRef.current);
      } catch (error) {
        console.error('Failed to reconnect for emit:', event, error);
        toast.error('Failed to emit event due to connection issues');
        return;
      }
    }

    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket is not connected, cannot emit:', event);
      toast.error('Socket not connected');
    }
  };

  const registerHandlers = (handlers: SocketHandlers) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
    if (socket && socket.connected) {
      setupSocketListeners(socket);
    }
  };

  const reconnect = async () => {
    if (userIdRef.current) {
      await connect(userIdRef.current);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
        emit,
        registerHandlers,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};