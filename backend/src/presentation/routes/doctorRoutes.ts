import express from 'express';
import createControllers from '../../infrastructure/di/controllers';
import createMiddlewares from '../../infrastructure/di/middlewares';
import { getMulterUploader } from '../../utils/multerConfig';

const router = express.Router();

const { doctorController, doctorProfileController } = createControllers();
const { authMiddleware, doctorRoleMiddleware } = createMiddlewares();

const upload = getMulterUploader('doctor-files', 'image-and-pdf');
const profileUpload = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'licenseProof', maxCount: 1 },
]);

// Middleware
const doctorAuth = [authMiddleware.exec, doctorRoleMiddleware.exec];

// Availability routes
router.get('/availability', doctorAuth, doctorController.getAvailability.bind(doctorController));
router.post('/availability', doctorAuth, doctorController.setAvailability.bind(doctorController));
router.post('/availability/slots/remove', doctorAuth, doctorController.removeSlot.bind(doctorController));
router.patch('/availability/slots', doctorAuth, doctorController.updateSlot.bind(doctorController));

// Appointment routes
router.get('/appointments', doctorAuth, doctorController.getAppointments.bind(doctorController));
router.get('/appointments/:appointmentId', doctorAuth, doctorController.getSingleAppointment.bind(doctorController));
router.get(
  '/patient/:patientId/appointments',
  doctorAuth,
  doctorController.getPatientAppointments.bind(doctorController)
);
router.post('/appointments/complete', doctorAuth, doctorController.completeAppointment.bind(doctorController));
router.post('/appointments/cancel', doctorAuth, doctorController.cancelAppointment.bind(doctorController));

// Subscription plan routes
router.get('/subscription-plans', doctorAuth, doctorController.getSubscriptionPlans.bind(doctorController));
router.post('/subscription-plans', doctorAuth, doctorController.createSubscriptionPlan.bind(doctorController));
router.put('/subscription-plans/:planId', doctorAuth, doctorController.updateSubscriptionPlan.bind(doctorController));
router.delete(
  '/subscription-plans/:planId',
  doctorAuth,
  doctorController.deleteSubscriptionPlan.bind(doctorController)
);

// Speciality routes
router.get('/specialities', doctorAuth, doctorController.getAllSpecialities.bind(doctorController));

// Profile routes
router.get('/profile', doctorAuth, doctorProfileController.viewProfile.bind(doctorProfileController));
router.patch(
  '/profile',
  doctorAuth,
  profileUpload,
  doctorProfileController.updateProfile.bind(doctorProfileController)
);

// Dashboard Statistics routes
router.get('/dashboard/stats', doctorAuth, doctorController.getDashboardStats.bind(doctorController));
router.get('/dashboard/reports', doctorAuth, doctorController.getReports.bind(doctorController));

router.get('/patients/subscribed', doctorAuth, doctorController.getSubscribedPatients.bind(doctorController));
router.get('/patients/appointed', doctorAuth, doctorController.getAppointedPatients.bind(doctorController));
router.get(
  '/subscription-plans/:planId/counts',
  doctorAuth,
  doctorController.getPlanSubscriptionCounts.bind(doctorController)
);

export default router;
