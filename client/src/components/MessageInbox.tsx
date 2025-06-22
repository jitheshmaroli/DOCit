import React, { useEffect } from 'react';
import { DateUtils } from '../utils/DateUtils';
import { MessageThread } from '../types/messageTypes';
import { SocketManager } from '../services/SocketManager';

interface MessageInboxProps {
  threads: MessageThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: MessageThread) => void;
  loading: boolean;
}

export const MessageInbox: React.FC<MessageInboxProps> = React.memo(
  ({ threads, selectedThreadId, onSelectThread, loading }) => {
    const [userStatuses, setUserStatuses] = React.useState<{
      [key: string]: { status: 'online' | 'offline'; lastSeen?: string };
    }>({});
    const socketManager = SocketManager.getInstance();

    useEffect(() => {
      socketManager.registerHandlers({
        onUserStatus: ({ userId, status, lastSeen }) => {
          console.log('Received userStatus:', { userId, status, lastSeen });
          setUserStatuses((prev) => ({
            ...prev,
            [userId]: {
              status,
              lastSeen: lastSeen ? new Date(lastSeen).toISOString() : undefined,
            },
          }));
        },
      });

      return () => {
        socketManager.registerHandlers({ onUserStatus: undefined });
      };
    }, [socketManager]);

    const formatLastSeen = (lastSeen?: string) => {
      if (!lastSeen) return 'Last seen: Unknown';
      const date = new Date(lastSeen);
      return `Last seen: ${DateUtils.formatToLocal(date.toDateString())}`;
    };

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
            {threads.map((thread) => (
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
                    {userStatuses[thread.receiverId]?.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white/20"></span>
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
                        <p className="text-gray-400 text-xs">
                          {userStatuses[thread.receiverId]?.status === 'online'
                            ? 'Online'
                            : formatLastSeen(
                                userStatuses[thread.receiverId]?.lastSeen
                              )}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        thread.unreadCount > 0 ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {thread.latestMessage?.message}
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
