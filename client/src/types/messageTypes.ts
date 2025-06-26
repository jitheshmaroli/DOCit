export interface Message {
  _id: string;
  message: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  isSender: boolean;
  receiverId?: string;
  unreadBy?: string[];
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
  reactions?: { emoji: string; userId: string }[];
}

export interface LatestMessage {
  _id: string;
  message: string;
  createdAt: string;
  isSender: boolean;
}

export interface MessageThread {
  id: string;
  senderId?: string;
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
  unreadCount: number;
}

export interface ChatMessageResponse {
  _id: string;
  message: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
  unreadBy?: string[];
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
  reactions?: { emoji: string; userId: string }[];
}
