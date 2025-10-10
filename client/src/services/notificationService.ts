import { AxiosError } from 'axios';
import api from './api';
import { ROUTES } from '../constants/routeConstants';
import { NotificationApiError } from '../types/notificationTypes';

export const fetchNotifications = async () => {
  try {
    const response = await api.get(ROUTES.API.NOTIFICATION.FETCH_NOTIFICATIONS);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<NotificationApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to fetch notifications'
    );
  }
};

export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await api.delete(
      ROUTES.API.NOTIFICATION.DELETE_NOTIFICATION.replace(
        ':notificationId',
        notificationId
      )
    );
  } catch (error) {
    const axiosError = error as AxiosError<NotificationApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete notification'
    );
  }
};

export const deleteAllNotifications = async (): Promise<void> => {
  try {
    await api.delete(ROUTES.API.NOTIFICATION.DELETE_ALL_NOTIFICATIONS);
  } catch (error) {
    const axiosError = error as AxiosError<NotificationApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to delete all notifications'
    );
  }
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    await api.patch(
      ROUTES.API.NOTIFICATION.MARK_AS_READ.replace(
        ':notificationId',
        notificationId
      )
    );
  } catch (error) {
    const axiosError = error as AxiosError<NotificationApiError>;
    throw new Error(
      axiosError.response?.data.message || 'Failed to mark notification as read'
    );
  }
};
