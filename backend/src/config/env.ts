import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

function requiredEnv(variableName: string): string {
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
  return value;
}

export const env = {
  PORT: Number(requiredEnv('PORT')),
  NODE_ENV: requiredEnv('NODE_ENV'),
  CLIENT_URL: requiredEnv('CLIENT_URL'),
  MONGO_URI: requiredEnv('MONGO_URI'),
  ACCESS_TOKEN_SECRET: requiredEnv('ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: requiredEnv('REFRESH_TOKEN_SECRET'),
  EMAIL_USER: requiredEnv('EMAIL_USER'),
  EMAIL_PASS: requiredEnv('EMAIL_PASS'),
  GOOGLE_CLIENT_ID: requiredEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requiredEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URL: requiredEnv('GOOGLE_REDIRECT_URL'),
  STRIPE_SECRET_KEY: requiredEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: requiredEnv('STRIPE_WEBHOOK_SECRET'),
  CLOUDINARY_CLOUD_NAME: requiredEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requiredEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requiredEnv('CLOUDINARY_API_SECRET'),
  SOCKET_CORS_ORIGIN: requiredEnv('CLIENT_URL'),
  MAX_FILE_SIZE_BYTES: requiredEnv('MAX_FILE_SIZE_BYTES'),
  MAX_RECURRING_DAYS: requiredEnv('MAX_RECURRING_DAYS'),
  DEFAULT_TIME_FORMAT: requiredEnv('DEFAULT_TIME_FORMAT'),
  DEFAULT_DATE_FORMAT: requiredEnv('DEFAULT_DATE_FORMAT'),
};
