import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import { MessageInbox } from '../../components/MessageInbox';
import { ChatBox } from '../../components/ChatBox';
import { useSendMessage } from '../../hooks/useSendMessage';
import {
  fetchInbox,
  fetchMessages,
  fetchPartnerDetails,
  deleteMessage,
  markAsRead,
  sendAttachment,
} from '../../services/messageService';
import {
  Message,
  MessageThread,
  InboxThreadResponse,
  ChatMessageResponse,
} from '../../types/messageTypes';
import { useSocket } from '../../hooks/useSocket';
import ROUTES from '../../constants/routeConstants';
import { showError, showSuccess } from '../../utils/toastConfig';
import { MessageSquare } from 'lucide-react';

const Messages = () => {
  const { user } = useAppSelector((state) => state.auth);
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
  const { connect, registerHandlers, emit } = useSocket();

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
      prev.map((t) =>
        t.receiverId === selectedThread?.receiverId
          ? { ...t, unreadCount: 0 }
          : t
      )
    );
    setSelectedThread((prev) => (prev ? { ...prev, unreadCount: 0 } : prev));
    inputRef.current?.focus();
  };

  const handleSendAttachment = async (file: File) => {
    if (!selectedThread?.receiverId || !user?._id) return;
    try {
      const senderName = user.name || 'User';
      const savedMessage = await sendAttachment(
        selectedThread.receiverId,
        senderName,
        file
      );
      const displayText = file.type.startsWith('image/') ? 'Photo' : file.name;
      const updatedMessage: Message = {
        _id: savedMessage._id,
        message: displayText,
        senderId: user._id,
        senderName,
        createdAt: savedMessage.createdAt,
        isSender: true,
        receiverId: selectedThread.receiverId,
        unreadBy: [selectedThread.receiverId],
        attachment: savedMessage.attachment,
        reactions: savedMessage.reactions || [],
      };
      await emit('sendMessage', updatedMessage);
      const latestMessage = {
        _id: updatedMessage._id,
        message: displayText,
        createdAt: updatedMessage.createdAt,
        isSender: true,
      };
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, updatedMessage],
              createdAt: updatedMessage.createdAt,
              latestMessage,
              unreadCount: 0,
            }
          : prev
      );
      setThreads((prev) => {
        const idx = prev.findIndex(
          (t) => t.receiverId === selectedThread.receiverId
        );
        if (idx >= 0) {
          const ut = [...prev];
          ut[idx] = {
            ...ut[idx],
            messages: [...ut[idx].messages, updatedMessage],
            createdAt: updatedMessage.createdAt,
            latestMessage,
            unreadCount: 0,
          };
          return ut.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return prev;
      });
    } catch {
      showError('Failed to send attachment');
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    registerHandlers({
      onReceiveMessage: async (message: Message) => {
        if (message.senderId === user._id) return;
        const partnerId = message.senderId;
        let partnerName = message.senderName || 'Unknown';
        let partnerProfilePicture: string | undefined;
        let partnerRole: 'patient' | 'doctor' = 'patient';
        try {
          const partner = await fetchPartnerDetails(partnerId);
          partnerName = partner.name;
          partnerProfilePicture = partner.profilePicture;
          partnerRole = partner.role;
        } catch {
          /* noop */
        }
        const displayText =
          message.message ||
          (message.attachment?.type?.startsWith('image/')
            ? 'Photo'
            : message.attachment?.name || 'Media');
        const newMsgObj: Message = {
          ...message,
          senderName: partnerName,
          isSender: false,
          receiverId: partnerId,
          unreadBy: message.unreadBy || [],
        };
        setThreads((prev) => {
          const idx = prev.findIndex((t) => t.receiverId === partnerId);
          const isViewing = selectedThread?.receiverId === partnerId;
          const incUnread = !isViewing || !isAtBottom();
          if (idx >= 0) {
            const ut = [...prev];
            if (ut[idx].messages.some((m) => m._id === newMsgObj._id))
              return prev;
            ut[idx] = {
              ...ut[idx],
              senderName: partnerName,
              partnerProfilePicture,
              role: partnerRole,
              messages: [...ut[idx].messages, newMsgObj],
              createdAt: message.createdAt,
              latestMessage: {
                _id: message._id,
                message: displayText,
                createdAt: message.createdAt,
                isSender: false,
              },
              unreadCount: incUnread
                ? ut[idx].unreadCount + 1
                : ut[idx].unreadCount,
            };
            return ut.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          }
          const nt: MessageThread = {
            id: partnerId,
            senderId: user._id,
            receiverId: partnerId,
            senderName: partnerName,
            subject: 'Conversation',
            createdAt: message.createdAt,
            partnerProfilePicture,
            latestMessage: {
              _id: message._id,
              message: displayText,
              createdAt: message.createdAt,
              isSender: false,
            },
            messages: [newMsgObj],
            unreadCount: 1,
            isOnline: false,
            lastSeen: null,
            role: partnerRole,
          };
          return [nt, ...prev].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        if (selectedThread?.receiverId === partnerId) {
          setSelectedThread((prev) => {
            if (!prev || prev.messages.some((m) => m._id === newMsgObj._id))
              return prev;
            return {
              ...prev,
              senderName: partnerName,
              partnerProfilePicture,
              role: partnerRole,
              messages: [...prev.messages, newMsgObj],
              createdAt: message.createdAt,
              latestMessage: {
                _id: message._id,
                message: displayText,
                createdAt: message.createdAt,
                isSender: false,
              },
              unreadCount: isAtBottom() ? 0 : prev.unreadCount + 1,
            };
          });
          if (!isAtBottom()) setNewMessagesCount((p) => p + 1);
        }
      },
      onError: (error: { message: string }) => {
        if (
          error.message.includes('Authentication') ||
          error.message.includes('Invalid user role')
        )
          navigate('/login');
      },
      onUserStatusUpdate: (status) => {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === status.userId
              ? { ...t, isOnline: status.isOnline, lastSeen: status.lastSeen }
              : t
          )
        );
        if (selectedThread?.id === status.userId)
          setSelectedThread((prev) =>
            prev
              ? {
                  ...prev,
                  isOnline: status.isOnline,
                  lastSeen: status.lastSeen,
                }
              : prev
          );
      },
    });
    connect(user._id);
  }, [
    user?._id,
    connect,
    registerHandlers,
    navigate,
    selectedThread?.receiverId,
    selectedThread?.id,
    isAtBottom,
    emit,
  ]);

  const { sendMessage } = useSendMessage();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const inboxThreads = await fetchInbox();
        const enriched = await Promise.all(
          inboxThreads.map(async (t: InboxThreadResponse) => {
            let senderName = t.senderName || 'Unknown';
            let partnerProfilePicture: string | undefined;
            let role: 'patient' | 'doctor' = 'patient';
            try {
              const p = await fetchPartnerDetails(t.receiverId);
              senderName = p.name;
              partnerProfilePicture = p.profilePicture;
              role = p.role;
            } catch {
              /* noop */
            }
            return {
              id: t._id,
              receiverId: t.receiverId,
              senderName,
              subject: t.subject || 'Conversation',
              createdAt: t.createdAt,
              partnerProfilePicture,
              latestMessage: t.latestMessage
                ? {
                    _id: t.latestMessage._id,
                    message: t.latestMessage.message,
                    createdAt: t.latestMessage.createdAt,
                    isSender: t.latestMessage.isSender,
                  }
                : null,
              messages: [],
              unreadCount: t.unreadCount || 0,
              isOnline: t.isOnline,
              lastSeen: t.lastSeen,
              role,
            };
          })
        );
        setThreads(
          enriched.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchThreads();
  }, [user?._id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get('thread');
    if (threadId && !loading && !selectedThread) {
      const thread = threads.find((t) => t.receiverId === threadId);
      if (thread) {
        setSelectedThread({ ...thread, unreadCount: 0 });
        setThreads((prev) =>
          prev.map((t) =>
            t.receiverId === threadId ? { ...t, unreadCount: 0 } : t
          )
        );
        navigate(ROUTES.DOCTOR.MESSAGES, { replace: true });
      } else {
        (async () => {
          try {
            const partner = await fetchPartnerDetails(threadId);
            const nt: MessageThread = {
              id: threadId,
              senderId: user?._id,
              receiverId: threadId,
              senderName: partner.name || 'Unknown',
              subject: 'Conversation',
              createdAt: new Date().toISOString(),
              partnerProfilePicture: partner.profilePicture,
              latestMessage: null,
              messages: [],
              unreadCount: 0,
              isOnline: false,
              lastSeen: null,
              role: partner.role || 'patient',
            };
            setThreads((prev) =>
              Array.from(
                new Map([...prev, nt].map((t) => [t.receiverId, t])).values()
              ).sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
            );
            setSelectedThread(nt);
            navigate(ROUTES.DOCTOR.MESSAGES, { replace: true });
          } catch {
            navigate(ROUTES.DOCTOR.MESSAGES, { replace: true });
          }
        })();
      }
    }
  }, [threads, loading, selectedThread, location.search, navigate, user?._id]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread?.receiverId || !user?._id) return;
      try {
        const messages = await fetchMessages(selectedThread.receiverId);
        const formatted = messages.map((msg: ChatMessageResponse) => ({
          _id: msg._id,
          message: msg.message,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Unknown',
          createdAt: msg.createdAt,
          isSender: msg.senderId === user._id,
          receiverId: selectedThread.receiverId,
          unreadBy: msg.unreadBy || [],
          attachment: msg.attachment,
          reactions: msg.reactions || [],
        }));
        setSelectedThread((prev) =>
          prev ? { ...prev, messages: formatted, unreadCount: 0 } : prev
        );
        setThreads((prev) =>
          prev.map((t) =>
            t.receiverId === selectedThread.receiverId
              ? { ...t, messages: formatted, unreadCount: 0 }
              : t
          )
        );
        for (const msg of formatted.filter((m: Message) =>
          m.unreadBy?.includes(user._id)
        ))
          await markAsRead(msg._id);
        inputRef.current?.focus();
      } catch {
        /* noop */
      }
    };
    loadMessages();
  }, [selectedThread?.receiverId, user?._id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread?.receiverId || !newMessage.trim()) return;
    const message = await sendMessage({
      receiverId: selectedThread.receiverId,
      messageText: newMessage,
    });
    if (message) {
      const latest = {
        _id: message._id,
        message: message.message,
        createdAt: message.createdAt,
        isSender: true,
      };
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.some((m) => m._id === message._id)
                ? prev.messages
                : [...prev.messages, message],
              createdAt: message.createdAt,
              latestMessage: latest,
              unreadCount: 0,
            }
          : prev
      );
      setThreads((prev) => {
        const idx = prev.findIndex(
          (t) => t.receiverId === selectedThread.receiverId
        );
        if (idx >= 0) {
          const ut = [...prev];
          if (ut[idx].messages.some((m) => m._id === message._id)) return prev;
          ut[idx] = {
            ...ut[idx],
            messages: [...ut[idx].messages, message],
            createdAt: message.createdAt,
            latestMessage: latest,
            unreadCount: 0,
          };
          return ut.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        const nt: MessageThread = {
          id: selectedThread.receiverId,
          senderId: user?._id,
          receiverId: selectedThread.receiverId,
          senderName: selectedThread.senderName,
          subject: selectedThread.subject,
          createdAt: message.createdAt,
          partnerProfilePicture: selectedThread.partnerProfilePicture,
          latestMessage: latest,
          messages: [message],
          unreadCount: 0,
          isOnline: selectedThread.isOnline,
          lastSeen: selectedThread.lastSeen,
          role: selectedThread.role,
        };
        return [nt, ...prev].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setNewMessage('');
    }
  };

  const handleDeleteMessages = async (messageIds: string[]) => {
    try {
      for (const id of messageIds) await deleteMessage(id);
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter(
                (m) => !messageIds.includes(m._id)
              ),
            }
          : prev
      );
      setThreads((prev) =>
        prev.map((t) =>
          t.receiverId === selectedThread?.receiverId
            ? {
                ...t,
                messages: t.messages.filter((m) => !messageIds.includes(m._id)),
              }
            : t
        )
      );
      showSuccess('Messages deleted successfully');
    } catch {
      /* noop */
    }
  };

  return (
    // h-full fills the <main> from the layout; flex-col stacks header + chat
    <div className="h-full flex flex-col gap-4 animate-fade-in">
      {/* Page header — fixed height, never grows */}
      <div className="page-header flex-shrink-0">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">Chat with your patients</p>
        </div>
      </div>

      {/* Chat area — flex-1 + min-h-0 fills remaining height; children handle their own scroll */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
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
            inputRef.current?.focus();
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
            onSendAttachment={handleSendAttachment}
            onBackToInbox={() => setSelectedThread(null)}
            messagesEndRef={messagesEndRef}
            chatContainerRef={chatContainerRef}
            newMessagesCount={newMessagesCount}
            onScrollToBottom={scrollToBottom}
            isAtBottom={isAtBottom}
            onDeleteMessages={handleDeleteMessages}
            currentUserId={user!._id}
          />
        ) : (
          <div className="flex-1 card flex flex-col items-center justify-center gap-4 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
              <MessageSquare size={28} className="text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">
                No conversation selected
              </p>
              <p className="text-sm text-text-muted">
                Choose a thread from the inbox to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
