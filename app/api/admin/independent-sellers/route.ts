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
    console.log('🔍 Independent Seller API - Received data:', body)
    
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

    console.log('🔍 Extracted fields:', {
      businessName, contactPerson, email, password: password ? '[PROVIDED]' : '[MISSING]',
      telephone, whatsapp, location, notes
    })

    // Validate required fields
    if (!businessName || !contactPerson || !email || !password) {
      console.log('❌ Validation failed - missing required fields')
      return NextResponse.json({ 
        error: "Missing required fields: businessName, contactPerson, email, password" 
      }, { status: 400 })
    }

    console.log('✅ Validation passed, creating independent seller...')

    const hashedPassword = await bcrypt.hash(password, 12)

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the main user account with INDEPENDENT_SELLER role
      const mainUser = await tx.user.create({
        data: {
          name: contactPerson,
          email: email,
          password: hashedPassword,
          role: "INDEPENDENT_SELLER", // Special role for dual dashboard access
          telephone,
          whatsapp,
          notes: `Independent seller: ${businessName}`,
          isActive: true
        }
      })

      // 2. Create the distributor (using the main user)
      const distributor = await tx.distributor.create({
        data: {
          name: businessName, // Business name becomes distributor name
          contactPerson,
          email: email,
          telephone: telephone,
          whatsapp,
          notes: `Independent seller: ${contactPerson}`,
          userId: mainUser.id, // Link to the main user
          isActive: true
        }
      })

      // 3. Create the location (using the main user)
      const locationRecord = await tx.location.create({
        data: {
          name: location || businessName, // Use location/address as location name
          contactPerson,
          email: email,
          telephone,
          whatsapp,
          notes: `Independent seller location: ${businessName}${notes ? '\nAdditional notes: ' + notes : ''}`,
          distributorId: distributor.id,
          userId: mainUser.id, // Link to the main user
          isActive: true
        }
      })

      // 4. Update the main user to be linked to the location and distributor
      await tx.user.update({
        where: { id: mainUser.id },
        data: { 
          locationId: locationRecord.id,
          distributorId: distributor.id
        }
      })

      return {
        distributor,
        location: locationRecord,
        user: mainUser
      }
    })

    return NextResponse.json({
      success: true,
      message: `Independent seller "${businessName}" created successfully as distributor`,
      data: {
        distributorId: result.distributor.id,
        locationId: result.location.id,
        sellerId: result.user.id,
        businessName,
        contactPerson,
        email
      }
    })

  } catch (error: any) {
    console.error("❌ Error creating independent seller:", error)
    console.error("❌ Error details:", error.message, error.code)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Email already exists" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create independent seller: " + error.message 
    }, { status: 500 })
  }
} 