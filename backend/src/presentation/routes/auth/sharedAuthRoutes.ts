import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { SharedAuthController } from '../../controllers/auth/SharedAuthController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();
const container = Container.getInstance();

// Controller instantiation
const sharedAuthController = new SharedAuthController(container);

// Protected route
router.post(
  '/logout',
  authMiddleware(container),
  sharedAuthController.logout.bind(sharedAuthController)
);

// Auth related routes
router.post(
  '/refresh-token',
  sharedAuthController.refreshToken.bind(sharedAuthController)
);

router.post(
  '/forgot-password',
  sharedAuthController.forgotPassword.bind(sharedAuthController)
);

router.post(
  '/reset-password',
  sharedAuthController.resetPassword.bind(sharedAuthController)
);

router.post(
  '/verify-signup-otp',
  sharedAuthController.verifySignUpOTP.bind(sharedAuthController)
);

export default router;
