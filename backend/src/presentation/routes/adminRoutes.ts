import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { AdminController } from '../controllers/admin/AdminController';
import { AdminAuthController } from '../controllers/auth/AdminAuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = express.Router();
const container = Container.getInstance();

// Controller instantiation
const adminController = new AdminController(container);
const adminAuthController = new AdminAuthController(container);

// Middleware
const adminAuth = [authMiddleware(container), roleMiddleware(['admin'])];

// Subscription plan routes
router.get('/subscription-plans/pending', adminAuth, adminController.getPendingPlans.bind(adminController));
router.put('/subscription-plans/:planId/approve', adminAuth, adminController.approvePlan.bind(adminController));
router.put('/subscription-plans/:planId/reject', adminAuth, adminController.rejectPlan.bind(adminController));
router.get('/subscription-plans', adminAuth, adminController.getAllPlans.bind(adminController));
router.delete('/subscription-plans/:planId', adminAuth, adminController.deletePlan.bind(adminController));

// Subscription routes
router.get('/subscriptions', adminAuth, adminController.getPatientSubscriptions.bind(adminController));

// Appointment routes
router.get('/appointments', adminAuth, adminController.getAllAppointments.bind(adminController));
router.put('/appointments/:appointmentId/cancel', adminAuth, adminController.cancelAppointment.bind(adminController));

// Doctor management routes
router.post('/doctors', adminAuth, adminAuthController.createDoctor.bind(adminAuthController));
router.get('/doctors', adminAuth, adminAuthController.listDoctors.bind(adminAuthController));
router.patch('/verify-doctor/:doctorId', adminAuth, adminAuthController.verifyDoctor.bind(adminAuthController));
router.patch('/doctors/:id', adminAuth, adminAuthController.updateDoctor.bind(adminAuthController));
router.delete('/doctors/:id', adminAuth, adminAuthController.deleteDoctor.bind(adminAuthController));
router.patch('/doctors/:id/block', adminAuth, adminAuthController.blockDoctor.bind(adminAuthController));

// Patient management routes
router.post('/patients', adminAuth, adminAuthController.createPatient.bind(adminAuthController));
router.get('/patients', adminAuth, adminAuthController.listPatients.bind(adminAuthController));
router.patch('/patients/:id', adminAuth, adminAuthController.updatePatient.bind(adminAuthController));
router.delete('/patients/:id', adminAuth, adminAuthController.deletePatient.bind(adminAuthController));
router.patch('/patients/:id/block', adminAuth, adminAuthController.blockPatient.bind(adminAuthController));

// Speciality Routes
router.get('/specialities', adminAuth, adminController.getSpecialities.bind(adminController));
router.post('/specialities', adminAuth, adminController.addSpeciality.bind(adminController));
router.patch('/specialities/:id', adminAuth, adminController.updateSpeciality.bind(adminController));
router.delete('/specialities/:id', adminAuth, adminController.deleteSpeciality.bind(adminController));

export default router;