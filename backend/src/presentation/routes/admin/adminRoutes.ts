import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { AdminController } from '../../controllers/admin/AdminController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';

const router = express.Router();
const container = Container.getInstance();
const adminController = new AdminController(container);

router.get(
  '/subscription-plans/pending',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminController.getPendingPlans.bind(adminController)
);

router.put(
  '/subscription-plans/:planId/approve',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminController.approvePlan.bind(adminController)
);

router.put(
  '/subscription-plans/:planId/reject',
  authMiddleware(container),
  roleMiddleware(['admin']),
  adminController.rejectPlan.bind(adminController)
);

// New endpoint
router.get('/appointments', adminController.getAllAppointments.bind(adminController));

// // Doctor management
// router.post('/doctors', adminController.createDoctor.bind(adminController));
// router.get('/doctors', adminController.listDoctors.bind(adminController));

export default router;
