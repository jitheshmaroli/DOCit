import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { PatientController } from '../../controllers/patient/PatientController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { PatientProfileController } from '../../controllers/patient/PatientProfileController';
import { getMulterUploader } from '../../../utils/multerConfig';

const router = express.Router();
const container = Container.getInstance();

const patientController = new PatientController(container);
const patientProfileController = new PatientProfileController(container);

const upload = getMulterUploader('patient-profiles');

const patientAuth = [authMiddleware(container), roleMiddleware(['patient'])];

// Routes for patient profile operations (view/update)
router
  .route('/:id')
  .get(
    patientAuth,
    patientProfileController.viewProfile.bind(patientProfileController)
  )
  .patch(
    patientAuth,
    upload.single('profilePicture'),
    patientProfileController.updateProfile.bind(patientProfileController)
  );

// Route for viewing doctor slot availabilty
router.get(
  '/doctors/:doctorId/availability',
  patientAuth,
  patientController.getDoctorAvailability.bind(patientController)
);

// Route for booking doctor appointment
router.post(
  '/appointments',
  patientAuth,
  patientController.bookAppointment.bind(patientController)
);

router.post(
  '/subscriptions',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.subscribeToPlan.bind(patientController)
);

router.get(
  '/subscriptions',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.getSubscriptions.bind(patientController)
);

router.post(
  '/appointments',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.bookAppointment.bind(patientController)
);

router.delete(
  '/appointments/:appointmentId',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.cancelAppointment.bind(patientController)
);

router.get(
  '/doctors/:doctorId/availability',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.getDoctorAvailability.bind(patientController)
);

router.get(
  '/doctors/:doctorId/plans',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.getDoctorPlans.bind(patientController)
);

router.get(
  '/doctors/:doctorId',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.getDoctor.bind(patientController)
);

router.get(
  '/appointments',
  authMiddleware(container),
  roleMiddleware(['patient']),
  patientController.getAppointments.bind(patientController)
);

export default router;
