import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initializes the SMTP transporter or returns existing instance
   */
  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = parseInt(process.env.SMTP_PORT || '2525');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Set up standard SMTP connection pool
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for SSL, false for TLS/STARTTLS
      auth: user && pass ? { user, pass } : undefined,
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    return this.transporter;
  }

  /**
   * Sends user email verification links (Nodemailer SMTP)
   */
  public static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const transporter = this.getTransporter();
    const verifyLink = `https://api.petsgram.io/api/v1/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@petsgram.io',
      to: email,
      subject: 'Verify your PETSGRAM Account 🐾',
      text: `Welcome to PETSGRAM! Verify your account by opening this link: ${verifyLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #eae3db; border-radius: 12px; background: #faf6f0;">
          <h2 style="color: #d97452; margin-top: 0;">Welcome to PETSGRAM!</h2>
          <p>Thank you for signing up to connect with adoptable paws and shelters.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${verifyLink}" style="background: #d97452; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 0.8rem; color: #8e8276;">If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    // If SMTP credentials are missing, run sandbox fallback console logs
    const user = process.env.SMTP_USER;
    if (!user) {
      console.info(`==============================================================================`);
      console.info(`📧 EMAIL SANDBOX PREVIEW: User Email Verification Link`);
      console.info(`👉 Send To: ${email}`);
      console.info(`👉 Link: ${verifyLink}`);
      console.info(`==============================================================================`);
      return true;
    }

    try {
      await transporter.sendMail(mailOptions);
      console.info(`EMAIL DISPATCHED: Verification sent successfully to ${email}.`);
      return true;
    } catch (error: any) {
      console.error(`ERROR: SMTP delivery failure. Message: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends secure password reset verification keys (Nodemailer SMTP)
   */
  public static async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const transporter = this.getTransporter();
    const resetLink = `https://petsgram.io/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@petsgram.io',
      to: email,
      subject: 'Reset your PETSGRAM Password 🔑',
      text: `You requested a password reset. Reset your password by opening this link: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #eae3db; border-radius: 12px; background: #faf6f0;">
          <h2 style="color: #d97452; margin-top: 0;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resetLink}" style="background: #d97452; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 0.8rem; color: #8e8276;">Link expires in 1 hour. If you did not request this, ignore this email.</p>
        </div>
      `
    };

    const user = process.env.SMTP_USER;
    if (!user) {
      console.info(`==============================================================================`);
      console.info(`📧 EMAIL SANDBOX PREVIEW: Secure Password Reset Link`);
      console.info(`👉 Send To: ${email}`);
      console.info(`👉 Link: ${resetLink}`);
      console.info(`==============================================================================`);
      return true;
    }

    try {
      await transporter.sendMail(mailOptions);
      console.info(`EMAIL DISPATCHED: Reset link sent to ${email}.`);
      return true;
    } catch (error: any) {
      console.error(`ERROR: SMTP password reset delivery failure. Message: ${error.message}`);
      return false;
    }
  }
}
export default EmailService;
