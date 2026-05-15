import nodemailer from 'nodemailer';
import emailTemplates from '../templates/emailTemplates.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendCredentialEmail(email, credentials) {
    try {
      const mailOptions = {
        from: `"UltraKey School" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Login Credentials - UltraKey School Management',
        html: emailTemplates.credentialEmail(credentials),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Credentials email sent successfully to ${email}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to send credential email to ${email}:`, error.message);
      throw error;
    }
  }

  async sendSupportEmail(fromEmail, institutionName, subject, message, priority = 'medium') {
    try {
      const supportData = {
        fromEmail,
        institutionName,
        subject,
        message,
        priority
      };

      const mailOptions = {
        from: `"UltraKey Support" <${process.env.GMAIL_USER}>`,
        to: process.env.SUPERADMIN_EMAIL,
        subject: `🆘 Support Request: ${subject}`,
        html: emailTemplates.supportEmail(supportData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Support email sent to superadmin from ${fromEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to send support email from ${fromEmail}:`, error.message);
      throw error;
    }
  }

  async sendWelcomeEmail(email, registrationData) {
    try {
      const mailOptions = {
        from: `"UltraKey School" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Welcome to UltraKey School - Registration Received',
        html: emailTemplates.welcomeEmail(registrationData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
      throw error;
    }
  }

  // Test email functionality
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: `"UltraKey School" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: 'Test Email - UltraKey School System',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🧪 Test Email</h2>
            <p>This is a test email from UltraKey School Management System.</p>
            <p>If you received this email, the email service is working correctly!</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent to ${toEmail}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to send test email to ${toEmail}:`, error.message);
      throw error;
    }
  }
}

const emailService = new EmailService();
export default emailService;
