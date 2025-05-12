import { env } from '../../config/env';
import { IEmailService } from '../../core/interfaces/services/IEmailService';
import * as nodemailer from 'nodemailer';

export class EmailService implements IEmailService {
  private transporter;

  constructor() {
    const emailUser = env.EMAIL_USER?.trim();
    const emailPass = env.EMAIL_PASS?.trim();

    if (!emailUser || !emailPass) {
      throw new Error('Missing or invalid EMAIL_USER or EMAIL_PASS environment variables');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    this.transporter.verify((error) => {
      if (error) console.error('SMTP Config Error:', error);
      else console.log('SMTP Server is ready to send emails');
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_USER,
      to,
      subject,
      text,
    });
  }
}
