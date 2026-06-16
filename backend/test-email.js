/**
 * Test Email Configuration
 * Run this to verify SMTP credentials are working
 * 
 * Usage: node test-email.js
 */

require('dotenv').config();
const { sendProcessNotification } = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');
  
  // Check if credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials not found in .env file');
    console.log('Please add:');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password');
    process.exit(1);
  }

  console.log('📧 SMTP Configuration:');
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Pass: ${process.env.SMTP_PASS.substring(0, 4)}****`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

  console.log('📤 Sending test email...\n');

  try {
    const result = await sendProcessNotification({
      recipientEmail: process.env.SMTP_USER, // Send to yourself
      recipientName: 'Test User',
      eventType: 'RECEIVED',
      certificateType: 'barangay_clearance',
      referenceNumber: 'TEST-' + Date.now(),
      applicantName: 'Juan Dela Cruz',
      comments: 'This is a test email from BrgyDesk Email Notification System',
      requestId: 'test-123'
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`\n📬 Check your inbox: ${process.env.SMTP_USER}`);
      console.log('   (Don\'t forget to check spam folder)\n');
    } else {
      console.error('❌ Email failed to send');
      console.error(`   Error: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

testEmail();
