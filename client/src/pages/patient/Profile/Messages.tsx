import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageInbox } from '../../../components/MessageInbox';
import { ChatBox } from '../../../components/ChatBox';
import { useSendMessage } from '../../../hooks/useSendMessage';
import {
  fetchInbox,
  fetchMessages,
  fetchPartnerDetails,
  deleteMessage,
  markAsRead,
  sendAttachment,
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
import { showError } from '../../../utils/toastConfig';
import { MessageSquare, Loader2 } from 'lucide-react';

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
  const { connect, registerHandlers, emit } = useSocket();
  const patientId = user?._id;

  useEffect(() => {
    if (!patientId) navigate(ROUTES.PUBLIC.LOGIN);
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
    if (!selectedThread?.receiverId || !patientId) return;
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
        senderId: patientId,
        senderName,
        createdAt: savedMessage.createdAt,
        isSender: true,
        receiverId: selectedThread.receiverId,
        unreadBy: [selectedThread.receiverId],
        attachment: savedMessage.attachment,
        reactions: savedMessage.reactions || [],
      };
      await emit('sendMessage', updatedMessage);
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, updatedMessage],
              createdAt: updatedMessage.createdAt,
              latestMessage: {
                _id: updatedMessage._id,
                message: displayText,
                createdAt: updatedMessage.createdAt,
                isSender: true,
              },
              unreadCount: 0,
            }
          : prev
      );
      setThreads((prev) => {
        const idx = prev.findIndex(
          (t) => t.receiverId === selectedThread.receiverId
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, updatedMessage],
            createdAt: updatedMessage.createdAt,
            latestMessage: {
              _id: updatedMessage._id,
              message: displayText,
              createdAt: updatedMessage.createdAt,
              isSender: true,
            },
            unreadCount: 0,
          };
          return updated.sort(
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
        } catch {
          /* ignore */
        }
        const displayText =
          message.message ||
          (message.attachment?.type?.startsWith('image/')
            ? 'Photo'
            : message.attachment?.name || 'Media');
        const newMsg: Message = {
          ...message,
          senderName: partnerName,
          isSender: false,
          receiverId: partnerId,
          unreadBy: message.unreadBy || [],
        };
        setThreads((prev) => {
          const idx = prev.findIndex((t) => t.receiverId === partnerId);
          const isViewing = selectedThread?.receiverId === partnerId;
          const inc = !isViewing || !isAtBottom();
          if (idx >= 0) {
            if (prev[idx].messages.some((m) => m._id === newMsg._id))
              return prev;
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              senderName: partnerName,
              partnerProfilePicture,
              role: partnerRole,
              messages: [...updated[idx].messages, newMsg],
              createdAt: message.createdAt,
              latestMessage: {
                _id: message._id,
                message: displayText,
                createdAt: message.createdAt,
                isSender: false,
              },
              unreadCount: inc
                ? updated[idx].unreadCount + 1
                : updated[idx].unreadCount,
            };
            return updated.sort(
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
              message: displayText,
              createdAt: message.createdAt,
              isSender: false,
            },
            messages: [newMsg],
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
            if (!prev || prev.messages.some((m) => m._id === newMsg._id))
              return prev;
            return {
              ...prev,
              senderName: partnerName,
              partnerProfilePicture,
              role: partnerRole,
              messages: [...prev.messages, newMsg],
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
          navigate(ROUTES.PUBLIC.LOGIN);
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
    connect(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    patientId,
    connect,
    registerHandlers,
    navigate,
    selectedThread?.receiverId,
    isAtBottom,
    emit,
  ]);

  const { sendMessage } = useSendMessage();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const inboxThreads = await fetchInbox();
        const formatted = await Promise.all(
          inboxThreads.map(async (thread: InboxThreadResponse) => {
            let senderName = thread.senderName || 'Unknown';
            let partnerProfilePicture: string | undefined;
            let role: 'patient' | 'doctor' = 'doctor';
            try {
              const partner = await fetchPartnerDetails(thread.receiverId);
              senderName = partner.name;
              partnerProfilePicture = partner.profilePicture;
              role = partner.role;
            } catch {
              /* ignore */
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
          formatted.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchThreads();
  }, [patientId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get('thread');
    if (!threadId || loading || selectedThread) return;
    const existing = threads.find((t) => t.receiverId === threadId);
    if (existing) {
      setSelectedThread({ ...existing, unreadCount: 0 });
      setThreads((prev) =>
        prev.map((t) =>
          t.receiverId === threadId ? { ...t, unreadCount: 0 } : t
        )
      );
    } else {
      (async () => {
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
          setThreads((prev) =>
            prev.some((t) => t.receiverId === threadId)
              ? prev
              : [newThread, ...prev].sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
          );
          setSelectedThread(newThread);
        } catch {
          /* ignore */
        }
      })();
    }
  }, [threads, loading, location.search, selectedThread, patientId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread?.receiverId) return;
      try {
        const msgs = await fetchMessages(selectedThread.receiverId);
        const formatted = msgs.map((msg: ChatMessageResponse) => ({
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
          m.unreadBy?.includes(patientId as string)
        ))
          await markAsRead(msg._id);
        inputRef.current?.focus();
      } catch {
        /* ignore */
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
    });
    if (message) {
      setSelectedThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.some((m) => m._id === message._id)
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
        const idx = prev.findIndex(
          (t) => t.receiverId === selectedThread.receiverId
        );
        if (idx >= 0) {
          if (prev[idx].messages.some((m) => m._id === message._id))
            return prev;
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, message],
            createdAt: message.createdAt,
            latestMessage: {
              _id: message._id,
              message: message.message,
              createdAt: message.createdAt,
              isSender: true,
            },
            unreadCount: 0,
          };
          return updated.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return [
          {
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
          },
          ...prev,
        ].sort(
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
    } catch {
      /* ignore */
    }
  };

  return (
    // h-full fills the <main> from the layout; flex-col stacks header + chat
    <div className="h-full flex flex-col animate-fade-in gap-4">
      {/* Page header — fixed height, never grows */}
      <div className="page-header flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <MessageSquare size={18} className="text-primary-500" />
          </div>
          <div>
            <h1 className="page-title">Messages</h1>
            <p className="page-subtitle">Chat with your doctors</p>
          </div>
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

        {selectedThread && patientId ? (
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
            currentUserId={patientId}
          />
        ) : (
          <div className="w-full lg:w-2/3 card flex flex-col items-center justify-center p-10 text-center">
            {loading ? (
              <>
                <Loader2
                  size={28}
                  className="animate-spin text-primary-400 mb-3"
                />
                <p className="text-sm text-text-muted">
                  Loading conversations...
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-text-muted" />
                </div>
                <p className="font-semibold text-text-primary mb-1">
                  No conversation selected
                </p>
                <p className="text-sm text-text-muted">
                  Choose a conversation from the inbox to start chatting.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
