const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default rebuy email HTML template
const DEFAULT_REBUY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your eLocalPass Expires Soon</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
        }
        .header {
            text-align: center;
            background-color: #FF6B35;
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        .content h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .cta-button {
            display: inline-block;
            background-color: #FF6B35;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #E55A2B;
        }
        .expiry-info {
            background-color: #FFF3E0;
            border-left: 4px solid #FF6B35;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #888;
            font-size: 14px;
            border-top: 1px solid #eee;
        }
        .discount-badge {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Your eLocalPass Expires Soon!</h1>
        </div>
        
        <div class="content">
            <h2>Don't Miss Out on Your Local Deals!</h2>
            
            <p>Hi {{customerName}},</p>
            
            <p>Your eLocalPass is expiring soon and we don't want you to miss out on amazing local deals and experiences!</p>
            
            <div class="expiry-info">
                <strong>📅 Expiry Date:</strong> {{expiryDate}}<br>
                <strong>🏪 Business:</strong> {{businessName}}<br>
                <strong>📍 Location:</strong> {{businessLocation}}
            </div>
            
            <div class="discount-badge">
                🎉 Special Renewal Offer: 15% OFF
            </div>
            
            <p>Renew your eLocalPass today and continue enjoying exclusive benefits:</p>
            
            <ul style="text-align: left; display: inline-block; margin: 20px 0;">
                <li>✅ Exclusive local discounts</li>
                <li>✅ Priority booking access</li>
                <li>✅ Member-only special offers</li>
                <li>✅ No expiration worries</li>
            </ul>
            
            <a href="{{renewalLink}}" class="cta-button">
                🔄 Renew My eLocalPass Now
            </a>
            
            <p style="font-size: 14px; color: #888;">
                This exclusive 15% discount expires in 48 hours. Don't wait!
            </p>
        </div>
        
        <div class="footer">
            <p>Questions? Contact us at {{supportEmail}}</p>
            <p>© {{currentYear}} eLocalPass. All rights reserved.</p>
            <p style="font-size: 12px;">
                You received this email because your eLocalPass is expiring soon.
            </p>
        </div>
    </div>
</body>
</html>`;

async function fixDefaultRebuyTemplate() {
  try {
    console.log('🔧 FIXING DEFAULT REBUY EMAIL TEMPLATE\n');
    
    // Find the default template
    const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    });
    
    if (!defaultTemplate) {
      console.log('❌ No default rebuy template found in database');
      console.log('Creating new default template...');
      
      const newTemplate = await prisma.rebuyEmailTemplate.create({
        data: {
          name: 'Default Rebuy Template',
          subject: 'Your eLocalPass Expires Soon - Renew with 15% Off!',
          customHTML: DEFAULT_REBUY_HTML,
          isDefault: true
        }
      });
      
      console.log('✅ Created new default rebuy template');
      console.log(`   ID: ${newTemplate.id}`);
      console.log(`   HTML Length: ${DEFAULT_REBUY_HTML.length} characters`);
      
    } else {
      console.log(`📧 Found default template: ${defaultTemplate.name}`);
      console.log(`   ID: ${defaultTemplate.id}`);
      console.log(`   Current HTML Length: ${defaultTemplate.customHTML?.length || 0} characters`);
      
      if (!defaultTemplate.customHTML || defaultTemplate.customHTML.length === 0) {
        console.log('🔧 Updating empty default template with HTML content...');
        
        const updatedTemplate = await prisma.rebuyEmailTemplate.update({
          where: { id: defaultTemplate.id },
          data: {
            customHTML: DEFAULT_REBUY_HTML,
            subject: 'Your eLocalPass Expires Soon - Renew with 15% Off!'
          }
        });
        
        console.log('✅ Updated default rebuy template');
        console.log(`   New HTML Length: ${DEFAULT_REBUY_HTML.length} characters`);
        console.log(`   New Subject: ${updatedTemplate.subject}`);
        
      } else {
        console.log('✅ Default template already has HTML content');
        console.log('   No update needed');
      }
    }
    
    // Show preview of the template
    console.log('\n📝 HTML TEMPLATE PREVIEW:');
    console.log(`Length: ${DEFAULT_REBUY_HTML.length} characters`);
    console.log(`Preview: ${DEFAULT_REBUY_HTML.substring(0, 200)}...`);
    
    // Check template variables
    const variables = DEFAULT_REBUY_HTML.match(/\{\{[^}]+\}\}/g) || [];
    console.log('\n🔤 TEMPLATE VARIABLES FOUND:');
    variables.forEach(variable => {
      console.log(`   ${variable}`);
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Default rebuy template fix complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

fixDefaultRebuyTemplate(); 