import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectMongoDB } from './infrastructure/database/mongoConnection';
import patientAuthRoutes from './presentation/routes/auth/patientAuthRoutes';
import doctorAuthRoutes from './presentation/routes/auth/doctorAuthRoutes';
import adminAuthRoutes from './presentation/routes/auth/adminAuthRoutes';
import sharedAuthRoutes from './presentation/routes/auth/sharedAuthRoutes';
import userRoutes from './presentation/routes/user/userRoutes';
import otpRoutes from './presentation/routes/otp/otpRoutes';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';
import patientRoutes from './presentation/routes/patient/patientRoutes';
import doctorRoutes from './presentation/routes/doctor/doctorRoutes';
import { env } from './config/env';

const app = express();
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;
const CLIENT_URL = env.CLIENT_URL;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth/patient', patientAuthRoutes);
app.use('/api/auth/doctor', doctorAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth', sharedAuthRoutes);
app.use('/api/user', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Doctor Appointment Booking App');
});

app.use(errorMiddleware);

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
