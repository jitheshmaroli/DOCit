import mongoose, { PipelineStage, UpdateQuery } from 'mongoose';
import { QueryParams } from '../../types/authTypes';
import { ChatMessageModel } from '../database/models/ChatMessageModel';
import { IChatRepository } from '../../core/interfaces/repositories/IChatRepository';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { InboxEntry } from '../../types/chatTypes';
import { BaseRepository } from './BaseRepository';

export class ChatRepository extends BaseRepository<ChatMessage> implements IChatRepository {
  constructor() {
    super(ChatMessageModel);
  }

  async create(message: ChatMessage): Promise<ChatMessage> {
    const newMessage = new this.model({
      ...message,
      unreadBy: [message.receiverId],
      deletedBy: [],
    });
    const savedMessage = await newMessage.save();
    return savedMessage.toObject() as ChatMessage;
  }

  async findById(messageId: string): Promise<ChatMessage | null> {
    if (!mongoose.Types.ObjectId.isValid(messageId)) return null;
    const message = await this.model.findById(messageId).exec();
    return message ? (message.toObject() as ChatMessage) : null;
  }

  async findByParticipants(senderId: string, receiverId: string): Promise<ChatMessage[]> {
    const query = {
      $or: [
        { senderId, receiverId, deletedBy: { $ne: senderId } },
        { senderId: receiverId, receiverId: senderId, deletedBy: { $ne: senderId } },
      ],
    };

    const messages = await this.model.find(query).sort({ createdAt: 1 }).exec();

    return messages.map((msg) => msg.toObject() as ChatMessage);
  }

  async softDelete(messageId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(messageId)) return;
    await this.model.findByIdAndUpdate(messageId, { $addToSet: { deletedBy: userId } }).exec();
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(messageId)) return;
    await this.model.findByIdAndUpdate(messageId, { $pull: { unreadBy: userId } }).exec();
  }

  async update(messageId: string, update: UpdateQuery<ChatMessage>): Promise<ChatMessage | null> {
    if (!mongoose.Types.ObjectId.isValid(messageId)) return null;
    const updatedMessage = await this.model.findByIdAndUpdate(messageId, update, { new: true }).exec();
    return updatedMessage ? (updatedMessage.toObject() as ChatMessage) : null;
  }

  async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]> {
    const { page = 1, limit = 10 } = params;
    const query = {
      $or: [
        { senderId: userId, deletedBy: { $ne: userId } },
        { receiverId: userId, deletedBy: { $ne: userId } },
      ],
    };

    const messages = await this.model
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return messages.map((msg) => msg.toObject() as ChatMessage);
  }

  async getInbox(userId: string, params: QueryParams): Promise<InboxEntry[]> {
    const { page = 1, limit = 10 } = params;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: [
            { senderId: userId, deletedBy: { $ne: userId } },
            { receiverId: userId, deletedBy: { $ne: userId } },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          latestMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $in: [userId, { $ifNull: ['$unreadBy', []] }] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { 'latestMessage.createdAt': -1 },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          partnerId: '$_id',
          latestMessage: {
            _id: '$latestMessage._id',
            senderId: '$latestMessage.senderId',
            receiverId: '$latestMessage.receiverId',
            message: '$latestMessage.message',
            createdAt: '$latestMessage.createdAt',
            updatedAt: '$latestMessage.updatedAt',
            reactions: '$latestMessage.reactions',
          },
          unreadCount: 1,
        },
      },
    ];

    const inboxEntries = await this.model.aggregate(pipeline).exec();

    return inboxEntries.map((entry) => ({
      partnerId: entry.partnerId,
      latestMessage: entry.latestMessage ? (entry.latestMessage as ChatMessage) : null,
      unreadCount: entry.unreadCount || 0,
    }));
  }
}
