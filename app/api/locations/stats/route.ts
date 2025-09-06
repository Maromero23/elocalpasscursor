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

    // City variations mapping - using the same slugs as frontend
    const cityVariations = {
      'bacalar': ['Bacalar'],
      'cancun': ['Cancún', 'Cancun'],
      'cozumel': ['Cozumel'],
      'holbox': ['Holbox'],
      'isla-mujeres': ['Isla Mujeres', 'Isla mujeres'],
      'playa-del-carmen': ['Playa del Carmen', 'Playa del carmen'],
      'puerto-aventuras': ['Puerto Aventuras'],
      'puerto-morelos': ['Puerto Morelos', 'Puerto morelos'],
      'tulum': ['Tulum', 'tulum']
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
          let normalizedType = affiliate.type.toLowerCase()
          
          // Normalize type variations
          if (normalizedType === 'restaurants') normalizedType = 'restaurant'
          if (normalizedType === 'stores') normalizedType = 'store'
          if (normalizedType === 'services') normalizedType = 'service'
          
          typeCounts[normalizedType] = (typeCounts[normalizedType] || 0) + 1
        } else {
          // Count affiliates without type as "uncategorized"
          typeCounts['uncategorized'] = (typeCounts['uncategorized'] || 0) + 1
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
          let normalizedType = affiliate.type.toLowerCase()
          
          // Normalize type variations
          if (normalizedType === 'restaurants') normalizedType = 'restaurant'
          if (normalizedType === 'stores') normalizedType = 'store'
          if (normalizedType === 'services') normalizedType = 'service'
          
          acc[normalizedType] = (acc[normalizedType] || 0) + 1
        } else {
          // Count affiliates without type as "uncategorized"
          acc['uncategorized'] = (acc['uncategorized'] || 0) + 1
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
      { error: 'Internal server error' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 