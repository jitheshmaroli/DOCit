import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { MessageInbox } from '../../../components/MessageInbox';
import { ChatBox } from '../../../components/ChatBox';
import { useSendMessage } from '../../../hooks/useSendMessage';
import {
  fetchInbox,
  fetchMessages,
  fetchPartnerDetails,
  deleteMessage,
  markAsRead,
} from '../../../services/messageService';
import {
  Message,
  MessageThread,
  InboxThreadResponse,
  ChatMessageResponse,
} from '../../../types/messageTypes';
import { useSocket } from '../../../hooks/useSocket';
import ROUTES from '../../../constants/routeConstants';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';

const Messages: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
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
  const { connect, registerHandlers } = useSocket();
  const patientId = user?._id;

  useEffect(() => {
    if (!patientId) {
      navigate(ROUTES.PUBLIC.LOGIN);
    }
  }, [patientId, navigate]);

  const isAtBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 20;
  }, []);

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

  useEffect(() => {
    if (!patientId) return;

    registerHandlers({
      onReceiveMessage: async (message: Message) => {
        if (message.senderId === patientId) return;
        const partnerId = message.senderId;
        let partnerName = message.senderName || 'Unknown';
        let partnerProfilePicture: string | undefined;
        let partnerRole: 'patient' | 'doctor' = 'doctor';

        try {
          const partner = await fetchPartnerDetails(partnerId);
          partnerName = partner.name;
          partnerProfilePicture = partner.profilePicture;
          partnerRole = partner.role;
        } catch (error) {
          console.error(
            `Failed to fetch details for user ${partnerId}:`,
            error
          );
        }

        const newMessageObj: Message = {
          ...message,
          senderName: partnerName,
          isSender: false,
          receiverId: partnerId,
          unreadBy: message.unreadBy || [],
        };

        setThreads((prev) => {
          const threadIndex = prev.findIndex((t) => t.receiverId === partnerId);
          const isViewingThread = selectedThread?.receiverId === partnerId;
          const incrementUnread = !isViewingThread || !isAtBottom();
          if (threadIndex >= 0) {
            const updatedThreads = [...prev];
            if (
              updatedThreads[threadIndex].messages.some(
                (msg) => msg._id === newMessageObj._id
              )
            ) {
              return prev;
            }
            updatedThreads[threadIndex] = {
              ...updatedThreads[threadIndex],
              senderName: partnerName,
              partnerProfilePicture,
              role: partnerRole,
              messages: [
                ...updatedThreads[threadIndex].messages,
                newMessageObj,
              ],
              createdAt: message.createdAt,
              latestMessage: {
                _id: message._id,
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
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          }
          const newThread: MessageThread = {
            id: partnerId,
            senderId: patientId,
            receiverId: partnerId,
            senderName: partnerName,
            subject: 'Conversation',
            createdAt: message.createdAt,
            partnerProfilePicture,
            latestMessage: {
              _id: message._id,
              message: message.message,
              createdAt: message.createdAt,
              isSender: false,
            },
            messages: [newMessageObj],
            unreadCount: 1,
            isOnline: false,
            lastSeen: null,
            role: partnerRole,
          };
          return [newThread, ...prev].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        if (selectedThread?.receiverId === partnerId) {
          setSelectedThread((prev) => {
            if (!prev) return prev;
            if (prev.messages.some((msg) => msg._id === newMessageObj._id)) {
              return prev;
            }
            return {
              ...prev,
              senderName: partnerName,
              partnerProfilePicture,
              role: partnerRole,
              messages: [...prev.messages, newMessageObj],
              createdAt: message.createdAt,
              latestMessage: {
                _id: message._id,
                message: message.message,
                createdAt: message.createdAt,
                isSender: false,
              },
              unreadCount: isAtBottom() ? 0 : prev.unreadCount + 1,
            };
          });
          if (isAtBottom()) {
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                  top: chatContainerRef.current.scrollHeight,
                  behavior: 'smooth',
                });
              }
              inputRef.current?.focus();
            }, 100);
          } else {
            setNewMessagesCount((prev) => prev + 1);
          }
        }
      },
      onError: (error: { message: string }) => {
        if (
          error.message.includes('Authentication') ||
          error.message.includes('Invalid user role')
        ) {
          navigate(ROUTES.PUBLIC.LOGIN);
        }
      },
      onUserStatusUpdate: (status) => {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === status.userId
              ? {
                  ...thread,
                  isOnline: status.isOnline,
                  lastSeen: status.lastSeen,
                }
              : thread
          )
        );
        if (selectedThread?.id === status.userId) {
          setSelectedThread((prev) =>
            prev
              ? {
                  ...prev,
                  isOnline: status.isOnline,
                  lastSeen: status.lastSeen,
                }
              : prev
          );
        }
      },
    });

    connect(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    patientId,
    connect,
    registerHandlers,
    navigate,
    selectedThread?.receiverId,
    isAtBottom,
  ]);

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
            let role: 'patient' | 'doctor' = 'doctor';
            try {
              const partner = await fetchPartnerDetails(thread.receiverId);
              senderName = partner.name;
              partnerProfilePicture = partner.profilePicture;
              role = partner.role;
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
              unreadCount: thread.unreadCount || 0,
              isOnline: thread.isOnline,
              lastSeen: thread.lastSeen,
              role,
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
        toast.error('Failed to load inbox', {
          position: 'bottom-right',
          autoClose: 3000,
          className:
            'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
        });
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
    if (threadId && !loading && !selectedThread) {
      const existingThread = threads.find((t) => t.receiverId === threadId);
      if (existingThread) {
        setSelectedThread({ ...existingThread, unreadCount: 0 });
        setThreads((prev) =>
          prev.map((t) =>
            t.receiverId === threadId ? { ...t, unreadCount: 0 } : t
          )
        );
        // Do not navigate away, just update the thread
      } else {
        const createNewThread = async () => {
          try {
            const partner = await fetchPartnerDetails(threadId);
            const newThread: MessageThread = {
              id: threadId,
              senderId: patientId,
              receiverId: threadId,
              senderName: partner.name || 'Unknown Doctor',
              subject: 'Conversation',
              createdAt: new Date().toISOString(),
              partnerProfilePicture: partner.profilePicture,
              latestMessage: null,
              messages: [],
              unreadCount: 0,
              isOnline: false,
              lastSeen: null,
              role: partner.role || 'doctor',
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
          } catch (error) {
            console.error('Failed to create new thread:', error);
            toast.error('Failed to open chat', {
              position: 'bottom-right',
              autoClose: 3000,
              className:
                'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
            });
          }
        };
        createNewThread();
      }
    }
  }, [threads, loading, location.search, selectedThread, patientId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread?.receiverId) return;
      try {
        const messages = await fetchMessages(selectedThread.receiverId);
        const formattedMessages = messages.map((msg: ChatMessageResponse) => ({
          _id: msg._id,
          message: msg.message,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          createdAt: msg.createdAt,
          isSender: msg.senderId === patientId,
          receiverId: selectedThread.receiverId,
          unreadBy: msg.unreadBy || [],
          attachment: msg.attachment,
          reactions: msg.reactions || [],
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
        const unreadMessages = formattedMessages.filter((msg: Message) =>
          msg.unreadBy?.includes(patientId as string)
        );
        for (const msg of unreadMessages) {
          await markAsRead(msg._id);
        }
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
        toast.error('Failed to load messages', {
          position: 'bottom-right',
          autoClose: 3000,
          className:
            'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
        });
      }
    };
    loadMessages();
  }, [selectedThread?.receiverId, patientId, isAtBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread?.receiverId || !newMessage.trim()) return;

    const message = await sendMessage({
      receiverId: selectedThread.receiverId,
      messageText: newMessage,
    });

    if (message) {
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.some((msg) => msg._id === message._id)
                ? prev.messages
                : [...prev.messages, message],
              createdAt: message.createdAt,
              latestMessage: {
                _id: message._id,
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
          if (
            updatedThreads[threadIndex].messages.some(
              (msg) => msg._id === message._id
            )
          ) {
            return prev;
          }
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            messages: [...updatedThreads[threadIndex].messages, message],
            createdAt: message.createdAt,
            latestMessage: {
              _id: message._id,
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
          senderId: patientId,
          receiverId: selectedThread.receiverId,
          senderName: selectedThread.senderName,
          subject: selectedThread.subject,
          createdAt: message.createdAt,
          partnerProfilePicture: selectedThread.partnerProfilePicture,
          latestMessage: {
            _id: message._id,
            message: message.message,
            createdAt: message.createdAt,
            isSender: true,
          },
          messages: [message],
          unreadCount: 0,
          isOnline: selectedThread.isOnline,
          lastSeen: selectedThread.lastSeen,
          role: selectedThread.role,
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

  const handleDeleteMessages = async (messageIds: string[]) => {
    try {
      for (const messageId of messageIds) {
        await deleteMessage(messageId);
      }
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter(
                (msg) => !messageIds.includes(msg._id)
              ),
            }
          : prev
      );
      setThreads((prev) =>
        prev.map((thread) =>
          thread.receiverId === selectedThread?.receiverId
            ? {
                ...thread,
                messages: thread.messages.filter(
                  (msg) => !messageIds.includes(msg._id)
                ),
              }
            : thread
        )
      );
      toast.success('Messages deleted successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        className:
          'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
      });
    } catch (error) {
      console.error('Failed to delete messages:', error);
      toast.error('Failed to delete messages', {
        position: 'bottom-right',
        autoClose: 3000,
        className:
          'bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 py-6 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="bottom-right" theme="dark" />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto"
      >
        <div className="bg-white/10 backdrop-blur-lg py-6 rounded-2xl border border-white/20 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent text-center">
            Messages
          </h2>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-10rem)]"
        >
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
          {selectedThread && patientId ? (
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
              onDeleteMessages={handleDeleteMessages}
              currentUserId={patientId}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full lg:w-2/3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex items-center justify-center text-gray-300"
            >
              Select a conversation to start chatting
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Messages;
