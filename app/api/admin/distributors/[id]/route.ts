import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/distributors/[id] - Get distributor details with locations and sellers
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get distributor details with raw SQL
    const distributorData = await prisma.$queryRaw`
      SELECT 
        d.id,
        d.name,
        d.contactPerson,
        d.email,
        d.telephone,
        d.whatsapp,
        d.notes,
        d.isActive,
        d.createdAt,
        d.updatedAt,
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        u.role as userRole,
        u.isActive as userIsActive,
        u.createdAt as userCreatedAt
      FROM Distributor d
      LEFT JOIN users u ON d.userId = u.id
      WHERE d.id = ${id}
    `

    if (!distributorData || (distributorData as any[]).length === 0) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const distRow = (distributorData as any[])[0]

    // Get locations with their sellers
    const locationsData = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.name,
        l.contactPerson,
        l.email,
        l.telephone,
        l.whatsapp,
        l.notes,
        l.isActive,
        l.createdAt,
        l.updatedAt,
        lu.id as locationUserId,
        lu.name as locationUserName,
        lu.email as locationUserEmail,
        lu.isActive as locationUserIsActive,
        lu.createdAt as locationUserCreatedAt
      FROM Location l
      LEFT JOIN users lu ON l.userId = lu.id
      WHERE l.distributorId = ${id}
      ORDER BY l.createdAt DESC
    `

    // Get sellers for these locations
    const sellersData = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.telephone,
        s.whatsapp,
        s.notes,
        s.role,
        s.isActive,
        s.createdAt,
        s.locationId
      FROM users s
      WHERE s.locationId IN (
        SELECT l.id FROM Location l WHERE l.distributorId = ${id}
      ) AND s.role = 'SELLER'
      ORDER BY s.createdAt DESC
    `

    // Group sellers by location
    const sellersByLocation = (sellersData as any[]).reduce((acc: any, seller: any) => {
      if (!acc[seller.locationId]) {
        acc[seller.locationId] = []
      }
      acc[seller.locationId].push({
        id: seller.id,
        name: seller.name,
        email: seller.email,
        telephone: seller.telephone,
        whatsapp: seller.whatsapp,
        notes: seller.notes,
        role: seller.role,
        isActive: Boolean(seller.isActive),
        createdAt: seller.createdAt,
        sellerConfigs: null // Will be set to actual QR config if exists
      })
      return acc
    }, {})

    // Format locations with their sellers
    const formattedLocations = (locationsData as any[]).map((location: any) => ({
      id: location.id,
      name: location.name,
      contactPerson: location.contactPerson,
      email: location.email,
      telephone: location.telephone,
      whatsapp: location.whatsapp,
      notes: location.notes,
      isActive: Boolean(location.isActive),
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      user: {
        id: location.locationUserId,
        name: location.locationUserName,
        email: location.locationUserEmail,
        isActive: Boolean(location.locationUserIsActive),
        createdAt: location.locationUserCreatedAt
      },
      sellers: sellersByLocation[location.id] || [],
      _count: {
        sellers: (sellersByLocation[location.id] || []).length
      }
    }))

    // Format final distributor object
    const formattedDistributor = {
      id: distRow.id,
      name: distRow.name,
      contactPerson: distRow.contactPerson,
      email: distRow.email,
      telephone: distRow.telephone,
      whatsapp: distRow.whatsapp,
      notes: distRow.notes,
      isActive: Boolean(distRow.isActive),
      createdAt: distRow.createdAt,
      updatedAt: distRow.updatedAt,
      user: {
        id: distRow.userId,
        name: distRow.userName,
        email: distRow.userEmail,
        role: distRow.userRole,
        isActive: Boolean(distRow.userIsActive),
        createdAt: distRow.userCreatedAt
      },
      locations: formattedLocations,
      _count: {
        locations: formattedLocations.length
      }
    }

    return NextResponse.json(formattedDistributor)

  } catch (error) {
    console.error("Error fetching distributor details:", error)
    return NextResponse.json({ error: "Failed to fetch distributor details" }, { status: 500 })
  }
}

// PUT /api/admin/distributors/[id] - Update distributor
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, contactPerson, alternativeEmail, telephone, notes } = body
    const { id } = params

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if distributor exists
    const existingDistributor = await prisma.distributor.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingDistributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    // Check if email is taken by another user
    if (email !== existingDistributor.user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      })
      if (emailTaken) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
    }

    // Update in transaction
    const distributor = await prisma.$transaction(async (tx) => {
      // Update user
      const updateData: any = { name, email }
      if (password && password.trim() !== "") {
        updateData.password = await bcrypt.hash(password, 12)
      }

      await tx.user.update({
        where: { id: existingDistributor.userId },
        data: updateData
      })

      // Update distributor
      const updatedDistributor = await tx.distributor.update({
        where: { id },
        data: { name, contactPerson, email: alternativeEmail, telephone, notes },
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          telephone: true,
          notes: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              locations: true
            }
          }
        }
      })

      return updatedDistributor
    })

    return NextResponse.json(distributor)
  } catch (error) {
    console.error("Error updating distributor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/distributors/[id] - Delete distributor
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if distributor exists and get cascade info
    const existingDistributor = await prisma.distributor.findUnique({
      where: { id },
      include: {
        user: true,
        locations: {
          include: {
            sellers: true
          }
        }
      }
    })

    if (!existingDistributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    // Delete in proper order: users → locations → distributor → user
    await prisma.$transaction(async (tx) => {
      // Delete all users under this distributor's locations
      for (const location of existingDistributor.locations) {
        await tx.user.deleteMany({
          where: { locationId: location.id }
        })
      }

      // Delete all locations under this distributor
      await tx.location.deleteMany({
        where: { distributorId: id }
      })

      // Delete the distributor profile
      await tx.distributor.delete({
        where: { id }
      })

      // Delete the user account
      await tx.user.delete({
        where: { id: existingDistributor.userId }
      })
    })

    return NextResponse.json({ message: "Distributor deleted successfully" })
  } catch (error) {
    console.error("Error deleting distributor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
