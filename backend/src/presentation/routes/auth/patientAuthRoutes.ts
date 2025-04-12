import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { PatientAuthController } from '../../controllers/auth/PatientAuthController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';

const router = express.Router();
const container = Container.getInstance();

// Controlle instantiation
const patientAuthController = new PatientAuthController(container);

router.post(
  '/signup',
  patientAuthController.signup.bind(patientAuthController)
);

router.post('/login', patientAuthController.login.bind(patientAuthController));

router.post(
  '/google-signin',
  patientAuthController.googleSignIn.bind(patientAuthController)
);

router.get(
  '/verified-doctors',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientAuthController.listVerifiedDoctors.bind(patientAuthController)
);

export default router;
