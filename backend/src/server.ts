import express, { NextFunction, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as HttpServer } from 'http';
import { connectMongoDB } from './infrastructure/database/mongoConnection';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';
import authRoutes from './presentation/routes/authRoutes';
import adminRoutes from './presentation/routes/adminRoutes';
import doctorRoutes from './presentation/routes/doctorRoutes';
import patientRoutes from './presentation/routes/patientRoutes';
import otpRoutes from './presentation/routes/otpRoutes';
import userRoutes from './presentation/routes/userRoutes';
import chatRoutes from './presentation/routes/chatRoutes';
import notificationRoutes from './presentation/routes/notificationRoutes';
import { env } from './config/env';
import Stripe from 'stripe';
import { Container } from './infrastructure/di/container';
import logger from './utils/logger';
import { PatientSubscriptionRepository } from './infrastructure/repositories/PatientSubscriptionRepositroy';
import { SocketService } from './infrastructure/services/SocketService';
import { CustomRequest } from './types';
import { setupCronJobs } from './utils/cronJobs';

const app = express();
const server = new HttpServer(app);
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;
const CLIENT_URL = env.CLIENT_URL;
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});
const container = Container.getInstance();
const patientSubscriptionRepository = container.get<PatientSubscriptionRepository>('IPatientSubscriptionRepository');
const socketService = container.get<SocketService>('SocketService');

// Initialize Socket.IO
socketService.initialize(server);

// Middleware setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For Stripe webhook
app.use(cookieParser());
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, { ip: req.ip });
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/user', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Stripe webhook
app.post('/api/webhook/stripe', async (req: CustomRequest, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const subscription = await patientSubscriptionRepository.findByStripePaymentId(paymentIntent.id);
      if (subscription && subscription.status === 'active') {
        logger.info(`Payment already processed for payment intent: ${paymentIntent.id}`);
        res.status(200).json({ received: true });
        return;
      }
      logger.warn(`Subscription not found for payment intent: ${paymentIntent.id}`);
    }

    res.status(200).json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : (err as Error).message || 'Unknown error';
    logger.error(`Webhook error: ${message}`, err);
    res.status(400).send(`Webhook Error: ${message}`);
  }
});

// Root route
app.get('/', (req: CustomRequest, res: Response) => {
  logger.info('Root endpoint accessed');
  res.send('Doctor Appointment Booking App');
});

// Error middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    await connectMongoDB(MONGO_URI);
    setupCronJobs(container);
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT} env: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
