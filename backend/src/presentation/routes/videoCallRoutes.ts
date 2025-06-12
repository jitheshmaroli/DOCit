import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { VideoCallController } from '../controllers/video/VideoCallController';

const router = express.Router();
const container = Container.getInstance();
const videoCallController = new VideoCallController(container);

const videoCallAuth = [authMiddleware(container), roleMiddleware(['patient', 'doctor'])];

router.post('/initiate', videoCallAuth, videoCallController.initiateVideoCall.bind(videoCallController));
router.post('/:sessionId/end', videoCallAuth, videoCallController.endVideoCall.bind(videoCallController));
router.patch(
  '/:sessionId/settings',
  videoCallAuth,
  videoCallController.updateVideoCallSettings.bind(videoCallController)
);

export default router;
