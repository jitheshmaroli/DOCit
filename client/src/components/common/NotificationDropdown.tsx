import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Trash2, BellOff, CheckCheck } from 'lucide-react';
import { AppNotification } from '../../types/authTypes';
import {
  fetchNotifications,
  deleteNotification,
  deleteAllNotifications,
  markNotificationAsRead,
} from '../../services/notificationService';
import { DateUtils } from '../../utils/DateUtils';
import { useSocket } from '../../hooks/useSocket';

interface NotificationDropdownProps {
  userId: string | undefined;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  userId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { registerHandlers } = useSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!userId) return;
    registerHandlers({
      onReceiveNotification: (notification: AppNotification) => {
        setNotifications((prev) => [notification, ...prev]);
        if (!notification.isRead) setUnreadCount((prev) => prev + 1);
      },
    });
    fetchNotifications()
      .then((result) => {
        setNotifications(result);
        setUnreadCount(result.filter((n: AppNotification) => !n.isRead).length);
      })
      .catch((err) => console.error('Failed to fetch notifications:', err));
  }, [registerHandlers, userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.isRead) return;
    try {
      await markNotificationAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => prev - 1);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const wasUnread = notifications.find(
      (n) => n._id === notificationId && !n.isRead
    );
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (wasUnread) setUnreadCount((prev) => prev - 1);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const portalRoot =
    document.getElementById('notifications-portal') || document.body;

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed top-[4.5rem] right-4 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-surface-border z-[10000] flex flex-col max-h-[70vh] animate-scale-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-text-primary text-sm">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="badge-primary">{unreadCount} new</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-error hover:bg-red-50 transition-colors"
              title="Clear all"
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Close notifications"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mb-3">
              <BellOff size={22} className="text-text-muted" />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">
              All caught up!
            </p>
            <p className="text-xs text-text-muted">
              No notifications right now
            </p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-surface-border last:border-0 cursor-pointer transition-colors ${
                  notification.isRead
                    ? 'hover:bg-surface-bg'
                    : 'bg-primary-50 hover:bg-primary-100/60'
                }`}
              >
                {/* Unread dot */}
                <div className="flex-shrink-0 mt-1.5">
                  <span
                    className={`block w-2 h-2 rounded-full transition-colors ${
                      notification.isRead
                        ? 'bg-surface-border'
                        : 'bg-primary-500'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed break-words ${
                      notification.isRead
                        ? 'text-text-secondary'
                        : 'text-text-primary font-medium'
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {DateUtils.formatToLocal(notification.createdAt)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDelete(e, notification._id)}
                  className="flex-shrink-0 p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-red-50 transition-colors"
                  aria-label="Delete notification"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer — mark all read */}
      {unreadCount > 0 && (
        <div className="px-4 py-2.5 border-t border-surface-border flex-shrink-0">
          <button
            onClick={async () => {
              // Mark each unread as read
              const unread = notifications.filter((n) => !n.isRead);
              await Promise.allSettled(
                unread.map((n) => markNotificationAsRead(n._id))
              );
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
              );
              setUnreadCount(0);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative z-[10000]">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-error rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && createPortal(dropdown, portalRoot)}
    </div>
  );
};

export default NotificationDropdown;
