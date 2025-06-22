export interface ChatMessage {
  senderName?: string;
  _id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  role?: 'patient' | 'doctor' | 'admin' | undefined;
  isDeleted?: boolean;
  deletedBy?: [string];
  unreadBy?: [string];
  createdAt?: Date;
  updatedAt?: Date;
  profilePicture?: string;
  reactions?: {
    emoji: string;
    userId: string;
  }[];
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}
