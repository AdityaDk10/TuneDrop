require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Gmail SMTP Email Service (Sends Real Emails)...');
  console.log('📧 Email Configuration:');
  console.log(`   Gmail User: ${process.env.GMAIL_USER || 'Not configured'}`);
  console.log(`   From Email: ${process.env.EMAIL_FROM || 'submissions@tunedrop.com'}`);
  console.log(`   Test Email: ${process.env.TEST_EMAIL || 'test@example.com'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  try {
    // Test basic email service
    console.log('📤 Sending test email...');
    const result = await emailService.testEmailService();
    
    if (result.success) {
      console.log('✅ Email service test successful!');
      console.log(`   Method: ${result.method}`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Sent to: ${result.sentTo}`);
      console.log('');
      
      console.log('📧 Email sent via Gmail SMTP!');
      console.log('   Check your email inbox for the test email');
      console.log('   (Check spam folder if not in inbox)');
    } else {
      console.log('❌ Email failed to send:');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEmailService();
