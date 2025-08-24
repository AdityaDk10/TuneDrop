const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { db } = require('../config/firebase');

// Test email service
router.post('/test', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await emailService.testEmailService();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Email service test successful (${result.method})`,
        messageId: result.messageId,
        method: result.method,
        sentTo: result.sentTo
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Email service test failed',
        details: result.error 
      });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send approval email
router.post('/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { submissionId, feedback, adminNotes } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    // Get submission details from Firestore
    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();
    const artistEmail = submissionData.artistEmail;
    const artistName = submissionData.artistName;

    // Send approval email
    const emailResult = await emailService.sendApprovalEmail(
      artistEmail, 
      artistName, 
      submissionId, 
      feedback, 
      adminNotes
    );

    if (emailResult.success) {
      // Update submission status in database
      await submissionRef.update({
        status: 'approved',
        reviewedAt: new Date(),
        feedback: feedback || '',
        adminNotes: adminNotes || '',
        emailSent: true,
        emailSentAt: new Date(),
        emailMessageId: emailResult.messageId,
        emailMethod: emailResult.method
      });

      res.json({ 
        success: true, 
        message: `Approval email sent successfully (${emailResult.method})`,
        messageId: emailResult.messageId,
        method: emailResult.method
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send approval email',
        details: emailResult.error 
      });
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send rejection email
router.post('/reject', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { submissionId, feedback, adminNotes } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    // Get submission details from Firestore
    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();
    const artistEmail = submissionData.artistEmail;
    const artistName = submissionData.artistName;

    // Send rejection email
    const emailResult = await emailService.sendRejectionEmail(
      artistEmail, 
      artistName, 
      submissionId, 
      feedback, 
      adminNotes
    );

    if (emailResult.success) {
      // Update submission status in database
      await submissionRef.update({
        status: 'rejected',
        reviewedAt: new Date(),
        feedback: feedback || '',
        adminNotes: adminNotes || '',
        emailSent: true,
        emailSentAt: new Date(),
        emailMessageId: emailResult.messageId,
        emailMethod: emailResult.method
      });

      res.json({ 
        success: true, 
        message: `Rejection email sent successfully (${emailResult.method})`,
        messageId: emailResult.messageId,
        method: emailResult.method
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send rejection email',
        details: emailResult.error 
      });
    }
  } catch (error) {
    console.error('Error sending rejection email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get stored emails (for admin dashboard)
router.get('/stored', verifyToken, requireAdmin, async (req, res) => {
  try {
    const emails = await emailService.getStoredEmails();
    res.json({ 
      success: true, 
      emails: emails 
    });
  } catch (error) {
    console.error('Error fetching stored emails:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get email history for a submission
router.get('/history/:submissionId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();
    const emailHistory = {
      emailSent: submissionData.emailSent || false,
      emailSentAt: submissionData.emailSentAt,
      emailMessageId: submissionData.emailMessageId,
      emailMethod: submissionData.emailMethod || 'unknown',
      status: submissionData.status,
      feedback: submissionData.feedback,
      adminNotes: submissionData.adminNotes
    };

    res.json({ 
      success: true, 
      emailHistory: emailHistory 
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
