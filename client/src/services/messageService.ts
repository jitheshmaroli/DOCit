import { ChatMessageResponse } from '../types/messageTypes';
import api from './api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const fetchInbox = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/chat/inbox`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Fetch inbox error:', error);
    throw error;
  }
};

export const fetchMessages = async (receiverId: string) => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/chat/${receiverId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Fetch messages error:', error);
    throw error;
  }
};

export const fetchPartnerDetails = async (userId: string) => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Fetch partner details error:', error);
    throw error;
  }
};

export const sendMessage = async (receiverId: string, message: string) => {
  try {
    const response = await api.post<ChatMessageResponse>(
      `${API_BASE_URL}/api/chat`,
      { receiverId, message }
    );
    return response.data;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};

export const sendAttachment = async (receiverId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', receiverId);
    const response = await api.post<ChatMessageResponse>(
      `${API_BASE_URL}/api/chat/attachment`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Send attachment error:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    await api.delete(`${API_BASE_URL}/api/chat/${messageId}`);
  } catch (error) {
    console.error('Delete message error:', error);
    throw error;
  }
};

export const markAsRead = async (messageId: string) => {
  try {
    await api.patch(`${API_BASE_URL}/api/chat/${messageId}/read`, {});
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

export const addReaction = async (messageId: string, emoji: string) => {
  try {
    const response = await api.patch<ChatMessageResponse>(
      `${API_BASE_URL}/api/chat/${messageId}/reaction`,
      { emoji }
    );
    return response.data;
  } catch (error) {
    console.error('Add reaction error:', error);
    throw error;
  }
};
