import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { PatientController } from '../controllers/patient/PatientController';
import { PatientProfileController } from '../controllers/patient/PatientProfileController';
import { PatientAuthController } from '../controllers/auth/PatientAuthController';
import { getMulterUploader } from '../../utils/multerConfig';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = express.Router();
const container = Container.getInstance();

// Controller instantiation
const patientController = new PatientController(container);
const patientProfileController = new PatientProfileController(container);
const patientAuthController = new PatientAuthController(container);

// Multer setup
const upload = getMulterUploader('patient-profiles');

// Middleware
const patientAuth = [authMiddleware(container), roleMiddleware(['patient'])];

// Doctor lookup routes
router.get('/doctors/verified', patientAuth, patientController.getVerifiedDoctors.bind(patientController));
router.get('/doctors/:doctorId/availability', patientAuth, patientController.getDoctorAvailability.bind(patientController));
router.get('/doctors/:doctorId/plans', patientAuth, patientController.getDoctorPlans.bind(patientController));
router.get('/doctors/:doctorId', patientAuth, patientController.getDoctor.bind(patientController));
router.get('/doctors/:doctorId/subscription', patientAuth, patientController.getActiveSubscription.bind(patientController));

// Appointment routes
router.post('/appointments', patientAuth, patientController.bookAppointment.bind(patientController));
router.get('/appointments', patientAuth, patientController.getAppointments.bind(patientController));
router.delete('/appointments/:appointmentId', patientAuth, patientController.cancelAppointment.bind(patientController));

// Subscription routes
router.post('/subscriptions', patientAuth, patientController.subscribeToPlan.bind(patientController));
router.get('/subscriptions', patientAuth, patientController.getSubscriptions.bind(patientController));

// Profile routes
router.get('/:id', patientAuth, patientProfileController.viewProfile.bind(patientProfileController));
router.patch('/:id', patientAuth, upload.single('profilePicture'), patientProfileController.updateProfile.bind(patientProfileController));

export default router;