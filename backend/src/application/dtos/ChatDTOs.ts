export interface SendMessageRequestDTO {
  receiverId: string;
  message: string;
  senderName: string;
}

export interface SendAttachmentRequestDTO {
  receiverId: string;
  senderName: string;
}

export interface AddReactionRequestDTO {
  emoji: string;
  replace: boolean;
}

export interface ChatMessageResponseDTO {
  _id: string;
  message: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
  isRead: boolean;
  reactions?: {
    emoji: string;
    userId: string;
  }[];
}

export interface InboxResponseDTO {
  _id: string;
  receiverId: string;
  senderName: string;
  subject?: string;
  createdAt: string;
  partnerProfilePicture?: string;
  latestMessage: ChatMessageResponseDTO | null;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export interface UserStatusResponseDTO {
  userId: string;
  isOnline: boolean;
  lastSeen: string | null;
}
