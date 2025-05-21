import api from './api';
import {
  InboxThreadResponse,
  ChatMessageResponse,
} from '../types/messageTypes';

export const fetchInbox = async (): Promise<InboxThreadResponse[]> => {
  const response = await api.get('/api/chat/inbox');
  return response.data;
};

export const fetchMessages = async (
  receiverId: string
): Promise<ChatMessageResponse[]> => {
  const response = await api.get(`/api/chat/${receiverId}`);
  return response.data;
};

export const sendMessage = async (
  receiverId: string,
  message: string
): Promise<ChatMessageResponse> => {
  const response = await api.post('/api/chat', { receiverId, message });
  return response.data;
};

export const fetchPartnerDetails = async (
  partnerId: string,
  role: 'doctor' | 'patient'
): Promise<{ name: string; profilePicture?: string }> => {
  const endpoint = role === 'patient' ? 'doctors' : 'patients';
  const response = await api.get(`/api/${endpoint}/${partnerId}`);
  return {
    name: response.data.name || 'Unknown',
    profilePicture: response.data.profilePicture,
  };
};
