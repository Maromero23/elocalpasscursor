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

    const locations = await prisma.location.findMany({
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
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const { name, email, password, distributorId } = body

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
