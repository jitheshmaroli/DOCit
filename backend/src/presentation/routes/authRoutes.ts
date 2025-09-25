import express from 'express';
import createControllers from '../../infrastructure/di/controllers';

const router = express.Router();

// Controller
const { sharedAuthController, doctorAuthController, patientAuthController, adminAuthController } = createControllers();

// Patient auth routes
router.post('/patient/signup', patientAuthController.signup.bind(patientAuthController));
router.post('/patient/login', patientAuthController.login.bind(patientAuthController));
router.post('/patient/google-signin', patientAuthController.googleSignIn.bind(patientAuthController));

// Doctor auth routes
router.post('/doctor/signup', doctorAuthController.signup.bind(doctorAuthController));
router.post('/doctor/login', doctorAuthController.login.bind(doctorAuthController));
router.post('/doctor/google-signin', doctorAuthController.googleSignIn.bind(doctorAuthController));

// Admin auth routes
router.post('/admin/login', adminAuthController.login.bind(adminAuthController));

// Shared auth routes
router.post('/logout', sharedAuthController.logout.bind(sharedAuthController));
router.post('/refresh-token', sharedAuthController.refreshToken.bind(sharedAuthController));
router.post('/forgot-password', sharedAuthController.forgotPassword.bind(sharedAuthController));
router.post('/reset-password', sharedAuthController.resetPassword.bind(sharedAuthController));
router.post('/verify-signup-otp', sharedAuthController.verifySignUpOTP.bind(sharedAuthController));
router.post('/resend-signup-otp', sharedAuthController.resendSignupOTP.bind(sharedAuthController));

export default router;
