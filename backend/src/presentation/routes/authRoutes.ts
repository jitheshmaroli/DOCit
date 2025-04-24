import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { PatientAuthController } from '../controllers/auth/PatientAuthController';
import { DoctorAuthController } from '../controllers/auth/DoctorAuthController';
import { AdminAuthController } from '../controllers/auth/AdminAuthController';
import { SharedAuthController } from '../controllers/auth/SharedAuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();
const container = Container.getInstance();

// Controller instantiation
const patientAuthController = new PatientAuthController(container);
const doctorAuthController = new DoctorAuthController(container);
const adminAuthController = new AdminAuthController(container);
const sharedAuthController = new SharedAuthController(container);

// Patient auth routes
router.post(
  '/patient/signup',
  patientAuthController.signup.bind(patientAuthController)
);
router.post(
  '/patient/login',
  patientAuthController.login.bind(patientAuthController)
);
router.post(
  '/patient/google-signin',
  patientAuthController.googleSignIn.bind(patientAuthController)
);

// Doctor auth routes
router.post(
  '/doctor/signup',
  doctorAuthController.signup.bind(doctorAuthController)
);
router.post(
  '/doctor/login',
  doctorAuthController.login.bind(doctorAuthController)
);
router.post(
  '/doctor/google-signin',
  doctorAuthController.googleSignIn.bind(doctorAuthController)
);

// Admin auth routes
router.post(
  '/admin/login',
  adminAuthController.login.bind(adminAuthController)
);

// Shared auth routes
router.post(
  '/logout',
  authMiddleware(container),
  sharedAuthController.logout.bind(sharedAuthController)
);
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
