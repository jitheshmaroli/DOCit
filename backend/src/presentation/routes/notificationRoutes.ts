import express from 'express';
import createControllers from '../../infrastructure/di/controllers';
import createMiddlewares from '../../infrastructure/di/middlewares';

const router = express.Router();

const { notificationController } = createControllers();
const { authMiddleware, chatRoleMiddleware } = createMiddlewares();

const notificationAuth = [authMiddleware.exec, chatRoleMiddleware.exec];

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
