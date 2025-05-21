import mongoose, { Schema } from 'mongoose';
import { ChatMessage } from '../../../core/entities/ChatMessage';

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    message: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatMessageModel = mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);
