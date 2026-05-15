import { body, param } from 'express-validator';

const settingsValidators = {
  updateSettings: [
    body('updatedBy').optional().isString()
  ],

  updateCategory: [
    param('category').isIn([
      'company', 'email', 'sms', 'storage', 'payment', 'tax',
      'security', 'notifications', 'integrations', 'backup', 'maintenance'
    ]).withMessage('Invalid settings category')
  ],

  testEmailSettings: [
    body('host').notEmpty().withMessage('SMTP host is required'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('Valid port number is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('fromEmail').isEmail().withMessage('Valid from email is required')
  ],

  testSMSSettings: [
    body('provider').isIn(['twilio', 'aws-sns', 'nexmo', 'messagebird', 'textlocal']).withMessage('Invalid SMS provider')
  ],

  importSettings: [
    body('settings').notEmpty().withMessage('Settings data is required'),
    body('updatedBy').optional().isString()
  ]
};

export default settingsValidators;
