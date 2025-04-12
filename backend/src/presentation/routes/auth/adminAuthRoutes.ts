import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { AdminAuthController } from '../../controllers/auth/AdminAuthController';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();
const container = Container.getInstance();
const adminAuthController = new AdminAuthController(container);

router.post('/login', adminAuthController.login.bind(adminAuthController));

// CRUD routes for doctors
router.post(
  '/doctors',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.createDoctor.bind(adminAuthController)
);
router.get(
  '/doctors',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.listDoctors.bind(adminAuthController)
);
router.patch(
  '/verify-doctor/:doctorId',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.verifyDoctor.bind(adminAuthController)
);
router.patch(
  '/doctors/:id',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.updateDoctor.bind(adminAuthController)
);
router.delete(
  '/doctors/:id',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.deleteDoctor.bind(adminAuthController)
);
router.patch(
  '/doctors/:id/block',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.blockDoctor.bind(adminAuthController)
);

//CRUD routes for patients
router.post(
  '/patients',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.createPatient.bind(adminAuthController)
);
router.get(
  '/patients',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.listPatients.bind(adminAuthController)
);
router.patch(
  '/patients/:id',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.updatePatient.bind(adminAuthController)
);
router.delete(
  '/patients/:id',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.deletePatient.bind(adminAuthController)
);
router.patch(
  '/patients/:id/block',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminAuthController.blockPatient.bind(adminAuthController)
);

export default router;
