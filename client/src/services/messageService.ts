import { AxiosError } from 'axios';
import {
  ChatMessageResponse,
  InboxThreadResponse,
} from '../types/messageTypes';
import api from './api';
import { ROUTES } from '../constants/routeConstants';

interface MessageApiError {
  message: string;
  status?: number;
}

export const fetchInbox = async () => {
  try {
    const response = await api.get<InboxThreadResponse[]>(
      ROUTES.API.MESSAGE.INBOX
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch inbox'
    );
  }
};

export const fetchMessages = async (receiverId: string) => {
  try {
    const response = await api.get<ChatMessageResponse[]>(
      ROUTES.API.MESSAGE.MESSAGES.replace(':receiverId', receiverId)
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch messages'
    );
  }
};

export const fetchPartnerDetails = async (userId: string) => {
  try {
    const response = await api.get(
      ROUTES.API.MESSAGE.PARTNER_DETAILS.replace(':userId', userId)
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    console.error('Fetch partner details error:', axiosError);
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch partner details'
    );
  }
};

export const fetchUserStatus = async (userId: string, role: string) => {
  try {
    const response = await api.get(
      ROUTES.API.MESSAGE.USER_STATUS.replace(':userId', userId).replace(
        ':role',
        role
      )
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch user status'
    );
  }
};

export const sendMessage = async (
  receiverId: string,
  message: string,
  senderName: string
) => {
  try {
    const response = await api.post<ChatMessageResponse>(
      ROUTES.API.MESSAGE.SEND_MESSAGE,
      {
        receiverId,
        message,
        senderName,
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to send message'
    );
  }
};

export const sendAttachment = async (receiverId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', receiverId);
    const response = await api.post<ChatMessageResponse>(
      ROUTES.API.MESSAGE.SEND_ATTACHMENT,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to send attachment'
    );
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    await api.delete(
      ROUTES.API.MESSAGE.DELETE_MESSAGE.replace(':messageId', messageId)
    );
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete message'
    );
  }
};

export const markAsRead = async (messageId: string) => {
  try {
    await api.patch(
      ROUTES.API.MESSAGE.MARK_AS_READ.replace(':messageId', messageId),
      {}
    );
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to mark message as read'
    );
  }
};

export const addReaction = async (
  messageId: string,
  emoji: string,
  replace: boolean = false
) => {
  try {
    const response = await api.patch<ChatMessageResponse>(
      ROUTES.API.MESSAGE.ADD_REACTION.replace(':messageId', messageId),
      {
        emoji,
        replace,
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<MessageApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to add reaction'
    );
  }
};
