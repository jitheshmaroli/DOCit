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
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(
    null
  );
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
        const isViewingThread = selectedThread?.receiverId === partnerId;
        const incrementUnread = !isViewingThread || !isAtBottom();
        if (threadIndex >= 0) {
          const updatedThreads = [...prev];
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            senderName: partnerName,
            partnerProfilePicture,
            messages: [...updatedThreads[threadIndex].messages, newMessageObj],
            createdAt: message.createdAt,
            latestMessage: {
              _id: message.id,
              message: message.message,
              createdAt: message.createdAt,
              isSender: false,
            },
            unreadCount: incrementUnread
              ? updatedThreads[threadIndex].unreadCount + 1
              : updatedThreads[threadIndex].unreadCount,
          };
          return updatedThreads.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        const newThread: MessageThread = {
          id: partnerId,
          receiverId: partnerId,
          senderName: partnerName,
          subject: 'Conversation',
          createdAt: message.createdAt,
          partnerProfilePicture,
          latestMessage: {
            _id: message.id,
            message: message.message,
            createdAt: message.createdAt,
            isSender: false,
          },
          messages: [newMessageObj],
          unreadCount: 1,
        };
        return [newThread, ...prev].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
                createdAt: message.createdAt,
                latestMessage: {
                  _id: message.id,
                  message: message.message,
                  createdAt: message.createdAt,
                  isSender: false,
                },
                unreadCount: isAtBottom() ? 0 : prev.unreadCount + 1,
              }
            : prev
        );
        if (isAtBottom()) {
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }
            inputRef.current?.focus();
          }, 100); // Increased delay to ensure DOM update
        } else {
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
              createdAt: thread.createdAt,
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
              unreadCount: 0,
            };
          })
        );
        setThreads(
          formattedThreads.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
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
    if (threadId && !loading) {
      const existingThread = threads.find((t) => t.receiverId === threadId);
      if (existingThread) {
        setSelectedThread({ ...existingThread, unreadCount: 0 });
        setThreads((prev) =>
          prev.map((t) =>
            t.receiverId === threadId ? { ...t, unreadCount: 0 } : t
          )
        );
        navigate('/patient/profile?tab=messages', { replace: true });
      } else {
        const createNewThread = async () => {
          try {
            const partner = await fetchPartnerDetails(threadId);
            const newThread: MessageThread = {
              id: threadId,
              receiverId: threadId,
              senderName: partner.name || 'Unknown Doctor',
              subject: 'Conversation',
              createdAt: new Date().toISOString(),
              partnerProfilePicture: partner.profilePicture,
              latestMessage: null,
              messages: [],
              unreadCount: 0,
            };
            setThreads((prev) => {
              if (prev.some((t) => t.receiverId === threadId)) {
                return prev;
              }
              return [newThread, ...prev].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );
            });
            setSelectedThread(newThread);
            navigate('/patient/profile?tab=messages', { replace: true });
          } catch (error) {
            console.error('Failed to create new thread:', error);
            toast.error('Failed to open chat');
            navigate('/patient/profile?tab=messages', { replace: true });
          }
        };
        createNewThread();
      }
    }
  }, [threads, loading, location.search, navigate]);

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
          createdAt: msg.createdAt,
          isSender: msg.senderId === patientId,
        }));
        setSelectedThread((prev) =>
          prev ? { ...prev, messages: formattedMessages, unreadCount: 0 } : prev
        );
        setThreads((prev) =>
          prev.map((thread) =>
            thread.receiverId === selectedThread.receiverId
              ? { ...thread, messages: formattedMessages, unreadCount: 0 }
              : thread
          )
        );
        setTimeout(() => {
          if (isAtBottom() && chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
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
    if (!selectedThread?.receiverId || !newMessage.trim()) return;

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
              createdAt: message.createdAt,
              latestMessage: {
                _id: message.id,
                message: message.message,
                createdAt: message.createdAt,
                isSender: true,
              },
              unreadCount: 0,
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
            createdAt: message.createdAt,
            latestMessage: {
              _id: message.id,
              message: message.message,
              createdAt: message.createdAt,
              isSender: true,
            },
            unreadCount: 0,
          };
          return updatedThreads.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        const newThread: MessageThread = {
          id: selectedThread.receiverId,
          receiverId: selectedThread.receiverId,
          senderName: selectedThread.senderName,
          subject: selectedThread.subject,
          createdAt: message.createdAt,
          partnerProfilePicture: selectedThread.partnerProfilePicture,
          latestMessage: {
            _id: message.id,
            message: message.message,
            createdAt: message.createdAt,
            isSender: true,
          },
          messages: [message],
          unreadCount: 0,
        };
        return [newThread, ...prev].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setNewMessage('');
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    setNewMessagesCount(0);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.receiverId === selectedThread?.receiverId
          ? { ...thread, unreadCount: 0 }
          : thread
      )
    );
    setSelectedThread((prev) => (prev ? { ...prev, unreadCount: 0 } : prev));
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
              setSelectedThread({ ...thread, unreadCount: 0 });
              setThreads((prev) =>
                prev.map((t) =>
                  t.receiverId === thread.receiverId
                    ? { ...t, unreadCount: 0 }
                    : t
                )
              );
              setNewMessagesCount(0);
              setTimeout(() => {
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                  });
                }
                inputRef.current?.focus();
              }, 100);
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
              isAtBottom={isAtBottom}
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
