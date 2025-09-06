import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/locations - Get all locations with distributor and user info
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use raw SQL with PostgreSQL syntax
    const locations = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.name,
        l."contactPerson",
        l.email,
        l.telephone,
        l."isActive",
        l."createdAt",
        l."updatedAt",
        l."distributorId",
        u.id as "userId",
        u.name as "userName",
        u.email as "userEmail",
        u.role as "userRole",
        u."isActive" as "userIsActive",
        u."createdAt" as "userCreatedAt",
        d.id as "distId",
        d.name as "distName",
        du.id as "distUserId",
        du.name as "distUserName",
        du.email as "distUserEmail"
      FROM "Location" l
      LEFT JOIN users u ON l."userId" = u.id
      LEFT JOIN "Distributor" d ON l."distributorId" = d.id
      LEFT JOIN users du ON d."userId" = du.id
      ORDER BY l."createdAt" DESC
    `

    // Transform the result to match expected structure
    const formattedLocations = (locations as any[]).map(row => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contactPerson,
      email: row.email,
      telephone: row.telephone,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      distributorId: row.distributorId,
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        role: row.userRole,
        isActive: Boolean(row.userIsActive),
        createdAt: row.userCreatedAt
      },
      distributor: {
        id: row.distId,
        name: row.distName,
        user: {
          id: row.distUserId,
          name: row.distUserName,
          email: row.distUserEmail
        }
      },
      _count: {
        users: 0 // We'll calculate this separately if needed
      }
    }))

    return NextResponse.json(formattedLocations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/locations - Create a new location
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, distributorId, contactPerson, telephone, whatsapp, notes } = body

    if (!name || !email || !password || !distributorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if distributor exists
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId }
    })

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and location in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user account
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "LOCATION",
        }
      })

      // Create the location
      const location = await tx.location.create({
        data: {
          name,
          contactPerson,
          telephone,
          whatsapp,
          notes,
          distributorId,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          },
          distributor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      return location
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
