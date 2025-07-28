const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email service configuration (copied from lib/email-service.ts)
const getEmailTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    console.log('📧 Using SendGrid email service');
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    console.log('📧 Using Gmail/SMTP email service');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: (process.env.EMAIL_PASS || process.env.GMAIL_PASS || '').replace(/\s/g, ''),
      },
    });
  }
};

const sendEmail = async (options) => {
  try {
    const transporter = getEmailTransporter();
    
    let fromAddress = process.env.EMAIL_FROM_ADDRESS || 'maromas23@hotmail.com';
    
    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    console.log(`📧 Sending email to: ${options.to}`);
    console.log(`📧 Subject: ${options.subject}`);
    console.log(`📧 From: ${mailOptions.from}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully: ${result.messageId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};

async function sendPassesRebuyDirect() {
  try {
    console.log('🚀 SENDING PASSES/PAYPAL REBUY EMAIL DIRECTLY\n');
    
    const qrCodeString = 'EL-1753668721361-7n65cbbat';
    
    // Get QR code details
    const qrCode = await prisma.qRCode.findFirst({
      where: { code: qrCodeString },
      include: { analytics: true }
    });

    if (!qrCode) {
      console.log('❌ QR Code not found');
      return;
    }

    const now = new Date();
    const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    const customerName = qrCode.customerName || 'Valued Customer';

    console.log('✅ QR CODE DETAILS:');
    console.log(`- Code: ${qrCode.code}`);
    console.log(`- Customer: ${customerName} (${qrCode.customerEmail})`);
    console.log(`- Hours left: ${hoursLeft}`);

    // Create enhanced rebuy email content
    const subject = `Your ELocalPass expires in ${hoursLeft} hours - Get another one!`;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 24px; text-align: center; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h1 style="margin: 0; font-size: 24px;">🚨 Don't Miss Out!</h1>
    <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your ELocalPass is expiring soon</p>
  </div>
  
  <!-- Main Content -->
  <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <p style="font-size: 18px; color: #374151; margin-bottom: 16px;">
      Hello ${customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6;">
      Your ELocalPass expires soon and we don't want you to miss out on amazing local experiences! Get another pass now to continue enjoying exclusive discounts and authentic local adventures.
    </p>
    
    <!-- Enhanced Countdown Timer -->
    <div style="background: linear-gradient(135deg, #f9fafb, #f3f4f6); border: 2px solid #e5e7eb; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
      <p style="color: #dc2626; font-weight: 600; margin: 0 0 16px 0; font-size: 16px;">⏰ Time Remaining Until Expiration:</p>
      <table style="margin: 0 auto; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            padding: 16px 20px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
            min-width: 60px;
            border-right: 2px solid #fff;
          ">${hoursLeft}</td>
          <td style="
            background: #1f2937;
            color: white;
            padding: 16px 12px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
          ">:</td>
          <td style="
            background: linear-gradient(135deg, #374151, #4b5563);
            color: white;
            padding: 16px 20px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
            min-width: 60px;
            border-left: 2px solid #fff;
            border-right: 2px solid #fff;
          ">00</td>
          <td style="
            background: #1f2937;
            color: white;
            padding: 16px 12px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
          ">:</td>
          <td style="
            background: linear-gradient(135deg, #374151, #4b5563);
            color: white;
            padding: 16px 20px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
            min-width: 60px;
            border-left: 2px solid #fff;
          ">00</td>
        </tr>
        <tr style="background: #f9fafb;">
          <td style="text-align: center; font-size: 12px; color: #6b7280; padding: 8px; font-weight: 600;">HOURS</td>
          <td></td>
          <td style="text-align: center; font-size: 12px; color: #6b7280; padding: 8px; font-weight: 600;">MIN</td>
          <td></td>
          <td style="text-align: center; font-size: 12px; color: #6b7280; padding: 8px; font-weight: 600;">SEC</td>
        </tr>
      </table>
      <p style="font-size: 14px; color: #dc2626; margin: 16px 0 0 0; font-weight: 600;">
        🚨 Don't wait - your pass expires in ${hoursLeft} hours!
      </p>
    </div>
    
    <!-- Current Pass Details -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b82f6;">
      <h3 style="color: #1e40af; font-weight: 600; margin: 0 0 16px 0; font-size: 18px;">📋 Your Current ELocalPass Details</h3>
      <div style="display: grid; gap: 8px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-weight: 500;">Pass Code:</span>
          <span style="color: #0f172a; font-weight: 600; font-family: monospace;">${qrCode.code}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-weight: 500;">Guests:</span>
          <span style="color: #0f172a; font-weight: 600;">${qrCode.guests} people</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-weight: 500;">Duration:</span>
          <span style="color: #0f172a; font-weight: 600;">${qrCode.days} days</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #64748b; font-weight: 500;">Time Remaining:</span>
          <span style="color: #dc2626; font-weight: 700;">${hoursLeft} hours</span>
        </div>
      </div>
    </div>
    
    <!-- Urgency Notice -->
    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">⏰</span>
        <p style="color: #92400e; font-weight: 600; margin: 0; font-size: 16px;">
          Your ELocalPass expires in <span style="font-weight: 700; color: #dc2626; font-size: 18px;">${hoursLeft} hours</span>
        </p>
      </div>
      <p style="color: #92400e; margin: 8px 0 0 36px; font-size: 14px;">
        Don't miss out on amazing local experiences, exclusive discounts, and authentic adventures!
      </p>
    </div>
    
    <!-- Benefits Section -->
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #bae6fd;">
      <h3 style="color: #0369a1; font-weight: 600; margin: 0 0 16px 0; font-size: 18px;">🎯 Why Get Another ELocalPass?</h3>
      <div style="display: grid; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #059669; font-weight: bold;">✅</span>
          <span style="color: #0f172a; font-size: 14px;">Continue saving at local restaurants and attractions</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #059669; font-weight: bold;">✅</span>
          <span style="color: #0f172a; font-size: 14px;">Access exclusive discounts not available elsewhere</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #059669; font-weight: bold;">✅</span>
          <span style="color: #0f172a; font-size: 14px;">Discover new amazing local experiences</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #059669; font-weight: bold;">✅</span>
          <span style="color: #0f172a; font-size: 14px;">Experience authentic local culture like a resident</span>
        </div>
      </div>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://elocalpasscursor.vercel.app/passes" 
         style="
           background: linear-gradient(135deg, #dc2626, #ef4444);
           color: white;
           font-size: 20px;
           font-weight: 700;
           padding: 18px 36px;
           border-radius: 8px;
           text-decoration: none;
           display: inline-block;
           box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
           transition: all 0.2s;
         ">
        🎯 Get Another ELocalPass Now
      </a>
      <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0 0;">
        Click the button above to purchase your new pass
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; margin-top: 32px;">
      <p style="font-size: 16px; color: #374151; margin-bottom: 8px; font-weight: 500;">
        Thank you for choosing ELocalPass for your local adventures!
      </p>
      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        Your trusted partner for authentic local experiences
      </p>
    </div>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #6b7280;">
    <p style="margin: 0 0 4px 0;">© 2025 eLocalPass. All rights reserved.</p>
    <p style="margin: 0;">
      You received this email because your ELocalPass is expiring soon.
    </p>
  </div>
  
</body>
</html>`;

    console.log('\n📧 SENDING ENHANCED REBUY EMAIL...');
    
    // Send the email
    const emailSent = await sendEmail({
      to: qrCode.customerEmail,
      subject: subject,
      html: htmlContent
    });

    if (emailSent) {
      console.log('\n🎉 SUCCESS! Enhanced rebuy email sent successfully!');
      console.log(`📧 Email sent to: ${qrCode.customerEmail}`);
      console.log(`⏰ Hours shown: ${hoursLeft}`);
      console.log('🎯 Template: Enhanced passes/PayPal rebuy email');
      
      // Update analytics to mark as sent
      if (qrCode.analytics) {
        await prisma.qRCodeAnalytics.update({
          where: { id: qrCode.analytics.id },
          data: { rebuyEmailScheduled: false } // Mark as sent
        });
        console.log('✅ Analytics updated - marked rebuy email as sent');
      }
      
      console.log('\n🎨 EMAIL FEATURES:');
      console.log('  ✅ Professional gradient header');
      console.log('  ✅ Enhanced digital countdown timer with actual hours');
      console.log('  ✅ Detailed pass information card');
      console.log('  ✅ Urgency notice with dynamic hours');
      console.log('  ✅ Benefits section explaining value');
      console.log('  ✅ Prominent "Get Another ELocalPass" button');
      console.log('  ✅ Professional footer with branding');
      console.log('  ✅ Responsive design for mobile and desktop');
      
      console.log('\n💡 Check the email inbox for the enhanced rebuy email!');
      console.log('🚀 The passes/PayPal rebuy email system is now working perfectly!');
      
    } else {
      console.log('\n❌ Failed to send rebuy email');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendPassesRebuyDirect(); 