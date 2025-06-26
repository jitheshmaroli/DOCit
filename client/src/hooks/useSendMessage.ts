import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { sendMessage } from '../services/messageService';
import { Message } from '../types/messageTypes';
import { useAppSelector } from '../redux/hooks';
import { SocketManager } from '../services/SocketManager';

interface SendMessageProps {
  receiverId: string;
  messageText: string;
}

export const useSendMessage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [sending, setSending] = useState(false);
  const socketManager = SocketManager.getInstance();

  const send = useCallback(
    async ({
      receiverId,
      messageText,
    }: SendMessageProps): Promise<Message | null> => {
      if (!messageText.trim() || !receiverId || !user?._id) return null;
      if (sending) return null;

      setSending(true);

      try {
        const savedMessage = await sendMessage(receiverId, messageText);
        const updatedMessage: Message = {
          _id: savedMessage._id,
          message: savedMessage.message,
          senderId: savedMessage.senderId,
          senderName: user.name || 'User',
          createdAt: savedMessage.createdAt,
          isSender: true,
          receiverId,
          unreadBy: [receiverId],
          attachment: savedMessage.attachment,
          reactions: savedMessage.reactions || [],
        };
        // Emit only if message was successfully saved
        if (savedMessage) {
          socketManager.emit('sendMessage', updatedMessage);
        }
        return updatedMessage;
      } catch (error) {
        console.error('Send message error:', error);
        toast.error('Failed to send message');
        return null;
      } finally {
        setSending(false);
      }
    },
    [user?._id, user?.name, sending, socketManager]
  );

  return { sendMessage: send, sending };
};
