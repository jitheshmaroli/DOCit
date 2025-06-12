import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Trash2 } from 'lucide-react';
import { AppNotification } from '../../types/authTypes';
import {
  fetchNotifications,
  deleteNotification,
  deleteAllNotifications,
  markNotificationAsRead,
} from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import { DateUtils } from '../../utils/DateUtils';

interface NotificationDropdownProps {
  userId: string | undefined;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  userId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useSocket(userId, {
    onReceiveNotification: (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    const loadNotifications = async () => {
      if (!userId) return;
      try {
        const result = await fetchNotifications();
        setNotifications(result);
        console.log('notifications:', result);
        setUnreadCount(result.filter((n: AppNotification) => !n.isRead).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    loadNotifications();
  }, [userId]);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => prev - 1);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount(
        (prev) =>
          prev -
          (notifications.find((n) => n._id === notificationId && !n.isRead)
            ? 1
            : 0)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const portalRoot =
    document.getElementById('notifications-portal') || document.body;

  const dropdownContent = (
    <div className="fixed top-20 right-4 w-80 bg-gray-800 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 z-[10000] max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-white/20 flex justify-between items-center">
        <h3 className="text-white font-semibold">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAllNotifications}
            className="text-gray-200 hover:text-red-300 flex items-center gap-1 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="p-4 text-gray-200 text-center">No notifications</p>
      ) : (
        <ul className="divide-y divide-white/20">
          {notifications.map((notification) => (
            <li
              key={notification._id}
              className={`p-4 flex justify-between items-start hover:bg-white/30 transition-all duration-300 cursor-pointer ${
                notification.isRead
                  ? 'opacity-70 bg-gray-800'
                  : 'bg-purple-500/20'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-1">
                <p className="text-sm text-white">{notification.message}</p>
                <p className="text-xs text-gray-300">
                  {DateUtils.formatToLocal(notification.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(notification._id);
                }}
                className="p-1 text-gray-200 hover:text-red-300"
                aria-label="Delete notification"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="relative z-[10000]">
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-200 hover:text-purple-300 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white z-[10001]">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && createPortal(dropdownContent, portalRoot)}
    </div>
  );
};

export default NotificationDropdown;
