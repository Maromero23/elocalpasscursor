import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
    
    // Use raw SQL to avoid Prisma model issues
    const distributors = await prisma.$queryRaw`
      SELECT 
        d.id,
        d.name,
        d.contactPerson,
        d.email,
        d.telephone,
        d.whatsapp,
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
      ORDER BY d.createdAt DESC
    `

    // Transform the result to match the expected structure
    const formattedDistributors = (distributors as any[]).map(row => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contactPerson,
      email: row.email,
      telephone: row.telephone,
      whatsapp: row.whatsapp,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        role: row.userRole,
        isActive: Boolean(row.userIsActive),
        createdAt: row.userCreatedAt
      }
    }))

    console.log(`✅ Successfully fetched ${formattedDistributors.length} distributors`)
    return NextResponse.json(formattedDistributors)

  } catch (error) {
    console.error('❌ Error fetching distributors:', error)
    return NextResponse.json(
      { error: "Failed to fetch distributors" },
      { status: 500 }
    )
  }
}

// POST /api/admin/distributors - Create new distributor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password, contactPerson, alternativeEmail, telephone, whatsapp, notes } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and distributor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with raw SQL
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await tx.$executeRaw`
        INSERT INTO users (id, name, email, password, role, isActive, createdAt, updatedAt)
        VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, 'DISTRIBUTOR', 1, datetime('now'), datetime('now'))
      `

      // Create distributor with raw SQL
      const distributorId = `dist_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await tx.$executeRaw`
        INSERT INTO Distributor (id, name, contactPerson, email, telephone, whatsapp, notes, userId, isActive, createdAt, updatedAt)
        VALUES (${distributorId}, ${name}, ${contactPerson || null}, ${alternativeEmail || email}, ${telephone || null}, ${whatsapp || null}, ${notes || null}, ${userId}, 1, datetime('now'), datetime('now'))
      `

      return { distributorId, userId }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating distributor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
