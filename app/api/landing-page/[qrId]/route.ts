import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    const { qrId } = params

    // Find the QR code with all related data
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrId },
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

    // Get the default landing page template
    const template = await prisma.landingPageTemplate.findFirst({
      where: { isDefault: true }
    })

    if (!template) {
      return NextResponse.json({ error: 'No landing page template configured' }, { status: 500 })
    }

    // Get global QR configuration for pricing
    const globalConfig = await prisma.qrGlobalConfig.findFirst()

    // Prepare QR data
    const qrData = {
      id: qrCode.id,
      sellerName: qrCode.seller.name || 'eLocalPass Seller',
      locationName: qrCode.seller.location?.name || 'Local Area',
      distributorName: qrCode.seller.location?.distributor?.name || 'eLocalPass',
      daysValid: qrCode.days,
      guestsAllowed: qrCode.guests,
      expiresAt: qrCode.expiresAt.toISOString(),
      issuedAt: qrCode.createdAt.toISOString(),
      clientName: undefined // Will be filled by form
    }

    // Prepare template data
    const templateData = {
      id: template.id,
      logoUrl: template.logoUrl,
      primaryColor: template.primaryColor,
      secondaryColor: template.secondaryColor,
      backgroundColor: template.backgroundColor,
      headerText: template.headerText,
      descriptionText: template.descriptionText,
      ctaButtonText: template.ctaButtonText,
      showPayPal: template.showPayPal,
      showContactForm: template.showContactForm,
      customCSS: template.customCSS
    }

    // Prepare pricing data if configured
    let pricingData = null
    if (globalConfig && globalConfig.button2PricingType !== 'FREE') {
      if (globalConfig.button2PricingType === 'FIXED') {
        pricingData = {
          amount: globalConfig.button2FixedPrice || 0,
          currency: 'USD',
          description: `Per person, valid ${qrCode.days} days`
        }
      } else if (globalConfig.button2PricingType === 'VARIABLE') {
        const totalCost = qrCode.cost
        pricingData = {
          amount: totalCost,
          currency: 'USD',
          description: `${qrCode.guests} guests × ${qrCode.days} days`
        }
      }
    }

    return NextResponse.json({
      qrData,
      template: templateData,
      pricing: pricingData
    })

  } catch (error) {
    console.error('Error fetching landing page data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
