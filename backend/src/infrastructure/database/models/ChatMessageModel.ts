import mongoose, { Schema } from 'mongoose';
import { ChatMessage } from '../../../core/entities/ChatMessage';

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    message: { type: String },
    isDeleted: { type: Boolean, default: false },
    attachment: {
      url: { type: String },
      type: { type: String },
      name: { type: String },
    },
  },
  { timestamps: true }
);

export const ChatMessageModel = mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);
