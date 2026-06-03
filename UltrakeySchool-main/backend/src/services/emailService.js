import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import emailTemplates from '../templates/emailTemplates.js';

class EmailService {
  constructor() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER || process.env.SMTP_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      console.error('SMTP Transporter configuration failed:', err.message);
    }
  }

  async getInstitutionEmailConfig(institutionId) {
    try {
      const Institution = mongoose.model('Institution');
      const inst = await Institution.findById(institutionId).select('settings.email-config name contact.email branding.logo').lean();
      const emailSettings = inst?.settings?.['email-config'];
      const senderEmail = emailSettings?.fromEmail || emailSettings?.smtp?.user || inst?.contact?.email || process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com';
      const senderName = emailSettings?.fromName || inst?.name || 'EduSearch';
      const supportEmail = emailSettings?.supportEmail || inst?.contact?.email || process.env.GMAIL_USER || process.env.SMTP_USER || 'support@edusearch.com';
      return { senderEmail, senderName, supportEmail, institutionName: inst?.name || '' };
    } catch {
      return {
        senderEmail: process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com',
        senderName: 'EduSearch',
        supportEmail: process.env.GMAIL_USER || process.env.SMTP_USER || 'support@edusearch.com',
        institutionName: ''
      };
    }
  }

  async logEmailToDb(toEmail, subject, htmlContent, status, errorMsg = null) {
    try {
      const Email = mongoose.model('Email');
      const User = mongoose.model('User');

      let resolvedUserId = null;
      let resolvedInstitutionId = null;

      const user = await User.findOne({ email: toEmail.toLowerCase() });
      if (user) {
        resolvedUserId = user._id;
        resolvedInstitutionId = user.institutionId || user.institution;
      }

      if (!resolvedUserId) {
        const UserCredential = mongoose.model('UserCredential');
        const credUser = await UserCredential.findOne({ email: toEmail.toLowerCase() });
        if (credUser) {
          resolvedUserId = credUser._id;
          resolvedInstitutionId = credUser.institutionId || credUser.institution;
        }
      }

      const systemAdmin = await User.findOne({ role: 'superadmin' });
      const senderUserId = systemAdmin ? systemAdmin._id : (resolvedUserId || new mongoose.Types.ObjectId());

      await Email.create({
        userId: resolvedUserId || senderUserId,
        institutionId: resolvedInstitutionId,
        sender: {
          userId: senderUserId,
          name: 'EduSearch',
          email: process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com'
        },
        recipients: [{
          userId: resolvedUserId,
          name: toEmail.split('@')[0],
          email: toEmail,
          type: 'to'
        }],
        subject: subject,
        content: htmlContent.replace(/<[^>]*>/g, '').substring(0, 500),
        htmlContent: htmlContent,
        status: status,
        folder: 'sent',
        priority: 'normal'
      });
    } catch (err) {
      console.error('Failed to log sent email to database:', err.message);
    }
  }

  async sendMailSafe(mailOptions) {
    let emailStatus = 'sent';
    let errorMsg = null;
    let result = null;

    try {
      const user = process.env.GMAIL_USER || process.env.SMTP_USER;
      const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

      if (this.transporter && user && pass) {
        result = await this.transporter.sendMail(mailOptions);
      } else {
        console.warn('[EmailService] SMTP credentials not fully configured. Simulating successful email send.');
        result = { messageId: 'simulated_' + Date.now() };
      }
    } catch (error) {
      console.error('[EmailService] SMTP sendMail failed:', error.message);
      emailStatus = 'failed';
      errorMsg = error.message;
      result = { messageId: 'simulated_fallback_' + Date.now(), error: error.message };
    }

    await this.logEmailToDb(mailOptions.to, mailOptions.subject, mailOptions.html || mailOptions.text || '', emailStatus, errorMsg);
    return result;
  }

  async sendCredentialEmail(email, credentials) {
    try {
      const mailOptions = {
        from: `"EduSearch" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com'}>`,
        to: email,
        subject: 'Your Login Credentials - EduSearch',
        html: emailTemplates.credentialEmail(credentials),
      };

      const result = await this.sendMailSafe(mailOptions);
      return result;
    } catch (error) {
      console.error('[EmailService] Failed to send credential email:', error.message);
      throw error;
    }
  }

  async sendSupportEmail(fromEmail, institutionName, subject, message, priority = 'medium') {
    try {
      const supportData = { fromEmail, institutionName, subject, message, priority };

      const mailOptions = {
        from: `"EduSearch Support" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com'}>`,
        to: process.env.SUPERADMIN_EMAIL || 'support@edusearch.com',
        subject: `[Support Request] ${subject}`,
        html: emailTemplates.supportEmail(supportData),
      };

      const result = await this.sendMailSafe(mailOptions);
      return result;
    } catch (error) {
      console.error('[EmailService] Failed to send support email:', error.message);
      throw error;
    }
  }

  async sendWelcomeEmail(email, registrationData) {
    try {
      const mailOptions = {
        from: `"EduSearch" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com'}>`,
        to: email,
        subject: 'Welcome to EduSearch - Registration Received',
        html: emailTemplates.welcomeEmail(registrationData),
      };

      const result = await this.sendMailSafe(mailOptions);
      return result;
    } catch (error) {
      console.error('[EmailService] Failed to send welcome email:', error.message);
      throw error;
    }
  }

  async sendPaymentConfirmationEmail(email, paymentData) {
    try {
      const instConfig = await this.getInstitutionEmailConfig(paymentData.institutionId);
      const fromName = instConfig.institutionName || 'EduSearch';
      const fromEmail = instConfig.senderEmail;
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: `Payment Confirmed - ${fromName}`,
        html: emailTemplates.paymentConfirmationEmail({
          ...paymentData,
          supportEmail: paymentData.supportEmail || instConfig.supportEmail,
          institutionName: fromName
        }),
      };

      const result = await this.sendMailSafe(mailOptions);
      return result;
    } catch (error) {
      console.error('[EmailService] Failed to send payment confirmation email:', error.message);
      throw error;
    }
  }

  isReady() {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
    return !!(this.transporter && user && pass);
  }

  getStatus() {
    return {
      ready: this.isReady(),
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.GMAIL_USER || process.env.SMTP_USER
      }
    };
  }

  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: `"EduSearch" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@edusearch.com'}>`,
        to: toEmail,
        subject: 'Test Email - EduSearch',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test Email</h2>
            <p>This is a test email from EduSearch.</p>
            <p>If you received this email, the email service is working correctly!</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      };

      const result = await this.sendMailSafe(mailOptions);
      return result;
    } catch (error) {
      console.error('[EmailService] Failed to send test email:', error.message);
      throw error;
    }
  }
}

const emailService = new EmailService();
export default emailService;
