import { SignalData } from 'simple-peer';

export interface Message {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isSender: boolean;
  receiverId?: string;
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
  timestamp: string;
  partnerProfilePicture?: string;
  latestMessage: LatestMessage | null;
  messages: Message[];
}

export interface InboxThreadResponse {
  _id: string;
  receiverId: string;
  senderName?: string;
  subject?: string;
  timestamp: string;
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
  timestamp: string;
  createdAt: string;
}

export interface VideoCallSignal {
  signal: SignalData;
  from: string;
  appointmentId: string;
  to?: string;
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
