import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { qrCodeId, formData } = await request.json()

    // Validate required fields
    if (!qrCodeId || !formData?.clientName || !formData?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        seller: {
          include: {
            location: {
              include: {
                distributor: true
              }
            }
          }
        }
      }
    })

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
    }

    // Check if QR code has expired
    if (new Date() > qrCode.expiresAt) {
      return NextResponse.json({ error: 'QR code has expired' }, { status: 410 })
    }

    // Check if QR code is active
    if (!qrCode.isActive) {
      return NextResponse.json({ error: 'QR code is not active' }, { status: 403 })
    }

    // Create a landing page submission record
    const submission = await prisma.landingPageSubmission.create({
      data: {
        qrCodeId: qrCodeId,
        clientName: formData.clientName,
        email: formData.email,
        phone: formData.phone || null,
        guests: formData.guests || qrCode.guests,
        specialRequests: formData.specialRequests || null,
        submittedAt: new Date()
      }
    })

    // Here you could add email sending logic
    // await sendConfirmationEmail(submission, qrCode)

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      message: 'Form submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting landing page form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
