import express from 'express';
import createControllers from '../../infrastructure/di/controllers';
import createMiddlewares from '../../infrastructure/di/middlewares';
import { getMulterUploader } from '../../utils/multerConfig';

const router = express.Router();

// Controllers
const { patientController, patientProfileController } = createControllers();
const { authMiddleware, patientRoleMiddleware } = createMiddlewares();

// Multer setup
const upload = getMulterUploader('patient-profiles');

// Middleware
const patientAuth = [authMiddleware.exec, patientRoleMiddleware.exec];

// Doctor lookup routes
router.get('/doctors/verified', patientAuth, patientController.getVerifiedDoctors.bind(patientController));
router.get(
  '/doctors/:doctorId/availability',
  patientAuth,
  patientController.getDoctorAvailability.bind(patientController)
);
router.get('/doctors/:doctorId/plans', patientAuth, patientController.getDoctorPlans.bind(patientController));
router.get('/doctors/:doctorId', patientAuth, patientController.getDoctor.bind(patientController));
router.get(
  '/doctors/:doctorId/subscription',
  patientAuth,
  patientController.getActiveSubscription.bind(patientController)
);

// Speciality route
router.get('/specialities', patientAuth, patientController.getAllSpecialities.bind(patientController));

// Appointment routes
router.post('/appointments', patientAuth, patientController.bookAppointment.bind(patientController));
router.get('/appointments', patientAuth, patientController.getAppointments.bind(patientController));
router.get('/appointments/:appointmentId', patientAuth, patientController.getAppointment.bind(patientController));
router.delete('/appointments/:appointmentId', patientAuth, patientController.cancelAppointment.bind(patientController));
router.get(
  '/subscriptions/:subscriptionId/appointments',
  patientAuth,
  patientController.getAppointmentsBySubscription.bind(patientController)
);

// Subscription routes
router.post('/subscriptions', patientAuth, patientController.subscribeToPlan.bind(patientController));
router.post('/subscriptions/confirm', patientAuth, patientController.confirmSubscription.bind(patientController));
router.get('/subscriptions', patientAuth, patientController.getSubscriptions.bind(patientController));
router.delete(
  '/subscriptions/:subscriptionId',
  patientAuth,
  patientController.cancelSubscription.bind(patientController)
);

//invoice route
router.get('/invoice/:paymentIntentId', patientAuth, patientController.getInvoiceDetails.bind(patientController));

// Profile routes
router.get('/:id', patientAuth, patientProfileController.viewProfile.bind(patientProfileController));
router.patch(
  '/:id',
  patientAuth,
  upload.single('profilePicture'),
  patientProfileController.updateProfile.bind(patientProfileController)
);

// Review routes
router.post('/review', patientAuth, patientController.createReview.bind(patientController));
router.get('/doctors/:doctorId/reviews', patientAuth, patientController.getDoctorReviews.bind(patientController));

export default router;
