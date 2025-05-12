import { OAuth2Client } from 'google-auth-library';
import { ValidationError } from './errors';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URL);

export const verifyGoogleToken = async (code: string): Promise<{ googleId: string; email: string; name: string }> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: code,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new ValidationError('Invalid Google token payload');
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name || '',
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Google token verification failed: ${(error as Error).message}`);
  }
};
