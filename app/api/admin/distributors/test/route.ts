import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// Simple test endpoint to check if basic distributor access works
export async function GET() {
  try {
    console.log('🧪 Testing distributor access...')
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try the most basic possible query
    const count = await prisma.distributor.count()
    console.log('✅ Basic count works:', count)

    // Try finding first record with minimal fields
    const first = await prisma.distributor.findFirst({
      select: {
        id: true,
        name: true
      }
    })
    console.log('✅ Basic findFirst works:', first)

    return NextResponse.json({ 
      success: true, 
      count, 
      first,
      message: "Basic distributor access working" 
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({ 
      error: "Test failed", 
      details: error.message 
    } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}
