import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
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

    const distributor = await prisma.distributor.findUnique({
      where: { id },
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
        locations: {
          include: {
            sellers: {
              where: { role: "SELLER" },
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            _count: {
              select: {
                sellers: true
              }
            }
          }
        },
        _count: {
          select: {
            locations: true
          }
        }
      }
    })

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    return NextResponse.json(distributor)
  } catch (error) {
    console.error("Error fetching distributor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
