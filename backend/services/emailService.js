const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');

// Email storage directory
const EMAIL_STORAGE_DIR = path.join(__dirname, '../emails');

// Ensure email storage directory exists
const ensureEmailDirectory = async () => {
  try {
    await fs.access(EMAIL_STORAGE_DIR);
  } catch {
    await fs.mkdir(EMAIL_STORAGE_DIR, { recursive: true });
  }
};

// Initialize SendGrid
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY not found in environment variables');
    return false;
  }
  
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialized successfully');
  return true;
};

// Create transporter for Gmail SMTP (fallback)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER || process.env.SMTP_USER,
      pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS
    }
  });
};

// Store email to file (for development/testing)
const storeEmailToFile = async (emailData) => {
  await ensureEmailDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `email_${timestamp}.json`;
  const filepath = path.join(EMAIL_STORAGE_DIR, filename);
  
  await fs.writeFile(filepath, JSON.stringify(emailData, null, 2));
  return filepath;
};

// Email templates
const emailTemplates = {
  submissionConfirmation: (artistName, submissionId, tracks) => {
    const tracksList = tracks.map(track => 
      `<li><strong>${track.title}</strong> - ${track.genre} (${track.bpm} BPM, ${track.key})</li>`
    ).join('');

    return {
      subject: 'Your Demo Submission Has Been Received - TuneDrop',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Confirmation - TuneDrop</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .track-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 TuneDrop</h1>
              <h2>Submission Received!</h2>
            </div>
            <div class="content">
              <p>Hi ${artistName},</p>
              <p>Thank you for submitting your music demo to TuneDrop! We're excited to listen to your tracks.</p>
              
              <div class="track-list">
                <h3>Your Submitted Tracks:</h3>
                <ul>${tracksList}</ul>
                <p><strong>Submission ID:</strong> ${submissionId}</p>
              </div>
              
              <p>Our A&R team will review your submission within the next 7-14 days. You'll receive an email notification once your tracks have been reviewed.</p>
              
              <p>In the meantime, keep creating amazing music!</p>
              
              <p>Best regards,<br>The TuneDrop Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© 2024 TuneDrop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  submissionApproved: (artistName, submissionId, feedback, adminNotes) => {
    return {
      subject: '🎉 Congratulations! Your Demo Has Been Approved - TuneDrop',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Approved - TuneDrop</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feedback-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 TuneDrop</h1>
              <h2>Your Demo Has Been Approved!</h2>
            </div>
            <div class="content">
              <p>Hi ${artistName},</p>
              <p>We're thrilled to inform you that your demo submission has been approved by our A&R team!</p>
              
              <div class="feedback-box">
                <h3>🎯 Feedback from Our Team:</h3>
                <p>${feedback || 'Your music shows great potential and aligns perfectly with our label\'s vision.'}</p>
                ${adminNotes ? `<p><strong>Additional Notes:</strong> ${adminNotes}</p>` : ''}
              </div>
              
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              
              <p>Our team will be in touch with you soon to discuss the next steps in your journey with TuneDrop.</p>
              
              <p>Congratulations on this achievement!</p>
              
              <p>Best regards,<br>The TuneDrop Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© 2024 TuneDrop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  submissionRejected: (artistName, submissionId, feedback, adminNotes) => {
    return {
      subject: 'Demo Submission Update - TuneDrop',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Update - TuneDrop</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feedback-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 TuneDrop</h1>
              <h2>Demo Submission Review Complete</h2>
            </div>
            <div class="content">
              <p>Hi ${artistName},</p>
              <p>Thank you for submitting your demo to TuneDrop. After careful review by our A&R team, we regret to inform you that we are unable to move forward with your submission at this time.</p>
              
              <div class="feedback-box">
                <h3>💡 Constructive Feedback:</h3>
                <p>${feedback || 'We encourage you to continue developing your sound and consider submitting again in the future.'}</p>
                ${adminNotes ? `<p><strong>Additional Notes:</strong> ${adminNotes}</p>` : ''}
              </div>
              
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              
              <p>We appreciate you sharing your music with us and encourage you to keep creating. The music industry is subjective, and this decision doesn't reflect the quality of your work.</p>
              
              <p>Feel free to submit new material in the future!</p>
              
              <p>Best regards,<br>The TuneDrop Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© 2024 TuneDrop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};

// Email service functions
const emailService = {
  // Send submission confirmation email
  sendSubmissionConfirmation: async (artistEmail, artistName, submissionId, tracks) => {
    try {
      const template = emailTemplates.submissionConfirmation(artistName, submissionId, tracks);
      
      const emailData = {
        from: process.env.EMAIL_FROM || 'submissions@tunedrop.com',
        to: artistEmail,
        subject: template.subject,
        html: template.html,
        timestamp: new Date().toISOString(),
        type: 'submission_confirmation',
        submissionId: submissionId
      };

      // Try SendGrid first, fallback to Gmail SMTP
      if (initializeSendGrid()) {
        try {
          const result = await sgMail.send(emailData);
          console.log('✅ Email sent via SendGrid:', result[0].headers['x-message-id']);
          return { success: true, messageId: result[0].headers['x-message-id'], method: 'sendgrid' };
        } catch (sendgridError) {
          console.error('❌ SendGrid failed, trying Gmail SMTP:', sendgridError.message);
        }
      }

      // Fallback to Gmail SMTP
      const transporter = createTransporter();
      const result = await transporter.sendMail(emailData);
      console.log('✅ Email sent via Gmail SMTP:', result.messageId);
      return { success: true, messageId: result.messageId, method: 'smtp' };
    } catch (error) {
      console.error('❌ Error sending submission confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send approval email
  sendApprovalEmail: async (artistEmail, artistName, submissionId, feedback, adminNotes) => {
    try {
      const template = emailTemplates.submissionApproved(artistName, submissionId, feedback, adminNotes);
      
      const emailData = {
        from: process.env.EMAIL_FROM || 'submissions@tunedrop.com',
        to: artistEmail,
        subject: template.subject,
        html: template.html,
        timestamp: new Date().toISOString(),
        type: 'approval',
        submissionId: submissionId
      };

      // Try SendGrid first, fallback to Gmail SMTP
      if (initializeSendGrid()) {
        try {
          const result = await sgMail.send(emailData);
          console.log('✅ Approval email sent via SendGrid:', result[0].headers['x-message-id']);
          return { success: true, messageId: result[0].headers['x-message-id'], method: 'sendgrid' };
        } catch (sendgridError) {
          console.error('❌ SendGrid failed, trying Gmail SMTP:', sendgridError.message);
        }
      }

      // Fallback to Gmail SMTP
      const transporter = createTransporter();
      const result = await transporter.sendMail(emailData);
      console.log('✅ Approval email sent via Gmail SMTP:', result.messageId);
      return { success: true, messageId: result.messageId, method: 'smtp' };
    } catch (error) {
      console.error('❌ Error sending approval email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send rejection email
  sendRejectionEmail: async (artistEmail, artistName, submissionId, feedback, adminNotes) => {
    try {
      const template = emailTemplates.submissionRejected(artistName, submissionId, feedback, adminNotes);
      
      const emailData = {
        from: process.env.EMAIL_FROM || 'submissions@tunedrop.com',
        to: artistEmail,
        subject: template.subject,
        html: template.html,
        timestamp: new Date().toISOString(),
        type: 'rejection',
        submissionId: submissionId
      };

      // Try SendGrid first, fallback to Gmail SMTP
      if (initializeSendGrid()) {
        try {
          const result = await sgMail.send(emailData);
          console.log('✅ Rejection email sent via SendGrid:', result[0].headers['x-message-id']);
          return { success: true, messageId: result[0].headers['x-message-id'], method: 'sendgrid' };
        } catch (sendgridError) {
          console.error('❌ SendGrid failed, trying Gmail SMTP:', sendgridError.message);
        }
      }

      // Fallback to Gmail SMTP
      const transporter = createTransporter();
      const result = await transporter.sendMail(emailData);
      console.log('✅ Rejection email sent via Gmail SMTP:', result.messageId);
      return { success: true, messageId: result.messageId, method: 'smtp' };
    } catch (error) {
      console.error('❌ Error sending rejection email:', error);
      return { success: false, error: error.message };
    }
  },

  // Get stored emails (for admin dashboard)
  getStoredEmails: async () => {
    try {
      await ensureEmailDirectory();
      const files = await fs.readdir(EMAIL_STORAGE_DIR);
      const emails = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filepath = path.join(EMAIL_STORAGE_DIR, file);
          const content = await fs.readFile(filepath, 'utf8');
          const emailData = JSON.parse(content);
          emails.push({
            id: file,
            ...emailData,
            filepath
          });
        }
      }
      
      return emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error reading stored emails:', error);
      return [];
    }
  },

  // Test email service
  testEmailService: async () => {
    try {
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      
      const emailData = {
        from: process.env.EMAIL_FROM || 'submissions@tunedrop.com',
        to: testEmail,
        subject: 'TuneDrop Email Service Test',
        html: '<h1>Email service is working!</h1><p>This is a test email from TuneDrop.</p>',
        timestamp: new Date().toISOString(),
        type: 'test'
      };

      // Try SendGrid first, fallback to Gmail SMTP
      if (initializeSendGrid()) {
        try {
          const result = await sgMail.send(emailData);
          console.log('✅ Test email sent via SendGrid:', result[0].headers['x-message-id']);
          return { success: true, messageId: result[0].headers['x-message-id'], method: 'sendgrid', sentTo: testEmail };
        } catch (sendgridError) {
          console.error('❌ SendGrid failed, trying Gmail SMTP:', sendgridError.message);
        }
      }

      // Fallback to Gmail SMTP
      const transporter = createTransporter();
      const result = await transporter.sendMail(emailData);
      console.log('✅ Test email sent via Gmail SMTP:', result.messageId);
      return { success: true, messageId: result.messageId, method: 'smtp', sentTo: testEmail };
    } catch (error) {
      console.error('❌ Error testing email service:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
