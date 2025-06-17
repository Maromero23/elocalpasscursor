import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const code = searchParams.get('code');

    if (!token || !code) {
      return NextResponse.json(
        { error: 'Access token and QR code are required' },
        { status: 400 }
      );
    }

    // Verify the access token
    const accessToken = await prisma.customerAccessToken.findUnique({
      where: { token },
      include: {
        qrCode: true
      }
    });

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Invalid access token' },
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

    // Find the QR code and verify it belongs to this customer
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: code,
        customerEmail: accessToken.customerEmail
      }
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code not found or access denied' },
        { status: 404 }
      );
    }

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(qrCode.landingUrl || `https://elocalpass.com/landing/${qrCode.code}`, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Return the image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${qrCode.code}.png"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('QR download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 