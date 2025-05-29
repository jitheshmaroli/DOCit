import mongoose, { PipelineStage } from 'mongoose';
import { QueryParams } from '../../types/authTypes';
import { ChatMessageModel } from '../database/models/ChatMessageModel';
import logger from '../../utils/logger';
import { IChatRepository } from '../../core/interfaces/repositories/IChatRepository';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { InboxEntry } from '../../types/chatTypes';

export class ChatRepository implements IChatRepository {
  private model = ChatMessageModel;

  async create(message: ChatMessage): Promise<ChatMessage> {
    const newMessage = new this.model(message);
    const savedMessage = await newMessage.save();
    return savedMessage.toObject() as ChatMessage;
  }

  async findById(id: string): Promise<ChatMessage | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const message = await this.model.findById(id).exec();
    return message ? (message.toObject() as ChatMessage) : null;
  }

  async findByParticipants(senderId: string, receiverId: string, params: QueryParams): Promise<ChatMessage[]> {
    const { page = 1, limit = 10 } = params;
    const query = {
      $or: [
        { senderId, receiverId, isDeleted: false },
        { senderId: receiverId, receiverId: senderId, isDeleted: false },
      ],
    };

    const messages = await this.model
      .find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return messages.map((msg) => msg.toObject() as ChatMessage);
  }

  async softDelete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await this.model.findByIdAndUpdate(id, { isDeleted: true }).exec();
  }

  async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]> {
    const { page = 1, limit = 10 } = params;
    const query = {
      $or: [
        { senderId: userId, isDeleted: false },
        { receiverId: userId, isDeleted: false },
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
            { senderId: userId, isDeleted: false },
            { receiverId: userId, isDeleted: false },
          ],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          latestMessage: { $max: '$createdAt' },
          message: { $last: '$$ROOT' },
        },
      },
      {
        $sort: { latestMessage: -1 },
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
            id: '$message._id',
            senderId: '$message.senderId',
            receiverId: '$message.receiverId',
            message: '$message.message',
            isDeleted: '$message.isDeleted',
            createdAt: '$message.createdAt',
            updatedAt: '$message.updatedAt',
          },
        },
      },
    ];

    const inboxEntries = await this.model.aggregate(pipeline).exec();
    logger.info('getInbox: userId=', userId, 'inboxEntries=', inboxEntries);

    return inboxEntries.map((entry) => ({
      partnerId: entry.partnerId,
      latestMessage: entry.latestMessage ? (entry.latestMessage as ChatMessage) : null,
    }));
  }
}
