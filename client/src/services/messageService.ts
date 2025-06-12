import axios from 'axios';
import { InboxThreadResponse, Message } from '../types/messageTypes';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const fetchInbox = async (): Promise<InboxThreadResponse[]> => {
  const response = await axios.get(`${API_URL}/api/chat/inbox`, {
    withCredentials: true,
  });
  return response.data;
};

export const fetchMessages = async (receiverId: string): Promise<Message[]> => {
  const response = await axios.get(`${API_URL}/api/chat/${receiverId}`, {
    withCredentials: true,
  });
  return response.data;
};

export const sendMessage = async (
  receiverId: string,
  messageText: string
): Promise<Message> => {
  const response = await axios.post(
    `${API_URL}/api/chat`,
    { receiverId, message: messageText },
    { withCredentials: true }
  );
  return response.data;
};

export const sendAttachment = async (
  receiverId: string,
  file: File
): Promise<Message> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('receiverId', receiverId);

  const response = await axios.post(
    `${API_URL}/api/chat/attachment`,
    formData,
    {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await axios.delete(`${API_URL}/api/chat/${messageId}`, {
    withCredentials: true,
  });
};

export const fetchPartnerDetails = async (
  partnerId: string
): Promise<{ name: string; profilePicture?: string }> => {
  const response = await axios.get(`${API_URL}/api/user/${partnerId}`, {
    withCredentials: true,
  });
  return response.data;
};
