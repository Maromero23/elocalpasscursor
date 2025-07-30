import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      businessName, 
      contactPerson, 
      email, 
      password, 
      telephone, 
      whatsapp, 
      location,
      notes
    } = body

    // Validate required fields
    if (!businessName || !contactPerson || !email || !password) {
      return NextResponse.json({ 
        error: "Missing required fields: businessName, contactPerson, email, password" 
      }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the distributor user (using distributor email or fallback to main email)
      const distributorUser = await tx.user.create({
        data: {
          name: contactPerson, // Same person managing everything
          email: email, // Use separate distributor email if provided
          password: hashedPassword,
          role: "DISTRIBUTOR", // This user acts as distributor
          telephone: telephone,
          whatsapp,
          notes: `Independent seller distributor: ${businessName}`,
          isActive: true
        }
      })

      // 2. Create the distributor (using business name)
      const distributor = await tx.distributor.create({
        data: {
          name: businessName, // Business name becomes distributor name
          contactPerson,
          email: email,
          telephone: telephone,
          whatsapp,
          notes: `Independent seller: ${contactPerson}`,
          userId: distributorUser.id,
          isActive: true
        }
      })

      // 3. Create the location user (same person, different email if needed)
      const locationUser = await tx.user.create({
        data: {
          name: contactPerson,
          email: email, // Main email for location
          password: hashedPassword,
          role: "LOCATION",
          telephone,
          whatsapp,
          notes: `Location manager for independent seller: ${businessName}`,
          isActive: true
        }
      })

      // 4. Create the location
      const locationRecord = await tx.location.create({
        data: {
          name: location || businessName, // Use location/address as location name
          contactPerson,
          email: email,
          telephone,
          whatsapp,
          notes: `Independent seller location: ${businessName}${notes ? '\nAdditional notes: ' + notes : ''}`,
          distributorId: distributor.id,
          userId: locationUser.id,
          isActive: true
        }
      })

      // 5. Create the seller user (same person with INDEPENDENT_SELLER role for dual access)
      const sellerUser = await tx.user.create({
        data: {
          name: contactPerson,
          email: email, // Same email as location
          password: hashedPassword,
          role: "INDEPENDENT_SELLER", // Special role for dual dashboard access
          telephone,
          whatsapp,
          notes: `Independent seller: ${businessName}`,
          locationId: locationRecord.id,
          distributorId: distributor.id,
          isActive: true
        }
      })

      return {
        distributor,
        location: locationRecord,
        seller: sellerUser,
        distributorUser,
        locationUser
      }
    })

    return NextResponse.json({
      success: true,
      message: `Independent seller "${businessName}" created successfully as distributor`,
      data: {
        distributorId: result.distributor.id,
        locationId: result.location.id,
        sellerId: result.seller.id,
        businessName,
        contactPerson,
        email
      }
    })

  } catch (error: any) {
    console.error("Error creating independent seller:", error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Email already exists" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create independent seller" 
    }, { status: 500 })
  }
} 