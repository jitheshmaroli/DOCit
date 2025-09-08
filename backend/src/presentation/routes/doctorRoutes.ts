import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { DoctorController } from '../controllers/doctor/DoctorController';
import { DoctorProfileController } from '../controllers/doctor/DoctorProfileController';
import { getMulterUploader } from '../../utils/multerConfig';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { UserRole } from '../../types';

const router = express.Router();
const container = Container.getInstance();

// Controller instantiation
const doctorController = new DoctorController(container);
const doctorProfileController = new DoctorProfileController(container);

// Multer setup for multiple file types
const upload = getMulterUploader('doctor-files', 'image-and-pdf'); // Use a single uploader for both images and PDFs
const profileUpload = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'licenseProof', maxCount: 1 },
]);

// Middleware
const doctorAuth = [authMiddleware(container), roleMiddleware([UserRole.Doctor])];

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
router.put('/subscription-plans/:id', doctorAuth, doctorController.updateSubscriptionPlan.bind(doctorController));
router.delete('/subscription-plans/:id', doctorAuth, doctorController.deleteSubscriptionPlan.bind(doctorController));

// Speciality routes
router.get('/specialities', doctorAuth, doctorController.getAllSpecialities.bind(doctorController));

// Profile routes
router.get('/:id', doctorAuth, doctorProfileController.viewProfile.bind(doctorProfileController));
router.patch('/:id', doctorAuth, profileUpload, doctorProfileController.updateProfile.bind(doctorProfileController));

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
