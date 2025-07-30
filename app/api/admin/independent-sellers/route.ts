import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "../../../../lib/prisma"
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
      // 1. Find or create the "Independent Sellers" distributor
      let independentDistributor = await tx.distributor.findFirst({
        where: { name: "Independent Sellers" }
      })

      if (!independentDistributor) {
        // Create the virtual distributor user first
        const virtualDistributorUser = await tx.user.create({
          data: {
            name: "Independent Sellers System",
            email: "system+independent@elocalpass.com",
            password: await bcrypt.hash("system-only", 12),
            role: "DISTRIBUTOR",
            isActive: true
          }
        })

        // Create the virtual distributor
        independentDistributor = await tx.distributor.create({
          data: {
            name: "Independent Sellers",
            contactPerson: "System Generated",
            email: "system+independent@elocalpass.com",
            notes: "Virtual distributor for independent sellers who don't belong to a traditional distributor hierarchy",
            userId: virtualDistributorUser.id,
            isActive: true
          }
        })
      }

      // 2. Create the independent seller's user account with INDEPENDENT_SELLER role
      const sellerUser = await tx.user.create({
        data: {
          name: contactPerson,
          email,
          password: hashedPassword,
          role: "INDEPENDENT_SELLER", // New role with dual access
          telephone,
          whatsapp,
          notes,
          isActive: true
        }
      })

      // 3. Create a virtual location for this independent seller
      const virtualLocation = await tx.location.create({
        data: {
          name: businessName,
          address: location || "",
          contactPerson,
          email,
          telephone,
          whatsapp,
          notes: `Virtual location for independent seller: ${contactPerson}`,
          distributorId: independentDistributor.id,
          userId: sellerUser.id, // Link the user as the location manager
          isActive: true
        }
      })

      // 4. Update the user to be linked to this location
      await tx.user.update({
        where: { id: sellerUser.id },
        data: { 
          locationId: virtualLocation.id,
          distributorId: independentDistributor.id
        }
      })

      return {
        user: sellerUser,
        location: virtualLocation,
        distributor: independentDistributor
      }
    })

    return NextResponse.json({
      success: true,
      message: `Independent seller "${contactPerson}" created successfully`,
      data: {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        businessName,
        locationId: result.location.id,
        distributorId: result.distributor.id
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