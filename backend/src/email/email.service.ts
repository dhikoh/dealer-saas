import { Injectable, ConsoleLogger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new ConsoleLogger(EmailService.name);

    constructor() {
        this.initTransporter();
    }

    private async initTransporter() {
        // For Development: Use Ethereal or Console Fallback if no env vars
        const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
        const port = parseInt(process.env.SMTP_PORT || '587');
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (!user || !pass) {
            this.logger.warn('SMTP Credentials missing. Emails will be logged to console only.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        });

        try {
            await this.transporter.verify();
            this.logger.log(`SMTP Server Connected: ${host}`);
        } catch (error) {
            this.logger.error('SMTP Connection Failed:', error);
        }
    }

    async sendVerificationEmail(to: string, otp: string) {
        const subject = 'Verifikasi Akun OTOHUB Anda';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #00bfa5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">OTOHUB</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-top: 0;">Verifikasi Email</h2>
          <p style="color: #666; line-height: 1.6;">Halo,</p>
          <p style="color: #666; line-height: 1.6;">Terima kasih telah mendaftar di OTOHUB. Gunakan kode OTP berikut untuk memverifikasi akun Anda:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
          </div>
          
          <p style="color: #666; size: 12px; margin-top: 30px;">Kode ini berlaku selama 15 menit. Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} OTOHUB Smart System
        </div>
      </div>
    `;

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"OTOHUB System" <no-reply@otohub.com>',
                    to,
                    subject,
                    html,
                });
                this.logger.log(`Email sent: ${info.messageId}`);

                // If using Ethereal, log the preview URL
                if (process.env.SMTP_HOST?.includes('ethereal')) {
                    this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
                }
            } catch (error) {
                this.logger.error('Failed to send email:', error);
            }
        } else {
            // Fallback for dev without credentials
            this.logger.log(`[SIMULATION] Email to ${to}, OTP: ${otp}`);
        }
    }
}
