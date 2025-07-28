const fetch = require('node-fetch');

async function testSaveDefaultAPI() {
  try {
    console.log('🧪 TESTING SAVE AS DEFAULT API\n');
    
    // Test configuration with all components
    const testRebuyConfig = {
      triggerHoursBefore: 12,
      enableRebuyEmail: true,
      emailSubject: "Your eLocalPass expires soon - Get 15% off renewal!",
      emailHeaderText: "GRAND OPENING - Don't Miss Out!",
      emailHeaderColor: "#f59a19",
      emailHeaderFontFamily: "Arial, sans-serif",
      emailHeaderFontSize: "28",
      emailMessageText: "Your eLocalPass expires soon. Renew now with an exclusive discount!",
      emailMessageColor: "#165dd0",
      emailMessageFontFamily: "Arial, sans-serif",
      emailMessageFontSize: "16",
      emailCtaText: "Get Another ELocalPass",
      emailCtaColor: "#ffffff",
      emailCtaFontFamily: "Arial, sans-serif",
      emailCtaFontSize: "18",
      emailCtaBackgroundColor: "#a7069a",
      emailFooterText: "Thank you for choosing ELocalPass for your local adventures!",
      emailFooterColor: "#2958c7",
      emailFooterFontFamily: "Arial, sans-serif",
      emailFooterFontSize: "14",
      emailPrimaryColor: "#2bff0f",
      emailSecondaryColor: "#151df9",
      emailBackgroundColor: "#ffffff",
      logoUrl: "https://www.elocalpass.com/images/elocal_logo_2.png",
      bannerImages: [
        "https://d3vmbilae16g7h.cloudfront.net/colorcopi/images/contentimages/images/grand-opening-banner-ColorCopiesUSA.jpg?v=3523"
      ],
      videoUrl: "https://www.youtube.com/watch?v=YvWlbanqRDY",
      enableFeaturedPartners: true,
      selectedAffiliates: [],
      customAffiliateMessage: "Don't forget these amazing discounts are waiting for you:",
      urgencyMessage: "Only {hoursLeft} hours left!",
      showExpirationTimer: true
    };

    console.log('📤 Sending request to save as default...');
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/admin/rebuy-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rebuyConfig: testRebuyConfig,
        action: 'saveAsDefault'
      })
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! API Response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ ERROR! API Response:');
      console.log(error);
    }

  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

testSaveDefaultAPI(); 