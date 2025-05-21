// src/components/ChatBox.tsx
import React, { useRef, useCallback } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import { DateUtils } from '../utils/DateUtils';
import { MessageThread } from '../types/messageTypes';

interface ChatBoxProps {
  thread: MessageThread;
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onBackToInbox: () => void;
  onVideoCall?: () => void;
  isVideoCallDisabled?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = React.memo(
  ({
    thread,
    newMessage,
    onMessageChange,
    onSendMessage,
    onBackToInbox,
    onVideoCall,
    isVideoCallDisabled,
  }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    React.useEffect(() => {
      scrollToBottom();
    }, [thread.messages, scrollToBottom]);

    return (
      <div className="w-full lg:w-2/3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex flex-col">
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
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {thread.senderName}
              </h3>
              <p className="text-gray-200 text-sm">{thread.subject}</p>
            </div>
          </div>
          {onVideoCall && (
            <div className="flex gap-2">
              <button
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
                onClick={onVideoCall}
                disabled={isVideoCallDisabled}
                title="Start Video Call"
              >
                <Video className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 max-h-[60vh] overflow-y-auto space-y-4 px-2">
          {thread.messages.length === 0 ? (
            <div className="text-gray-200 text-center py-8">
              No messages yet
            </div>
          ) : (
            thread.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.isSender
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/20 text-gray-200'
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {DateUtils.formatToLocal(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={onSendMessage} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
