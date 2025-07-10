import React from 'react';
import { MessageThread } from '../types/messageTypes';
import { useSocket } from '../hooks/useSocket';
import { DateUtils } from '../utils/DateUtils';

interface MessageInboxProps {
  threads: MessageThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: MessageThread) => void;
  loading: boolean;
}

export const MessageInbox: React.FC<MessageInboxProps> = React.memo(
  ({ threads, selectedThreadId, onSelectThread, loading }) => {
    const { userStatuses } = useSocket();

    return (
      <div className="w-full lg:w-1/3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 sm:p-6 h-full overflow-hidden">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
          Inbox
        </h3>
        {loading ? (
          <div className="text-gray-200 text-center flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-gray-200 text-center flex items-center justify-center h-full">
            No messages found. Start a conversation.
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
            {threads.map((thread) => {
              const status = userStatuses.get(thread.id);
              const isOnline = status?.isOnline ?? thread.isOnline;
              const lastSeen = status?.lastSeen ?? thread.lastSeen;

              return (
                <div
                  key={`${thread.id}-${thread.createdAt}`}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/10 ${
                    selectedThreadId === thread.id ? 'bg-white/20' : ''
                  } ${thread.unreadCount > 0 ? 'bg-purple-900/20 font-bold' : ''}`}
                  onClick={() => onSelectThread(thread)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={thread.partnerProfilePicture}
                        alt={thread.senderName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4
                          className={`text-white truncate ${
                            thread.unreadCount > 0 ? 'font-bold' : 'font-medium'
                          }`}
                        >
                          {thread.senderName}
                        </h4>
                        <div className="flex items-center gap-2">
                          {thread.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-sm truncate ${
                          thread.unreadCount > 0
                            ? 'text-white'
                            : 'text-gray-300'
                        }`}
                      >
                        {thread.latestMessage?.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isOnline
                          ? 'Online'
                          : lastSeen
                            ? `Last seen ${DateUtils.formatLastSeen(lastSeen)}`
                            : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
