import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

// Use global Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET /api/admin/distributors - Get all distributors
export async function GET() {
  try {
    console.log('🔍 GET /api/admin/distributors called')
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('✅ Admin access confirmed, fetching distributors...')
    
    // Try a simple query first to isolate the issue
    const distributors = await prisma.distributor.findMany({
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        telephone: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ Successfully fetched', distributors.length, 'distributors')
    return NextResponse.json(distributors)
  } catch (error) {
    console.error("Error fetching distributors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/distributors - Create new distributor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password, contactPerson, alternativeEmail, telephone, notes } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and distributor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "DISTRIBUTOR",
        },
      })

      const distributor = await tx.distributor.create({
        data: {
          name,
          contactPerson,
          email: alternativeEmail || email, // Use alternative email if provided, otherwise use primary email
          telephone: telephone || null,
          notes,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
          locations: true,
        },
      })

      return distributor
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating distributor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
