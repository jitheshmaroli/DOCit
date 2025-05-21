// import { UserRole } from '../../types';

export interface ChatMessage {
  senderName: string;
  _id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  role?: 'patient' | 'doctor' | 'admin' | undefined;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
