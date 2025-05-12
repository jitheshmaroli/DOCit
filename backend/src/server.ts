import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectMongoDB } from './infrastructure/database/mongoConnection';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';
import authRoutes from './presentation/routes/authRoutes';
import adminRoutes from './presentation/routes/adminRoutes';
import doctorRoutes from './presentation/routes/doctorRoutes';
import patientRoutes from './presentation/routes/patientRoutes';
import otpRoutes from './presentation/routes/otpRoutes';
import userRoutes from './presentation/routes/userRoutes';
import { env } from './config/env';
import Stripe from 'stripe';
import { Container } from './infrastructure/di/container';
import logger from './utils/logger';
import { PatientSubscriptionRepository } from './infrastructure/repositories/PatientSubscriptionRepositroy';

const app = express();
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;
const CLIENT_URL = env.CLIENT_URL;
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
});
const container = Container.getInstance();
const patientSubscriptionRepository = container.get<PatientSubscriptionRepository>('IPatientSubscriptionRepository');

// Middleware setup
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For Stripe webhook
app.use(cookieParser());
app.use((req: Request, res: Response, next: NextFunction) => {
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

// Stripe webhook
app.post('/api/webhook/stripe', async (req: Request, res: Response) => {
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
app.get('/', (req: Request, res: Response) => {
  logger.info('Root endpoint accessed');
  res.send('Doctor Appointment Booking App');
});

// Error middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    await connectMongoDB(MONGO_URI);
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
