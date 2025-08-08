import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { NotificationController } from '../controllers/notification/NotificationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { UserRole } from '../../types';

const router = express.Router();
const container = Container.getInstance();
const notificationController = new NotificationController(container);

const notificationAuth = [authMiddleware(container), roleMiddleware([UserRole.Doctor, UserRole.Patient])];

router.get('/', notificationAuth, notificationController.getNotifications.bind(notificationController));
router.post('/', notificationAuth, notificationController.sendNotification.bind(notificationController));
router.delete(
  '/:notificationId',
  notificationAuth,
  notificationController.deleteNotification.bind(notificationController)
);
router.patch(
  '/:notificationId/read',
  notificationAuth,
  notificationController.markNotificationAsRead.bind(notificationController)
);
router.delete('/', notificationAuth, notificationController.deleteAllNotifications.bind(notificationController));

export default router;
