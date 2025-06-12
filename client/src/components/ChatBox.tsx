import React, { useEffect, RefObject } from 'react';
import { ArrowLeft, ArrowDown } from 'lucide-react';
import { DateUtils } from '../utils/DateUtils';
import { MessageThread } from '../types/messageTypes';

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
  }) => {
    useEffect(() => {
      inputRef.current?.focus();
    }, [inputRef]);

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
              src={
                thread.partnerProfilePicture || 'https://via.placeholder.com/40'
              }
              alt={thread.senderName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {thread.senderName}
              </h3>
            </div>
          </div>
        </div>
        <div
          className="flex-1 max-h-[calc(100vh-16rem)] overflow-y-auto space-y-4 px-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent"
          ref={chatContainerRef}
        >
          {thread.messages.length === 0 ? (
            <div className="text-gray-200 text-center py-8">
              No messages yet
            </div>
          ) : (
            thread.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isSender ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl shadow-md ${
                    message.isSender
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/20 text-gray-200'
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {DateUtils.formatCreatedAtTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        {newMessagesCount > 0 && (
          <button
            onClick={onScrollToBottom}
            className="absolute bottom-20 right-4 bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition-all duration-300"
          >
            <ArrowDown className="w-5 h-5" />
            {newMessagesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {newMessagesCount}
              </span>
            )}
          </button>
        )}
        <form onSubmit={onSendMessage} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all duration-300"
            ref={inputRef}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
          >
            Send
          </button>
        </form>
      </div>
    );
  }
);
