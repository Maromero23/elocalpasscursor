import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('📊 DASHBOARD STATS: Starting API call...')
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      console.log('❌ DASHBOARD STATS: Unauthorized access')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('✅ DASHBOARD STATS: Authorized, fetching stats...')

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    console.log('📅 DASHBOARD STATS: Date range:', { startOfMonth, endOfMonth })

    // Fetch all statistics in parallel with better error handling
    const [
      totalDistributors,
      activeLocations,
      qrCodesIssued,
      monthlyRevenue
    ] = await Promise.all([
      // Total Distributors
      prisma.distributor.count()
        .then(count => {
          console.log('📈 DASHBOARD STATS: Distributors count:', count)
          return count
        })
        .catch(error => {
          console.error('❌ DASHBOARD STATS: Distributors count error:', error)
          return 0
        }),
      
      // Active Locations
      prisma.location.count({
        where: { isActive: true }
      })
        .then(count => {
          console.log('📈 DASHBOARD STATS: Active locations count:', count)
          return count
        })
        .catch(error => {
          console.error('❌ DASHBOARD STATS: Active locations count error:', error)
          return 0
        }),
      
      // QR Codes Issued (total from analytics)
      prisma.qRCodeAnalytics.count()
        .then(count => {
          console.log('📈 DASHBOARD STATS: QR codes count:', count)
          return count
        })
        .catch(error => {
          console.error('❌ DASHBOARD STATS: QR codes count error:', error)
          return 0
        }),
      
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
        .then(result => {
          console.log('📈 DASHBOARD STATS: Monthly revenue result:', result)
          return result
        })
        .catch(error => {
          console.error('❌ DASHBOARD STATS: Monthly revenue error:', error)
          return { _sum: { amount: 0 } }
        })
    ])

    // Ensure monthlyRevenue has the expected structure
    const monthlyRevenueAmount = monthlyRevenue?._sum?.amount ?? 0
    console.log('💰 DASHBOARD STATS: Final monthly revenue amount:', monthlyRevenueAmount)

    const stats = {
      totalDistributors: totalDistributors || 0,
      activeLocations: activeLocations || 0,
      qrCodesIssued: qrCodesIssued || 0,
      monthlyRevenue: monthlyRevenueAmount
    }

    console.log('✅ DASHBOARD STATS: Final stats:', stats)
    return NextResponse.json(stats)

  } catch (error) {
    console.error('💥 DASHBOARD STATS: Unexpected error:', error)
    console.error('💥 DASHBOARD STATS: Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('💥 DASHBOARD STATS: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Return safe default values
    return NextResponse.json({
      totalDistributors: 0,
      activeLocations: 0,
      qrCodesIssued: 0,
      monthlyRevenue: 0
    })
  }
} 