import express, { Request, Response } from 'express';
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
import { PatientSubscriptionRepository } from './infrastructure/repositories/PatientSubscriptionRepositroy';

const app = express();
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;
const CLIENT_URL = env.CLIENT_URL;
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
const container = Container.getInstance();
const patientSubscriptionRepository =
  container.get<PatientSubscriptionRepository>(
    'IPatientSubscriptionRepository'
  );

// Middleware setup
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For Stripe webhook
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

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
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const subscription =
        await patientSubscriptionRepository.findByStripePaymentId(
          paymentIntent.id
        );
      if (subscription && subscription.status === 'active') {
        // Payment already processed
        res.status(200).json({ received: true });
        return;
      }
      // Handle edge case or log if subscription not found
      console.warn(
        `Subscription not found for payment intent: ${paymentIntent.id}`
      );
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Doctor Appointment Booking App');
});

// Error middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    await connectMongoDB(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
