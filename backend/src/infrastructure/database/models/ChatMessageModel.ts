import mongoose, { Schema } from 'mongoose';
import { ChatMessage } from '../../../core/entities/ChatMessage';

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, required: true },
    receiverId: { type: Schema.Types.ObjectId, required: true },
    message: { type: String },
    isDeleted: { type: Boolean, default: false },
    unreadBy: [{ type: String }],
    deletedBy: [{ type: String }],
    attachment: {
      url: { type: String },
      type: { type: String },
      name: { type: String },
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const ChatMessageModel = mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);
