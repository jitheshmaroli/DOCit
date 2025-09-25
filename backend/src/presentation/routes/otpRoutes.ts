import express from 'express';
import createControllers from '../../infrastructure/di/controllers';

const router = express.Router();

//controller
const { otpController } = createControllers();

// OTP routes
router.post('/send-otp', otpController.sendOTP.bind(otpController));
router.post('/verify-otp', otpController.verifyOTP.bind(otpController));

export default router;
