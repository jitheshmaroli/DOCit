// src/components/MessageInbox.tsx
import React from 'react';
import { DateUtils } from '../utils/DateUtils';
import { MessageThread } from '../types/messageTypes';

interface MessageInboxProps {
  threads: MessageThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: MessageThread) => void;
  loading: boolean;
}

export const MessageInbox: React.FC<MessageInboxProps> = React.memo(
  ({ threads, selectedThreadId, onSelectThread, loading }) => {
    return (
      <div className="w-full lg:w-1/3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Inbox</h3>
        {loading ? (
          <div className="text-gray-200 text-center">Loading...</div>
        ) : threads.length === 0 ? (
          <div className="text-gray-200 text-center">
            No messages found. Start a conversation.
          </div>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedThreadId === thread.id
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
                onClick={() => onSelectThread(thread)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      thread.partnerProfilePicture ||
                      'https://via.placeholder.com/40'
                    }
                    alt={thread.senderName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-medium truncate">
                        {thread.senderName}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        {DateUtils.formatToLocal(thread.timestamp)}
                      </p>
                    </div>
                    <p className="text-gray-200 text-sm truncate">
                      {thread.latestMessage?.message || thread.subject}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);