import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types/messageTypes';
import { AppNotification } from '../types/authTypes';
import { SignalData } from 'simple-peer';

interface SocketHandlers {
  onReceiveMessage?: (message: Message) => void;
  onVideoCallSignal?: (signal: {
    signal: SignalData;
    from: string;
    appointmentId: string;
  }) => void;
  onVideoCallDeclined?: (data: { appointmentId: string; from: string }) => void;
  onReceiveNotification?: (notification: AppNotification) => void;
  onError?: (error: { message: string }) => void;
  onIncomingCall?: (data: {
    caller: string;
    roomId: string;
    appointmentId: string;
  }) => void;
  onCallAccepted?: (data: {
    receiver: string;
    roomId: string;
    appointmentId: string;
  }) => void;
  onCallEnded?: () => void;
}

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const useSocket = (
  userId: string | undefined,
  handlers: SocketHandlers
) => {
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to real-time service');
    });

    if (handlers.onReceiveMessage) {
      socketRef.current.on('receiveMessage', handlers.onReceiveMessage);
    }

    if (handlers.onVideoCallSignal) {
      socketRef.current.on('videoCallSignal', handlers.onVideoCallSignal);
    }

    if (handlers.onVideoCallDeclined) {
      socketRef.current.on('videoCallDeclined', handlers.onVideoCallDeclined);
    }

    if (handlers.onReceiveNotification) {
      socketRef.current.on(
        'receiveNotification',
        handlers.onReceiveNotification
      );
    }

    if (handlers.onIncomingCall) {
      socketRef.current.on('incomingCall', handlers.onIncomingCall);
    }

    if (handlers.onCallAccepted) {
      socketRef.current.on('callAccepted', handlers.onCallAccepted);
    }

    if (handlers.onCallEnded) {
      socketRef.current.on('callEnded', handlers.onCallEnded);
    }

    socketRef.current.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      toast.error(error.message);
      handlers.onError?.(error);
      if (
        error.message.includes('Authentication') ||
        error.message.includes('Invalid user role')
      ) {
        navigate('/login');
      }
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId, navigate, handlers]);

  const emit = (
    event: string,
    data:
      | Message
      | { signal: SignalData; from: string; to: string; appointmentId: string }
      | AppNotification
      | { appointmentId: string; to: string; from: string }
      | { caller: string; receiver: string; appointmentId: string }
      | { offer: SignalData; roomId: string }
      | { answer: SignalData; roomId: string }
      | { candidate: SignalData; roomId: string }
      | { roomId: string }
  ) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, emit };
};
