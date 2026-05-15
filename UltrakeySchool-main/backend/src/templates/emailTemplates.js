const templates = {
  // Template for sending login credentials to institutions
  credentialEmail: (data) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Credentials - UltraKey School</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff;  : 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; color: #374151; }
            .credentials-box { background-color: #f8f9fa; border: 2px solid #e5e7eb;  : 8px; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .credential-item:last-child { border-bottom: none; }
            .credential-label { font-weight: bold; color: #4F46E5; display: inline-block; width: 120px; }
            .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;  : 4px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none;  : 5px; margin: 10px 5px; }
            .btn:hover { background-color: #4338ca; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎓 Welcome to UltraKey School</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been created successfully!</p>
            </div>

            <div class="content">
                <p>Dear <strong>${data.fullName}</strong>,</p>

                <p>Your institution account has been successfully created in the UltraKey School Management System. You can now access your dashboard to manage your institution efficiently.</p>

                <div class="credentials-box">
                    <h3 style="margin-top: 0; color: #4F46E5;">🔐 Your Login Credentials</h3>

                    <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span>${data.email}</span>
                    </div>

                    <div class="credential-item">
                        <span class="credential-label">Password:</span>
                        <span style="font-family: monospace; background-color: #e5e7eb; padding: 2px 6px;  : 3px;">${data.password}</span>
                    </div>

                    <div class="credential-item">
                        <span class="credential-label">Role:</span>
                        <span>${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</span>
                    </div>

                    <div class="credential-item">
                        <span class="credential-label">Institution:</span>
                        <span>${data.instituteType} - ${data.instituteCode}</span>
                    </div>
                </div>

                <div class="warning-box">
                    <strong>⚠️ Security Notice:</strong><br>
                    Please change your password immediately after your first login for security purposes. You can update your password in the profile settings.
                </div>

                <p><strong>Getting Started:</strong></p>
                <ul>
                    <li>Login to your dashboard using the credentials above</li>
                    <li>Complete your institution profile setup</li>
                    <li>Configure your school settings and preferences</li>
                    <li>Start managing your institution efficiently</li>
                </ul>

                <p>If you encounter any issues or need assistance, please contact our support team at <strong>${process.env.SUPERADMIN_EMAIL}</strong></p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">🚀 Login to Your Dashboard</a>
                </div>

                <p>Best regards,<br>
                <strong>UltraKey School Management Team</strong></p>
            </div>

            <div class="footer">
                <p>This is an automated message from UltraKey School Management System.<br>
                Please do not reply to this email. For support, contact us at ${process.env.SUPERADMIN_EMAIL}</p>
                <p>&copy; 2024 UltraKey School. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Template for support requests from institutions to superadmin
  supportEmail: (data) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Support Request - UltraKey School</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff;  : 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; color: #374151; }
            .info-box { background-color: #f8f9fa; border: 2px solid #e5e7eb;  : 8px; padding: 20px; margin: 20px 0; }
            .info-item { margin: 8px 0; }
            .info-label { font-weight: bold; color: #4F46E5; display: inline-block; width: 100px; }
            .message-box { background-color: #ffffff; border: 1px solid #d1d5db;  : 6px; padding: 15px; margin: 15px 0; white-space: pre-wrap; line-height: 1.6; }
            .priority-badge { display: inline-block; padding: 4px 8px;  : 12px; font-size: 12px; font-weight: bold; }
            .priority-high { background-color: #fee2e2; color: #dc2626; }
            .priority-medium { background-color: #fef3c7; color: #d97706; }
            .priority-low { background-color: #d1fae5; color: #059669; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #DC2626; color: white; text-decoration: none;  : 5px; margin: 10px 5px; }
            .btn:hover { background-color: #b91c1c; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🆘 New Support Request</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Institution needs assistance</p>
            </div>

            <div class="content">
                <p>A new support request has been submitted from an institution. Please review and respond accordingly.</p>

                <div class="info-box">
                    <h3 style="margin-top: 0; color: #DC2626;">📋 Request Details</h3>

                    <div class="info-item">
                        <span class="info-label">From:</span>
                        <strong>${data.fromEmail}</strong>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Institution:</span>
                        <strong>${data.institutionName || 'Not specified'}</strong>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Subject:</span>
                        <strong>${data.subject}</strong>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Priority:</span>
                        <span class="priority-badge priority-${data.priority || 'medium'}">${(data.priority || 'medium').toUpperCase()}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Date:</span>
                        <span>${new Date().toLocaleString()}</span>
                    </div>
                </div>

                <div>
                    <h3 style="color: #374151; margin-bottom: 10px;">💬 Message:</h3>
                    <div class="message-box">
                        ${data.message.replace(/\n/g, '<br>')}
                    </div>
                </div>

                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe;  : 6px; padding: 15px; margin: 20px 0;">
                    <strong>📧 Response Instructions:</strong><br>
                    Please respond directly to the institution email: <strong>${data.fromEmail}</strong><br>
                    Include reference to this support request in your response.
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="mailto:${data.fromEmail}?subject=Re: ${data.subject}" class="btn">📧 Reply to Request</a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    This support request was automatically generated from the UltraKey School Management System.
                </p>
            </div>

            <div class="footer">
                <p>UltraKey School Management System - Support Request Handler<br>
                Generated on ${new Date().toLocaleString()}</p>
                <p>&copy; 2024 UltraKey School. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Template for welcome email when institution is first registered
  welcomeEmail: (data) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to UltraKey School</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff;  : 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; color: #374151; }
            .steps-box { background-color: #f0fdf4; border: 2px solid #bbf7d0;  : 8px; padding: 20px; margin: 20px 0; }
            .step { margin: 15px 0; display: flex; align-items: flex-start; }
            .step-number { background-color: #10B981; color: white;  : 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px; flex-shrink: 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none;  : 5px; margin: 10px 5px; font-weight: bold; }
            .btn:hover { background-color: #059669; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎉 Welcome to UltraKey School!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your registration has been received</p>
            </div>

            <div class="content">
                <p>Dear <strong>${data.fullName}</strong>,</p>

                <p>Thank you for choosing UltraKey School Management System! Your registration for <strong>${data.instituteType} - ${data.instituteCode}</strong> has been successfully received and is being processed.</p>

                <div class="steps-box">
                    <h3 style="margin-top: 0; color: #059669;">📋 What happens next?</h3>

                    <div class="step">
                        <div class="step-number">1</div>
                        <div>
                            <strong>Review Process:</strong> Our team will review your application within 24-48 hours.
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">2</div>
                        <div>
                            <strong>Approval:</strong> Once approved, you'll receive your login credentials via email.
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">3</div>
                        <div>
                            <strong>Setup:</strong> Login and complete your institution profile setup.
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">4</div>
                        <div>
                            <strong>Go Live:</strong> Start managing your institution with our comprehensive tools.
                        </div>
                    </div>
                </div>

                <p><strong>Need immediate assistance?</strong><br>
                Contact our support team at <strong>${process.env.SUPERADMIN_EMAIL}</strong></p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">🌐 Visit Our Website</a>
                </div>

                <p>We look forward to helping you streamline your institution management!</p>

                <p>Best regards,<br>
                <strong>UltraKey School Management Team</strong></p>
            </div>

            <div class="footer">
                <p>This is an automated message from UltraKey School Management System.<br>
                Registration ID: ${data.requestId || 'N/A'}</p>
                <p>&copy; 2024 UltraKey School. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `
};

export default templates;
