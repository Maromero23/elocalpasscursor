import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, qrCodeId, guests, days } = body;

    if (!token || !qrCodeId || !guests || !days) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Verify the QR code belongs to this customer
    if (accessToken.qrCodeId !== qrCodeId) {
      return NextResponse.json(
        { error: 'QR code does not belong to this customer' },
        { status: 403 }
      );
    }

    // Calculate new expiration date
    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt);
    expiresAt.setDate(expiresAt.getDate() + days);

    // Create new activation record
    const activation = await prisma.qRCodeActivation.create({
      data: {
        qrCodeId,
        customerEmail: accessToken.customerEmail,
        customerName: accessToken.customerName,
        guests,
        days,
        cost: 0, // Customer doesn't pay - seller's distributor handles payment
        activatedAt,
        expiresAt,
        isActive: true
      }
    });

    // Update the main QR code record with the new activation details
    await prisma.qRCode.update({
      where: { id: qrCodeId },
      data: {
        guests,
        days,
        expiresAt,
        isActive: true
      }
    });

    // Deactivate any previous activations for this QR code
    await prisma.qRCodeActivation.updateMany({
      where: {
        qrCodeId,
        id: { not: activation.id }
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      activation: {
        id: activation.id,
        guests: activation.guests,
        days: activation.days,
        activatedAt: activation.activatedAt.toISOString(),
        expiresAt: activation.expiresAt.toISOString(),
        isActive: activation.isActive
      }
    });

  } catch (error) {
    console.error('Customer reactivation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    );
  }
} 