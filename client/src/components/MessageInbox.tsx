import React from 'react';
import { MessageThread } from '../types/messageTypes';
import { useSocket } from '../hooks/useSocket';
import { DateUtils } from '../utils/DateUtils';
import { MessageSquare, Loader2 } from 'lucide-react';

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
      // min-h-0 is critical — without it, flexbox won't shrink below content size
      <div className="w-full lg:w-1/3 card flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-border flex-shrink-0">
          <h3 className="font-display font-bold text-text-primary">Inbox</h3>
          {threads.length > 0 && (
            <span className="text-xs text-text-muted font-medium">
              {threads.length} conversation{threads.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Thread list — flex-1 + min-h-0 + overflow-y-auto = scrolls within fixed height */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={22} className="animate-spin text-primary-400" />
              <p className="text-xs text-text-muted">
                Loading conversations...
              </p>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mb-3">
                <MessageSquare size={20} className="text-text-muted" />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                No messages yet
              </p>
              <p className="text-xs text-text-muted">
                Start a conversation by visiting a doctor's profile.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {threads.map((thread) => {
                const status = userStatuses.get(thread.id);
                const isOnline = status?.isOnline ?? thread.isOnline;
                const lastSeen = status?.lastSeen ?? thread.lastSeen;
                const isSelected = selectedThreadId === thread.id;
                const hasUnread = thread.unreadCount > 0;

                return (
                  <button
                    key={`${thread.id}-${thread.createdAt}`}
                    onClick={() => onSelectThread(thread)}
                    className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors duration-150 hover:bg-surface-muted ${
                      isSelected ? 'bg-primary-50 hover:bg-primary-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {thread.partnerProfilePicture ? (
                        <img
                          src={thread.partnerProfilePicture}
                          alt={thread.senderName}
                          className="w-10 h-10 rounded-full object-cover border border-surface-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                          {thread.senderName?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-sm truncate ${hasUnread ? 'font-bold text-text-primary' : 'font-medium text-text-primary'}`}
                        >
                          {thread.senderName}
                        </span>
                        {hasUnread && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-primary-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-bold">
                            {thread.unreadCount > 99
                              ? '99+'
                              : thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs truncate ${hasUnread ? 'text-text-secondary font-medium' : 'text-text-muted'}`}
                      >
                        {thread.latestMessage?.message || 'No messages yet'}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {isOnline ? (
                          <span className="text-emerald-500 font-medium">
                            Online
                          </span>
                        ) : lastSeen ? (
                          `Last seen ${DateUtils.formatLastSeen(lastSeen)}`
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);
