import { SignalData } from 'simple-peer';

export interface Message {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  isSender: boolean;
  receiverId?: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}

export interface LatestMessage {
  _id: string;
  message: string;
  createdAt: string;
  isSender: boolean;
}

export interface MessageThread {
  id: string;
  receiverId: string;
  senderName: string;
  subject: string;
  createdAt: string;
  partnerProfilePicture?: string;
  latestMessage: LatestMessage | null;
  messages: Message[];
  unreadCount: number;
}

export interface InboxThreadResponse {
  _id: string;
  receiverId: string;
  senderName?: string;
  subject?: string;
  createdAt: string;
  partnerProfilePicture?: string;
  latestMessage: {
    _id: string;
    message: string;
    createdAt: string;
    isSender: boolean;
  } | null;
}

export interface ChatMessageResponse {
  _id: string;
  message: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}

export interface VideoCallSignal {
  signal: SignalData;
  from: string;
  to: string;
  appointmentId: string;
}

export interface VideoCallProps {
  appointment: {
    _id: string;
    patientId: { _id: string; name: string };
    doctorId?: { _id: string; name: string };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  isInitiator: boolean;
  onClose: () => void;
}