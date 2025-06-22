import React, { RefObject, useState, useRef } from 'react';
import { ArrowLeft, ArrowDown, Paperclip, Trash2, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { DateUtils } from '../utils/DateUtils';
import { MessageThread } from '../types/messageTypes';
import { sendAttachment, addReaction } from '../services/messageService';

interface ChatBoxProps {
  thread: MessageThread;
  newMessage: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onBackToInbox: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  newMessagesCount: number;
  onScrollToBottom: () => void;
  isAtBottom: () => boolean;
  onDeleteMessages: (messageIds: string[]) => void;
  userStatus?: { status: 'online' | 'offline'; lastSeen?: string };
}

export const ChatBox: React.FC<ChatBoxProps> = React.memo(
  ({
    thread,
    newMessage,
    inputRef,
    onMessageChange,
    onSendMessage,
    onBackToInbox,
    messagesEndRef,
    chatContainerRef,
    newMessagesCount,
    onScrollToBottom,
    isAtBottom,
    onDeleteMessages,
    userStatus,
  }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [reactionPickerMessageId, setReactionPickerMessageId] = useState<
      string | null
    >(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const defaultEmojis = ['😊', '👍', '❤️', '😂', '😢', '😮'];

    const handleEmojiClick = (emojiObject: { emoji: string }) => {
      onMessageChange(newMessage + emojiObject.emoji);
      setShowEmojiPicker(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    };

    const handleFileUpload = async () => {
      if (selectedFile && thread.receiverId) {
        try {
          await sendAttachment(thread.receiverId, selectedFile);
          setSelectedFile(null);
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        } catch (error) {
          console.error('Failed to send attachment:', error);
        }
      }
    };

    const toggleMessageSelection = (messageId: string) => {
      setSelectedMessages((prev) =>
        prev.includes(messageId)
          ? prev.filter((id) => id !== messageId)
          : [...prev, messageId]
      );
    };

    const handleDeleteMessage = (messageId: string) => {
      onDeleteMessages([messageId]);
    };

    const handleReaction = async (messageId: string, emoji: string) => {
      try {
        await addReaction(messageId, emoji);
        setReactionPickerMessageId(null);
      } catch (error) {
        console.error('Failed to add reaction:', error);
      }
    };

    const toggleReactionPicker = (messageId: string) => {
      setReactionPickerMessageId((prev) =>
        prev === messageId ? null : messageId
      );
    };

    const formatLastSeen = (lastSeen?: string) => {
      if (!lastSeen) return 'Last seen: Unknown';
      return `Last seen: ${DateUtils.formatToLocal(new Date(lastSeen).toDateString())}`;
    };

    return (
      <div className="relative w-full lg:w-2/3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center border-b border-white/20 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
              onClick={onBackToInbox}
              title="Back to Inbox"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <img
              src={thread.partnerProfilePicture}
              alt={thread.senderName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {thread.senderName}
              </h3>
              <p className="text-xs text-gray-400">
                {userStatus?.status === 'online'
                  ? 'Online'
                  : formatLastSeen(userStatus?.lastSeen)}
              </p>
            </div>
          </div>
          {selectedMessages.length > 0 && (
            <button
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-300"
              onClick={() => onDeleteMessages(selectedMessages)}
              title="Delete Selected Messages"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <div
          className="flex-1 overflow-y-auto space-y-4 px-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent"
          style={{
            maxHeight: 'calc(100vh - 16rem)',
            overscrollBehavior: 'contain',
          }}
          ref={chatContainerRef}
        >
          {thread.messages.length === 0 ? (
            <div className="text-gray-200 text-center py-8">
              No messages yet
            </div>
          ) : (
            thread.messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.isSender ? 'justify-end' : 'justify-start'} mb-2 items-center group relative`}
                onClick={() => toggleMessageSelection(message._id)}
              >
                <div className="flex items-center gap-2">
                  {message.isSender && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => toggleReactionPicker(message._id)}
                        className="p-1 rounded-full hover:bg-gray-600/50"
                        title="Add Reaction"
                      >
                        <Smile className="w-4 h-4 text-gray-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="p-1 rounded-full hover:bg-red-600/50"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-xl shadow-md ${
                      message.isSender
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-white/20 text-gray-200'
                    } ${selectedMessages.includes(message._id) ? 'ring-2 ring-red-500' : ''}`}
                  >
                    {message.attachment ? (
                      <div>
                        {message.attachment.type.startsWith('image/') ? (
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className="max-w-full h-auto rounded-lg mb-2"
                          />
                        ) : (
                          <a
                            href={message.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {message.attachment.name}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p>{message.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {DateUtils.formatCreatedAtTime(message.createdAt)}
                      {message.isSender && (
                        <span className="ml-2">
                          {message.unreadBy?.includes(thread.receiverId)
                            ? 'Sent'
                            : 'Seen'}
                        </span>
                      )}
                    </p>
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {message.reactions.map((reaction, index) => (
                          <span key={index} className="text-sm">
                            {reaction.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!message.isSender && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => toggleReactionPicker(message._id)}
                        className="p-1 rounded-full hover:bg-gray-600/50"
                        title="Add Reaction"
                      >
                        <Smile className="w-4 h-4 text-gray-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="p-1 rounded-full hover:bg-red-600/50"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
                {reactionPickerMessageId === message._id && (
                  <div
                    className={`absolute z-10 ${
                      message.isSender ? 'right-0' : 'left-0'
                    } top-0 translate-y-[-100%]`}
                  >
                    <div className="bg-gray-800 p-2 rounded-lg flex gap-1">
                      {defaultEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message._id, emoji)}
                          className="text-lg hover:bg-gray-700 p-1 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        {!isAtBottom() && newMessagesCount > 0 && (
          <button
            onClick={onScrollToBottom}
            className="absolute bottom-20 right-4 bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition-all duration-300"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {newMessagesCount}
            </span>
          </button>
        )}
        {selectedFile && (
          <div className="mt-2 p-2 bg-white/10 rounded-lg flex items-center justify-between">
            <span className="text-gray-200 truncate max-w-[80%]">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleFileUpload}
                className="text-green-400 hover:text-green-500"
              >
                Upload
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-400 hover:text-red-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <form onSubmit={onSendMessage} className="mt-4 flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all duration-300"
              ref={inputRef}
            />
            <button
              type="button"
              className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5 text-white" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 right-0 z-10">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            disabled={!newMessage.trim() && !selectedFile}
          >
            Send
          </button>
        </form>
      </div>
    );
  }
);
