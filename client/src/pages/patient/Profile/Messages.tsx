import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MessageInbox } from '../../../components/MessageInbox';
import { ChatBox } from '../../../components/ChatBox';
import { useSocket } from '../../../hooks/useSocket';
import { useSendMessage } from '../../../hooks/useSendMessage';
import {
  fetchInbox,
  fetchMessages,
  fetchPartnerDetails,
} from '../../../services/messageService';
import {
  Message,
  MessageThread,
  InboxThreadResponse,
} from '../../../types/messageTypes';

interface MessagesProps {
  patientId: string;
}

const Messages = ({ patientId }: MessagesProps) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { emit } = useSocket(patientId, {
    onReceiveMessage: async (message: Message) => {
      if (message.senderId === patientId) return;
      const partnerId = message.senderId;
      let partnerName = message.senderName || 'Unknown';
      let partnerProfilePicture: string | undefined;

      try {
        const partner = await fetchPartnerDetails(partnerId);
        partnerName = partner.name;
        partnerProfilePicture = partner.profilePicture;
      } catch (error) {
        console.error('Fetch partner details error:', error);
      }

      const newMessageObj: Message = {
        ...message,
        senderName: partnerName,
        isSender: false,
      };

      setThreads((prev) => {
        const threadIndex = prev.findIndex((t) => t.receiverId === partnerId);
        if (threadIndex >= 0) {
          const updatedThreads = [...prev];
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            senderName: partnerName,
            partnerProfilePicture,
            messages: [...updatedThreads[threadIndex].messages, newMessageObj],
            timestamp: message.timestamp,
            latestMessage: {
              _id: message.id,
              message: message.message,
              createdAt: message.timestamp,
              isSender: false,
            },
          };
          return updatedThreads.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }
        const newThread: MessageThread = {
          id: partnerId,
          receiverId: partnerId,
          senderName: partnerName,
          subject: 'Conversation',
          timestamp: message.timestamp,
          partnerProfilePicture,
          latestMessage: {
            _id: message.id,
            message: message.message,
            createdAt: message.timestamp,
            isSender: false,
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
                senderName: partnerName,
                partnerProfilePicture,
                messages: [...prev.messages, newMessageObj],
                timestamp: message.timestamp,
                latestMessage: {
                  _id: message.id,
                  message: message.message,
                  createdAt: message.timestamp,
                  isSender: false,
                },
              }
            : prev
        );
        if (!isAtBottom()) {
          setNewMessagesCount((prev) => prev + 1);
        }
      }
    },
  });

  const { sendMessage } = useSendMessage();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const inboxThreads = await fetchInbox();
        const formattedThreads = await Promise.all(
          inboxThreads.map(async (thread: InboxThreadResponse) => {
            let senderName = thread.senderName || 'Unknown';
            let partnerProfilePicture: string | undefined;
            try {
              const partner = await fetchPartnerDetails(thread.receiverId);
              senderName = partner.name;
              partnerProfilePicture = partner.profilePicture;
            } catch (error) {
              console.error(`Failed to fetch details for user ${thread.receiverId}:`, error);
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
        setThreads(formattedThreads.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Fetch inbox error:', error);
        toast.error('Failed to load inbox');
      } finally {
        setLoading(false);
      }
    };
    if (patientId) {
      fetchThreads();
    }
  }, [patientId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get('thread');
    if (threadId && threads.length > 0) {
      const thread = threads.find((t) => t.receiverId === threadId);
      if (thread) {
        setSelectedThread(thread);
        navigate('/patient/messages', { replace: true });
      }
    }
  }, [threads, location.search, navigate]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread?.receiverId) return;
      try {
        const messages = await fetchMessages(selectedThread.receiverId);
        const formattedMessages = messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          timestamp: msg.timestamp,
          isSender: msg.senderId === patientId,
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
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          inputRef.current?.focus();
        }, 100);
      } catch (error) {
        console.error('Fetch messages error:', error);
        toast.error('Failed to load messages');
      }
    };
    loadMessages();
  }, [selectedThread?.receiverId, patientId]);

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
              messages: [...prev.messages, message],
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
            messages: [...updatedThreads[threadIndex].messages, message],
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
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  };

  const isAtBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 10;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessagesCount(0);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
          Messages
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
          <MessageInbox
            threads={threads}
            selectedThreadId={selectedThread?.id || null}
            onSelectThread={(thread) => {
              setSelectedThread(thread);
              setNewMessagesCount(0);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            loading={loading}
          />
          {selectedThread ? (
            <ChatBox
              thread={selectedThread}
              newMessage={newMessage}
              inputRef={inputRef}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onBackToInbox={() => setSelectedThread(null)}
              messagesEndRef={messagesEndRef}
              chatContainerRef={chatContainerRef}
              newMessagesCount={newMessagesCount}
              onScrollToBottom={scrollToBottom}
            />
          ) : (
            <div className="w-full lg:w-2/3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex items-center justify-center text-gray-200">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;