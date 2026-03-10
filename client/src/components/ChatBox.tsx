import React, { RefObject, useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowDown,
  Paperclip,
  Trash2,
  Smile,
  X,
  Send,
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { DateUtils } from '../utils/DateUtils';
import { MessageThread, Message } from '../types/messageTypes';
import { addReaction, fetchUserStatus } from '../services/messageService';
import { useSocket } from '../hooks/useSocket';

interface ChatBoxProps {
  thread: MessageThread;
  newMessage: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onSendAttachment: (file: File) => void;
  onBackToInbox: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  newMessagesCount: number;
  onScrollToBottom: () => void;
  isAtBottom: () => boolean;
  onDeleteMessages: (messageIds: string[]) => void;
  currentUserId: string;
}

const defaultEmojis = ['😊', '👍', '❤️', '😂', '😢', '😮'];

export const ChatBox: React.FC<ChatBoxProps> = React.memo(
  ({
    thread,
    newMessage,
    inputRef,
    onMessageChange,
    onSendMessage,
    onSendAttachment,
    onBackToInbox,
    messagesEndRef,
    chatContainerRef,
    newMessagesCount,
    onScrollToBottom,
    isAtBottom,
    onDeleteMessages,
    currentUserId,
  }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [reactionPickerMessageId, setReactionPickerMessageId] = useState<
      string | null
    >(null);
    const [messages, setMessages] = useState<Message[]>(thread.messages);
    const [userStatus, setUserStatus] = useState({
      isOnline: thread.isOnline ?? false,
      lastSeen: thread.lastSeen ?? (null as string | null),
    });
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { registerHandlers, emit, userStatuses } = useSocket();

    // Sync messages when thread changes
    // Replace fully on thread switch, merge-append on new messages within same thread
    const prevThreadId = useRef<string | null>(null);
    useEffect(() => {
      if (prevThreadId.current !== thread.receiverId) {
        // Thread switched — full replace and scroll immediately
        setMessages(thread.messages);
        prevThreadId.current = thread.receiverId;
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        });
      } else {
        // Same thread — only append truly new messages
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const incoming = thread.messages.filter(
            (m) => !existingIds.has(m._id)
          );
          if (incoming.length === 0) return prev;
          return [...prev, ...incoming];
        });
      }
    }, [thread.messages, thread.receiverId, chatContainerRef]);

    // Auto-scroll when new messages arrive
    // Only scroll if already at the bottom (don't hijack user reading old messages)
    const prevMessageCount = useRef(messages.length);
    useEffect(() => {
      const added = messages.length > prevMessageCount.current;
      prevMessageCount.current = messages.length;
      if (!added) return;

      if (isAtBottom()) {
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        });
      }
    }, [messages.length, isAtBottom, chatContainerRef]);

    // Track scroll position to show/hide scroll-to-bottom button
    useEffect(() => {
      const el = chatContainerRef.current;
      if (!el) return;
      const onScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = el;
        setShowScrollBtn(scrollTop + clientHeight < scrollHeight - 60);
      };
      el.addEventListener('scroll', onScroll, { passive: true });
      return () => el.removeEventListener('scroll', onScroll);
    }, [chatContainerRef]);

    // User status
    useEffect(() => {
      if (thread.id && thread.role) {
        fetchUserStatus(thread.id, thread.role)
          .then(setUserStatus)
          .catch(() => {});
      }
    }, [thread.id, thread.role]);

    useEffect(() => {
      const s = userStatuses.get(thread.id);
      if (s) setUserStatus({ isOnline: s.isOnline, lastSeen: s.lastSeen });
    }, [userStatuses, thread.id]);

    // Socket handlers
    useEffect(() => {
      registerHandlers({
        onReceiveMessage: (message: Message) => {
          if (
            message.receiverId === thread.receiverId ||
            message.senderId === thread.receiverId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m._id === message._id)) return prev;
              return [...prev, message];
            });
          }
        },
        onReceiveReaction: (data: {
          messageId: string;
          emoji: string;
          userId: string;
        }) => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === data.messageId
                ? {
                    ...m,
                    reactions: [
                      ...(m.reactions || []).filter(
                        (r) => r.userId !== data.userId
                      ),
                      { emoji: data.emoji, userId: data.userId },
                    ],
                  }
                : m
            )
          );
        },
      });
      return () => {
        registerHandlers({
          onReceiveMessage: undefined,
          onReceiveReaction: undefined,
        });
      };
    }, [thread.receiverId, registerHandlers]);

    // Handlers
    const handleEmojiClick = (emojiObject: { emoji: string }) => {
      onMessageChange(newMessage + emojiObject.emoji);
      setShowEmojiPicker(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setSelectedFile(f);
      e.target.value = '';
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim()) onSendMessage(e);
      if (selectedFile) {
        const f = selectedFile;
        setSelectedFile(null);
        onSendAttachment(f);
      }
      onMessageChange('');
      // Always scroll to bottom when the current user sends a message
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    };

    const handleScrollToBottom = () => {
      onScrollToBottom();
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
      try {
        const msg = messages.find((m) => m._id === messageId);
        const existing = msg?.reactions?.find(
          (r) => r.userId === currentUserId
        );
        await addReaction(messageId, emoji, !!existing);
        if (!thread.senderId) throw new Error('Sender ID not defined');
        await emit('sendReaction', { messageId, emoji, userId: currentUserId });
        setReactionPickerMessageId(null);
      } catch {
        /* ignore */
      }
    };

    return (
      <div className="relative w-full lg:w-2/3 card flex flex-col min-h-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToInbox}
              className="lg:hidden p-1.5 rounded-xl hover:bg-surface-muted transition-colors"
              title="Back"
            >
              <ArrowLeft size={18} className="text-text-secondary" />
            </button>
            <div className="relative">
              {thread.partnerProfilePicture ? (
                <img
                  src={thread.partnerProfilePicture}
                  alt={thread.senderName}
                  className="w-9 h-9 rounded-full object-cover border border-surface-border"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                  {thread.senderName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {userStatus.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">
                {thread.senderName}
              </p>
              <p className="text-xs text-text-muted leading-tight">
                {userStatus.isOnline ? (
                  <span className="text-emerald-500 font-medium">Online</span>
                ) : userStatus.lastSeen ? (
                  `Last seen ${DateUtils.formatLastSeen(userStatus.lastSeen)}`
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
          {selectedMessages.length > 0 && (
            <button
              onClick={() => {
                onDeleteMessages(selectedMessages);
                setSelectedMessages([]);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-error hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 transition-colors"
            >
              <Trash2 size={13} /> Delete ({selectedMessages.length})
            </button>
          )}
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent"
          style={{ overscrollBehavior: 'contain' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <p className="text-sm text-text-muted">
                No messages yet. Say hello! 👋
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isSender = message.isSender;
              const isSelected = selectedMessages.includes(message._id);
              return (
                <div
                  key={message._id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'} group relative`}
                >
                  <div className="flex items-end gap-1.5 max-w-[75%]">
                    {/* Actions — left side for sender */}
                    {isSender && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1">
                        <button
                          onClick={() =>
                            setReactionPickerMessageId((p) =>
                              p === message._id ? null : message._id
                            )
                          }
                          className="p-1 rounded-lg hover:bg-surface-muted"
                          title="React"
                        >
                          <Smile size={13} className="text-text-muted" />
                        </button>
                        <button
                          onClick={() => onDeleteMessages([message._id])}
                          className="p-1 rounded-lg hover:bg-red-50 text-error"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      onClick={() =>
                        setSelectedMessages((p) =>
                          p.includes(message._id)
                            ? p.filter((id) => id !== message._id)
                            : [...p, message._id]
                        )
                      }
                      className={`px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                        isSender
                          ? 'bg-gradient-to-br from-primary-500 to-teal-500 text-white rounded-br-sm'
                          : 'bg-surface-muted text-text-primary rounded-bl-sm border border-surface-border'
                      } ${isSelected ? 'ring-2 ring-error ring-offset-1' : ''}`}
                    >
                      {message.attachment ? (
                        <div>
                          {message.attachment.type.startsWith('image/') ? (
                            <img
                              src={message.attachment.url}
                              alt={message.attachment.name}
                              className="max-w-full max-h-48 rounded-xl mb-1 object-cover"
                            />
                          ) : (
                            <a
                              href={message.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline text-sm ${isSender ? 'text-white/80' : 'text-primary-600'}`}
                            >
                              📎 {message.attachment.name}
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">
                          {message.message}
                        </p>
                      )}
                      <div
                        className={`flex items-center gap-1.5 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <span
                          className={`text-[10px] ${isSender ? 'text-white/60' : 'text-text-muted'}`}
                        >
                          {DateUtils.formatCreatedAtTime(message.createdAt)}
                          {isSender && (
                            <span className="ml-1">
                              {message.unreadBy?.includes(thread.receiverId)
                                ? '✓'
                                : '✓✓'}
                            </span>
                          )}
                        </span>
                      </div>
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap">
                          {message.reactions.map((r, i) => (
                            <span key={i} className="text-sm">
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions — right side for receiver */}
                    {!isSender && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1">
                        <button
                          onClick={() =>
                            setReactionPickerMessageId((p) =>
                              p === message._id ? null : message._id
                            )
                          }
                          className="p-1 rounded-lg hover:bg-surface-muted"
                          title="React"
                        >
                          <Smile size={13} className="text-text-muted" />
                        </button>
                        <button
                          onClick={() => onDeleteMessages([message._id])}
                          className="p-1 rounded-lg hover:bg-red-50 text-error"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reaction picker */}
                  {reactionPickerMessageId === message._id && (
                    <div
                      className={`absolute z-20 bottom-full mb-1 ${isSender ? 'right-0' : 'left-0'}`}
                    >
                      <div className="bg-white border border-surface-border rounded-2xl shadow-modal px-2 py-1.5 flex gap-1">
                        {defaultEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message._id, emoji)}
                            className="text-lg p-1 rounded-lg hover:bg-surface-muted transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Scroll-to-bottom button ── */}
        {showScrollBtn && (
          <button
            onClick={handleScrollToBottom}
            className="absolute bottom-20 right-4 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 shadow-card-hover transition-all"
          >
            <ArrowDown size={16} />
            {newMessagesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-error text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {newMessagesCount}
              </span>
            )}
          </button>
        )}

        {/* ── Input area ── */}
        <div className="flex-shrink-0 border-t border-surface-border px-4 py-3">
          {/* File preview */}
          {selectedFile && (
            <div className="mb-2.5 flex items-center gap-3 p-2.5 bg-surface-muted rounded-xl border border-surface-border">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-surface-bg rounded-lg border border-surface-border flex items-center justify-center flex-shrink-0">
                  <Paperclip size={18} className="text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-text-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-surface-bg rounded-lg transition-colors"
              >
                <X size={14} className="text-text-muted" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Emoji */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl hover:bg-surface-muted transition-colors flex-shrink-0"
              title="Emoji"
            >
              <Smile size={18} className="text-text-muted" />
            </button>

            {/* Text input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-surface-muted border border-surface-border rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
              ref={inputRef}
            />

            {/* Attachment */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-surface-muted transition-colors flex-shrink-0"
              title="Attach file"
            >
              <Paperclip size={18} className="text-text-muted rotate-45" />
            </button>

            {/* Send */}
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={!newMessage.trim() && !selectedFile}
              className="p-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-colors flex-shrink-0 shadow-btn-primary"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
          />

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-50 shadow-modal rounded-2xl overflow-hidden border border-surface-border">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.LIGHT}
                height={350}
                width={300}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);
