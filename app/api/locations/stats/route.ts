import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all active affiliates
    const allAffiliates = await (prisma as any).affiliate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        city: true,
        category: true,
        type: true
      }
    })

    // City variations mapping
    const cityVariations = {
      'Bacalar': ['Bacalar'],
      'Cancun': ['Cancún', 'Cancun'],
      'Cozumel': ['Cozumel'],
      'Holbox': ['Holbox'],
      'Isla Mujeres': ['Isla Mujeres', 'Isla mujeres'],
      'Playa del Carmen': ['Playa del Carmen', 'Playa del carmen'],
      'Puerto Aventuras': ['Puerto Aventuras'],
      'Puerto Morelos': ['Puerto Morelos', 'Puerto morelos'],
      'Tulum': ['Tulum', 'tulum']
    }

    // Calculate stats for each city
    const cityStats: Record<string, any> = {}
    
    Object.keys(cityVariations).forEach(citySlug => {
      const variations = cityVariations[citySlug as keyof typeof cityVariations]
      const cityAffiliates = allAffiliates.filter((affiliate: any) => 
        variations.some(variation => 
          affiliate.city?.toLowerCase() === variation.toLowerCase()
        )
      )
      
      // Count by type
      const typeCounts: Record<string, number> = {}
      cityAffiliates.forEach((affiliate: any) => {
        if (affiliate.type) {
          const normalizedType = affiliate.type.toLowerCase()
          typeCounts[normalizedType] = (typeCounts[normalizedType] || 0) + 1
        }
      })
      
      cityStats[citySlug] = {
        total: cityAffiliates.length,
        types: typeCounts
      }
    })

    // Calculate total stats
    const totalStats = {
      total: allAffiliates.length,
      types: allAffiliates.reduce((acc: Record<string, number>, affiliate: any) => {
        if (affiliate.type) {
          const normalizedType = affiliate.type.toLowerCase()
          acc[normalizedType] = (acc[normalizedType] || 0) + 1
        }
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      cityStats,
      totalStats
    })

  } catch (error) {
    console.error('❌ LOCATIONS STATS: Error fetching affiliate statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 