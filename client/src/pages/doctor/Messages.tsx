import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppSelector } from '../../redux/hooks';
import { MessageInbox } from '../../components/MessageInbox';
import { ChatBox } from '../../components/ChatBox';
import { useSocket } from '../../hooks/useSocket';
import { useSendMessage } from '../../hooks/useSendMessage';
import {
  fetchInbox,
  fetchMessages,
  fetchPartnerDetails,
} from '../../services/messageService';
import {
  Message,
  MessageThread,
  InboxThreadResponse,
} from '../../types/messageTypes';

const Messages = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(
    null
  );
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const { emit } = useSocket(user?._id, {
    onReceiveMessage: (message: Message) => {
      if (message.senderId === user?._id) return;
      const partnerId = message.isSender
        ? selectedThread?.receiverId
        : message.senderId;

      const newMessageObj: Message = {
        ...message,
        isSender: message.senderId === user?._id,
        receiverId: partnerId,
      };

      setThreads((prev) => {
        const threadIndex = prev.findIndex((t) => t.receiverId === partnerId);
        const newMessageObj: Message = {
          ...message,
          isSender: message.senderId === user?._id,
          receiverId: partnerId,
        };

        if (threadIndex >= 0) {
          const updatedThreads = [...prev];
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            messages: [
              ...updatedThreads[threadIndex].messages,
              newMessageObj,
            ].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            ),
            timestamp: message.timestamp,
            latestMessage: {
              _id: message.id,
              message: message.message,
              createdAt: message.timestamp,
              isSender: newMessageObj.isSender,
            },
          };
          return updatedThreads.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }

        const newThread: MessageThread = {
          id: partnerId || message.senderId,
          receiverId: partnerId || message.senderId,
          senderName: message.senderName || 'Unknown',
          subject: 'Conversation',
          timestamp: message.timestamp,
          latestMessage: {
            _id: message.id,
            message: message.message,
            createdAt: message.timestamp,
            isSender: newMessageObj.isSender,
          },
          messages: [newMessageObj],
        };
        return [newThread, ...prev].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      if (selectedThread?.receiverId === partnerId) {
        setSelectedThread((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMessageObj].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                ),
                timestamp: message.timestamp,
                latestMessage: {
                  _id: message.id,
                  message: message.message,
                  createdAt: message.timestamp,
                  isSender: newMessageObj.isSender,
                },
              }
            : prev
        );
      }
    },
  });

  const { sendMessage } = useSendMessage();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const inboxThreads = await fetchInbox();
        const enrichedThreads = await Promise.all(
          inboxThreads.map(async (thread: InboxThreadResponse) => {
            let senderName = thread.senderName || 'Unknown';
            let partnerProfilePicture: string | undefined;
            try {
              const partner = await fetchPartnerDetails(
                thread.receiverId,
                'patient'
              );
              senderName = partner.name;
              partnerProfilePicture = partner.profilePicture;
            } catch (error) {
              console.error(
                `Failed to fetch details for user ${thread.receiverId}:`,
                error
              );
            }
            return {
              id: thread._id,
              receiverId: thread.receiverId,
              senderName,
              subject: thread.subject || 'Conversation',
              timestamp: thread.timestamp,
              partnerProfilePicture,
              latestMessage: thread.latestMessage
                ? {
                    _id: thread.latestMessage._id,
                    message: thread.latestMessage.message,
                    createdAt: thread.latestMessage.createdAt,
                    isSender: thread.latestMessage.isSender,
                  }
                : null,
              messages: [],
            };
          })
        );
        setThreads(
          enrichedThreads.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
      } catch (error) {
        console.error('Fetch inbox error:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) {
      fetchThreads();
    }
  }, [user?._id]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread?.receiverId) return;
      try {
        const messages = await fetchMessages(selectedThread.receiverId);
        const formattedMessages = messages.map((msg) => ({
          id: msg._id,
          message: msg.message,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          timestamp: msg.timestamp,
          isSender: msg.senderId === user?._id,
          receiverId: selectedThread.receiverId,
        }));
        setSelectedThread((prev) =>
          prev ? { ...prev, messages: formattedMessages } : prev
        );
        setThreads((prev) =>
          prev.map((thread) =>
            thread.receiverId === selectedThread.receiverId
              ? { ...thread, messages: formattedMessages }
              : thread
          )
        );
      } catch (error) {
        console.error('Fetch messages error:', error);
      }
    };
    loadMessages();
  }, [selectedThread?.receiverId, user?._id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread?.receiverId) return;

    const message = await sendMessage({
      receiverId: selectedThread.receiverId,
      messageText: newMessage,
      emit,
    });

    if (message) {
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              ),
              timestamp: message.timestamp,
              latestMessage: {
                _id: message.id,
                message: message.message,
                createdAt: message.timestamp,
                isSender: true,
              },
            }
          : prev
      );
      setThreads((prev) => {
        const threadIndex = prev.findIndex(
          (t) => t.receiverId === selectedThread.receiverId
        );
        if (threadIndex >= 0) {
          const updatedThreads = [...prev];
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            messages: [...updatedThreads[threadIndex].messages, message].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            ),
            timestamp: message.timestamp,
            latestMessage: {
              _id: message.id,
              message: message.message,
              createdAt: message.timestamp,
              isSender: true,
            },
          };
          return updatedThreads.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }
        return prev;
      });
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8">
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Messages
        </h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <MessageInbox
            threads={threads}
            selectedThreadId={selectedThread?.id || null}
            onSelectThread={setSelectedThread}
            loading={loading}
          />
          {selectedThread && (
            <ChatBox
              thread={selectedThread}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onBackToInbox={() => setSelectedThread(null)}
              isVideoCallDisabled
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
