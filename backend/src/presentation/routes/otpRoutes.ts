import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { OTPController } from '../controllers/otp/OTPController';

const router = express.Router();
const container = Container.getInstance();

const otpController = new OTPController(container);

// OTP routes
router.post('/send-otp', otpController.sendOTP.bind(otpController));
router.post('/verify-otp', otpController.verifyOTP.bind(otpController));

export default router;