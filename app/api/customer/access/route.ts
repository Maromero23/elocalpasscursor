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