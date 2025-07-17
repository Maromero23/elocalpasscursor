import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const rating = searchParams.get('rating')
    const recommended = searchParams.get('recommended')

    // Build where clause
    let whereClause: any = {
      isActive: true // Only show active affiliates
    }
    
    if (city) {
      // Handle city name variations
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
      
      const variations = cityVariations[city as keyof typeof cityVariations] || [city]
      whereClause.city = {
        in: variations,
        mode: 'insensitive'
      }
    }
    
    if (category) {
      whereClause.category = category
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (rating) {
      whereClause.rating = {
        gte: parseFloat(rating)
      }
    }
    
    if (recommended === 'true') {
      whereClause.recommended = true
    }

    const affiliates = await (prisma as any).affiliate.findMany({
      where: whereClause,
      orderBy: [
        { recommended: 'desc' },
        { rating: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        workPhone: true,
        whatsApp: true,
        address: true,
        web: true,
        description: true,
        city: true,
        maps: true,
        location: true,
        discount: true,
        logo: true,
        facebook: true,
        instagram: true,
        category: true,
        subCategory: true,
        service: true,
        type: true,
        rating: true,
        recommended: true,
        totalVisits: true,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      affiliates,
      total: affiliates.length
    })

  } catch (error) {
    console.error('❌ LOCATIONS: Error fetching affiliates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 