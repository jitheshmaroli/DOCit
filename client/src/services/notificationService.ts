import api from './api';

export const fetchNotifications = async () => {
  const response = await api.get('/api/notifications');
  console.log('serv:', response.data);
  return response.data;
};

export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  await api.delete(`/api/notifications/${notificationId}`);
};

export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete('/api/notifications');
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  await api.patch(`/api/notifications/${notificationId}/read`);
};
