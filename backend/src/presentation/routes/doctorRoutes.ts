import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { DoctorController } from '../controllers/doctor/DoctorController';
import { DoctorProfileController } from '../controllers/doctor/DoctorProfileController';
import { getMulterUploader } from '../../utils/multerConfig';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = express.Router();
const container = Container.getInstance();

// Controller instantiation
const doctorController = new DoctorController(container);
const doctorProfileController = new DoctorProfileController(container);

// Multer setup
const upload = getMulterUploader('doctor-profiles');

// Middleware
const doctorAuth = [authMiddleware(container), roleMiddleware(['doctor'])];

// Availability routes
router.get('/availability', doctorAuth, doctorController.getAvailability.bind(doctorController));
router.post('/availability', doctorAuth, doctorController.setAvailability.bind(doctorController));
router.post('/availability/slots/remove', doctorAuth, doctorController.removeSlot.bind(doctorController));
router.patch('/availability/slots', doctorAuth, doctorController.updateSlot.bind(doctorController));

// Appointment routes
router.get('/appointments', doctorAuth, doctorController.getAppointments.bind(doctorController));
router.get(
  '/patient/:patientId/appointments',
  doctorAuth,
  doctorController.getPatientAppointments.bind(doctorController)
);

// Subscription plan routes
router.get('/subscription-plans', doctorAuth, doctorController.getSubscriptionPlans.bind(doctorController));
router.post('/subscription-plans', doctorAuth, doctorController.createSubscriptionPlan.bind(doctorController));
router.patch('/subscription-plans/:id', doctorAuth, doctorController.updateSubscriptionPlan.bind(doctorController));
router.delete('/subscription-plans/:id', doctorAuth, doctorController.deleteSubscriptionPlan.bind(doctorController));

// Speciality routes
router.get('/specialities', doctorAuth, doctorController.getAllSpecialities.bind(doctorController));

// Profile routes
router.get('/:id', doctorAuth, doctorProfileController.viewProfile.bind(doctorProfileController));
router.patch(
  '/:id',
  doctorAuth,
  upload.single('profilePicture'),
  doctorProfileController.updateProfile.bind(doctorProfileController)
);

export default router;
