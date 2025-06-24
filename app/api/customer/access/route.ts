import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectServerLanguage } from '@/lib/language-detection';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Detect customer's language from browser headers
    const acceptLanguage = request.headers.get('accept-language') || undefined;
    const customerLanguage = detectServerLanguage(acceptLanguage);
    console.log(`🌍 Customer language detected: ${customerLanguage}`);

    // Find the access token
    const accessToken = await prisma.customerAccessToken.findUnique({
      where: { token },
      include: {
        qrCode: true
      }
    });

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (new Date() > accessToken.expiresAt) {
      return NextResponse.json(
        { error: 'Access token has expired' },
        { status: 401 }
      );
    }

    // Mark token as used (optional - for analytics)
    if (!accessToken.usedAt) {
      await prisma.customerAccessToken.update({
        where: { id: accessToken.id },
        data: { usedAt: new Date() }
      });
    }

    // ✅ FIXED: Only return the specific QR code associated with this token
    // Each magic link should only show the QR code it was created for
    const specificQRCode = await prisma.qRCode.findUnique({
      where: {
        id: accessToken.qrCodeId
      },
      include: {
        // Include usage history for this specific QR code
        usage: {
          orderBy: { usedAt: 'desc' }
        }
      }
    });

    if (!specificQRCode) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      );
    }

    console.log(`🎫 Customer access: Returning specific QR code ${specificQRCode.code} for token ${token.substring(0, 20)}...`);

    // 🌍 LANGUAGE-ADAPTIVE EMAIL: Re-send welcome email in customer's language if Spanish
    if (customerLanguage === 'es') {
      console.log(`🌍 Spanish customer detected - checking if we should re-send welcome email in Spanish`);
      
      try {
        // Get the seller and configuration for this QR code
        const seller = await prisma.user.findUnique({
          where: { id: specificQRCode.sellerId },
          select: { savedConfigId: true }
        });

        if (seller?.savedConfigId) {
          // Get email templates from saved configuration
          const savedConfig = await prisma.savedQRConfiguration.findUnique({
            where: { id: seller.savedConfigId },
            select: { emailTemplates: true }
          });

          if (savedConfig?.emailTemplates) {
            const emailTemplates = JSON.parse(savedConfig.emailTemplates);
            
            // Check if we have a custom email template
            if (emailTemplates?.welcomeEmail?.customHTML || (emailTemplates?.welcomeEmail?.htmlContent && emailTemplates.welcomeEmail.htmlContent !== 'USE_DEFAULT_TEMPLATE')) {
              console.log(`📧 Re-sending welcome email in Spanish for customer: ${accessToken.customerEmail}`);
              
              // Import required functions
              const { sendEmail } = await import('@/lib/email-service');
              const { detectLanguage, t, formatDate } = await import('@/lib/translations');
              
              // Get the custom template
              const customTemplate = emailTemplates.welcomeEmail.customHTML || emailTemplates.welcomeEmail.htmlContent;
              
              // Format dates and data for Spanish
              const formattedExpirationDate = formatDate(specificQRCode.expiresAt, 'es');
              const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${token}`;
              
              // Apply variable replacement
              let processedTemplate = customTemplate
                .replace(/\{customerName\}/g, accessToken.customerName)
                .replace(/\{qrCode\}/g, specificQRCode.code)
                .replace(/\{guests\}/g, specificQRCode.guests.toString())
                .replace(/\{days\}/g, specificQRCode.days.toString())
                .replace(/\{expirationDate\}/g, formattedExpirationDate)
                .replace(/\{magicLink\}/g, magicLinkUrl)
                .replace(/\{customerPortalUrl\}/g, magicLinkUrl);

              // Apply the same translation system as in landing page
              const translateEmailHTML = async (htmlContent: string): Promise<string> => {
                let translatedHTML = htmlContent;
                
                const translateText = async (text: string): Promise<string> => {
                  if (!text || text.trim().length === 0) return text;
                  
                  let translatedText = text;
                  let translationSuccessful = false;
                  
                  // Try LibreTranslate first
                  try {
                    const response = await fetch('https://libretranslate.com/translate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        q: text,
                        source: 'en',
                        target: 'es',
                        format: 'text'
                      })
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      if (result.translatedText && result.translatedText.trim()) {
                        translatedText = result.translatedText;
                        translationSuccessful = true;
                      }
                    }
                  } catch (error) {
                    // Try MyMemory API as fallback
                    try {
                      const encodedText = encodeURIComponent(text);
                      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`);
                      
                      if (response.ok) {
                        const result = await response.json();
                        if (result.responseData && result.responseData.translatedText) {
                          translatedText = result.responseData.translatedText;
                          translationSuccessful = true;
                        }
                      }
                    } catch {}
                  }
                  
                  // Convert to informal Spanish (TÚ)
                  translatedText = translatedText
                    .replace(/\busted\b/gi, 'tú')
                    .replace(/\bUsted\b/g, 'Tú')
                    .replace(/\bsu\b/g, 'tu')
                    .replace(/\bSu\b/g, 'Tu')
                    .replace(/\bsus\b/g, 'tus')
                    .replace(/\bSus\b/g, 'Tus')
                    .replace(/\btiene\b/g, 'tienes')
                    .replace(/\bTiene\b/g, 'Tienes')
                    .replace(/\bpuede\b/g, 'puedes')
                    .replace(/\bPuede\b/g, 'Puedes');
                  
                  return translatedText;
                };
                
                // Translate text content between HTML tags
                const textPattern = />([^<]+)</g;
                let match;
                while ((match = textPattern.exec(htmlContent)) !== null) {
                  const originalText = match[1].trim();
                  if (originalText && originalText.length > 0 && !/^[0-9\s\-\(\)\[\]{}@.,:;!?]+$/.test(originalText)) {
                    const translatedText = await translateText(originalText);
                    translatedHTML = translatedHTML.replace(`>${originalText}<`, `>${translatedText}<`);
                  }
                }
                
                return translatedHTML;
              };

              // Translate the email HTML
              const translatedEmailHTML = await translateEmailHTML(processedTemplate);
              
              // Translate the email subject as well
              const originalSubject = emailTemplates.welcomeEmail.subject || 'Your ELocalPass is Ready - Instant Access';
              let translatedSubject = '¡Tu ELocalPass está listo! - Acceso inmediato'; // Default Spanish subject
              
              // Try to translate the custom subject if it exists
              if (emailTemplates.welcomeEmail.subject && emailTemplates.welcomeEmail.subject !== 'Your ELocalPass is Ready - Instant Access') {
                try {
                  // Try LibreTranslate first
                  const response = await fetch('https://libretranslate.com/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      q: originalSubject,
                      source: 'en',
                      target: 'es',
                      format: 'text'
                    })
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.translatedText && result.translatedText.trim()) {
                      translatedSubject = result.translatedText;
                    }
                  }
                } catch (error) {
                  // Try MyMemory API as fallback
                  try {
                    const encodedSubject = encodeURIComponent(originalSubject);
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedSubject}&langpair=en|es`);
                    
                    if (response.ok) {
                      const result = await response.json();
                      if (result.responseData && result.responseData.translatedText) {
                        translatedSubject = result.responseData.translatedText;
                      }
                    }
                  } catch {}
                }
              }

              // Send the translated email
              await sendEmail({
                to: accessToken.customerEmail,
                subject: translatedSubject,
                html: translatedEmailHTML
              });
              
              console.log(`✅ Spanish welcome email re-sent successfully to ${accessToken.customerEmail}`);
            }
          }
        }
      } catch (emailError) {
        console.error('❌ Error re-sending Spanish email:', emailError);
        // Don't fail the main request if email re-sending fails
      }
    }

    return NextResponse.json({
      name: accessToken.customerName,
      email: accessToken.customerEmail,
      language: customerLanguage,
      qrCodes: [specificQRCode] // ✅ Only return the one QR code for this magic link
    });

  } catch (error) {
    console.error('Customer access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 