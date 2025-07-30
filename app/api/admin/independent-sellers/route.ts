import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST /api/admin/independent-sellers - Create independent seller with virtual distributor/location
export async function POST(request: Request) {
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
      notes,
      address 
    } = body

    if (!businessName || !contactPerson || !email || !password) {
      return NextResponse.json({ 
        error: "Business name, contact person, email, and password are required" 
      }, { status: 400 })
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: "A user with this email already exists" 
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

      // 2. Create the independent seller's user account with ADMIN role for analytics access
      const sellerUser = await tx.user.create({
        data: {
          name: contactPerson,
          email,
          password: hashedPassword,
          role: "ADMIN", // Give admin access for analytics
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
          contactPerson,
          email,
          telephone,
          whatsapp,
          notes: `Independent business location for ${businessName}. ${notes || ''}`.trim(),
          distributorId: independentDistributor.id,
          userId: sellerUser.id, // The seller manages their own location
          isActive: true
        }
      })

      // 4. Update the user to be associated with this location as a seller
      await tx.user.update({
        where: { id: sellerUser.id },
        data: {
          locationId: virtualLocation.id
        }
      })

      return {
        seller: sellerUser,
        location: virtualLocation,
        distributor: independentDistributor
      }
    })

    return NextResponse.json({
      success: true,
      message: "Independent seller created successfully",
      data: {
        sellerId: result.seller.id,
        sellerEmail: result.seller.email,
        businessName: result.location.name,
        locationId: result.location.id,
        distributorId: result.distributor.id
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating independent seller:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 