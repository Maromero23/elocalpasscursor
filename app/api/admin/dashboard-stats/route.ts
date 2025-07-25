import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Fetch all statistics in parallel
    const [
      totalDistributors,
      activeLocations,
      qrCodesIssued,
      monthlyRevenue
    ] = await Promise.all([
      // Total Distributors
      prisma.distributor.count(),
      
      // Active Locations
      prisma.location.count({
        where: { isActive: true }
      }),
      
      // QR Codes Issued (total from analytics)
      prisma.qRCodeAnalytics.count(),
      
      // Monthly Revenue (current month from orders)
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          amount: true
        }
      })
    ])

    const stats = {
      totalDistributors,
      activeLocations,
      qrCodesIssued,
      monthlyRevenue: monthlyRevenue._sum.amount || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('❌ DASHBOARD STATS: Error fetching dashboard statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 