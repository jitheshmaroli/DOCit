import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types/messageTypes';
import { AppNotification } from '../types/authTypes';

interface SocketHandlers {
  onReceiveMessage?: (message: Message) => void;
  onReceiveNotification?: (notification: AppNotification) => void;
  onError?: (error: { message: string }) => void;
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

    if (handlers.onReceiveNotification) {
      socketRef.current.on(
        'receiveNotification',
        handlers.onReceiveNotification
      );
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
      | AppNotification
      | { appointmentId: string; to: string; from: string }
      | { roomId: string }
  ) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, emit };
};
