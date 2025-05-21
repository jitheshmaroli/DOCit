import { IChatRepository, InboxEntry } from '../../core/interfaces/repositories/IChatRepository';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { ChatMessageModel } from '../database/models/ChatMessageModel';
import { QueryParams } from '../../types/authTypes';
import { QueryBuilder } from '../../utils/queryBuilder';
import { PipelineStage } from 'mongoose';
import logger from '../../utils/logger';

export class ChatRepository implements IChatRepository {
  async create(message: ChatMessage): Promise<ChatMessage> {
    const newMessage = new ChatMessageModel(message);
    const savedMessage = await newMessage.save();
    return savedMessage.toObject() as ChatMessage;
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const message = await ChatMessageModel.findById(id).exec();
    return message ? (message.toObject() as ChatMessage) : null;
  }

  async findByParticipants(senderId: string, receiverId: string, params: QueryParams): Promise<ChatMessage[]> {
    const query = {
      $or: [
        { senderId, receiverId, isDeleted: false },
        { senderId: receiverId, receiverId: senderId, isDeleted: false },
      ],
    };
    // const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const messages = await ChatMessageModel.find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return messages.map((msg) => msg.toObject() as ChatMessage);
  }

  async softDelete(id: string): Promise<void> {
    await ChatMessageModel.findByIdAndUpdate(id, { isDeleted: true }).exec();
  }

  async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]> {
    const query = {
      $or: [
        { senderId: userId, isDeleted: false },
        { receiverId: userId, isDeleted: false },
      ],
    };
    const { page, limit } = QueryBuilder.validateParams(params);

    const messages = await ChatMessageModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return messages.map((msg) => msg.toObject() as ChatMessage);
  }

  async getInbox(userId: string, params: QueryParams): Promise<InboxEntry[]> {
    const { page, limit } = QueryBuilder.validateParams(params);

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
        $sort: { 'message.createdAt': -1 },
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
            _id: '$message._id',
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

    const inboxEntries = await ChatMessageModel.aggregate(pipeline).exec();
    logger.info('getInbox: userId=', userId, 'inboxEntries=', inboxEntries);
    console.log('getInbox: userId=', userId, 'inboxEntries=', inboxEntries);

    return inboxEntries.map((entry) => ({
      partnerId: entry.partnerId,
      latestMessage: entry.latestMessage ? (entry.latestMessage as ChatMessage) : null,
    }));
  }
}
