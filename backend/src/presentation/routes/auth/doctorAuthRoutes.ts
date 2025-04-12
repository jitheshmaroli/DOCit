import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { DoctorAuthController } from '../../controllers/auth/DoctorAuthController';

const router = express.Router();
const container = Container.getInstance();
const doctorAuthController = new DoctorAuthController(container);

router.post('/signup', doctorAuthController.signup.bind(doctorAuthController));
router.post('/login', doctorAuthController.login.bind(doctorAuthController));
router.post(
  '/google-signin',
  doctorAuthController.googleSignIn.bind(doctorAuthController)
);

export default router;
