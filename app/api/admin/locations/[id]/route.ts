import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/admin/locations/[id] - Update location
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { name, contactPerson, email, telephone, whatsapp, notes } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 })
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Check if email is already in use by another user (if email is being changed)
    if (email && email !== existingLocation.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: existingLocation.userId }
        }
      })
      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
    }

    // Update location data
    const location = await prisma.$transaction(async (tx) => {
      // Update the user account
      const updatedUser = await tx.user.update({
        where: { id: existingLocation.userId },
        data: {
          ...(email && { email }),
          name: name // Update name to match location name
        }
      })

      // Update the location profile
      const updatedLocation = await tx.location.update({
        where: { id },
        data: {
          name,
          contactPerson: contactPerson || null,
          email: email || null,
          telephone: telephone || null,
          whatsapp: whatsapp || null,
          notes: notes || null
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
          sellers: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          }
        }
      })

      return updatedLocation
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/locations/[id] - Delete location
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if location exists and get user ID for deletion
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      include: {
        sellers: true,
        user: true
      }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Check if location has sellers
    if (existingLocation.sellers.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete location with sellers. Please remove all sellers first." 
      }, { status: 400 })
    }

    // Delete location and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the location first
      await tx.location.delete({
        where: { id }
      })

      // Delete the associated user account
      await tx.user.delete({
        where: { id: existingLocation.userId }
      })
    })

    return NextResponse.json({ message: "Location deleted successfully" })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
