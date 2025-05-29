import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { sendMessage } from '../services/messageService';
import { Message, VideoCallSignal } from '../types/messageTypes';
import { useAppSelector } from '../redux/hooks';

interface SendMessageProps {
  receiverId: string;
  messageText: string;
  emit: (event: string, data: Message | VideoCallSignal) => void;
}

export const useSendMessage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [sending, setSending] = useState(false);

  const send = useCallback(
    async ({
      receiverId,
      messageText,
      emit,
    }: SendMessageProps): Promise<Message | null> => {
      if (!messageText.trim() || !receiverId || !user?._id) return null;
      if (sending) return null;

      setSending(true);

      try {
        const savedMessage = await sendMessage(receiverId, messageText);
        const updatedMessage: Message = {
          id: savedMessage.id,
          message: savedMessage.message,
          senderId: savedMessage.senderId,
          senderName: user.name || 'User',
          timestamp: savedMessage.timestamp,
          isSender: true,
          receiverId,
        };
        emit('sendMessage', updatedMessage);
        toast.success('Message sent!');
        return updatedMessage;
      } catch (error) {
        console.error('Send message error:', error);
        toast.error('Failed to send message');
        return null;
      } finally {
        setSending(false);
      }
    },
    [user, sending]
  );

  return { sendMessage: send, sending };
};
