import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const category = searchParams.get('category') || ''
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }
    
    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' }
    }

    console.log(`📊 ADMIN: Fetching affiliates (page ${page}, limit ${limit})`)

    // Get affiliates with pagination
    const affiliates = await (prisma as any).affiliate.findMany({
      where: whereClause,
      orderBy: [
        { isActive: 'desc' }, // Active first
        { totalVisits: 'desc' }, // Most visits first
        { name: 'asc' }
      ],
      skip: offset,
      take: limit
    })

    // Get total count
    const totalCount = await (prisma as any).affiliate.count({
      where: whereClause
    })

    // Get summary statistics
    const stats = await (prisma as any).affiliate.aggregate({
      _count: { id: true },
      _sum: { totalVisits: true },
      where: { isActive: true }
    })

    const response = {
      success: true,
      data: affiliates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      },
      summary: {
        total: totalCount,
        active: stats._count.id || 0,
        totalVisits: stats._sum.totalVisits || 0
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ ADMIN: Error fetching affiliates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    if (type === 'import-csv') {
      return await handleCSVImport(body.csvData)
    } else {
      return await createSingleAffiliate(body)
    }

  } catch (error) {
    console.error('❌ ADMIN: Error creating/importing affiliates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createSingleAffiliate(data: any) {
  const affiliate = await (prisma as any).affiliate.create({
    data: {
      affiliateNum: data.affiliateNum,
      isActive: data.isActive ?? true,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      workPhone: data.workPhone,
      whatsApp: data.whatsApp,
      address: data.address,
      web: data.web,
      description: data.description,
      city: data.city,
      maps: data.maps,
      location: data.location,
      discount: data.discount,
      logo: data.logo,
      facebook: data.facebook,
      instagram: data.instagram,
      category: data.category,
      subCategory: data.subCategory,
      service: data.service,
      type: data.type,
      sticker: data.sticker,
      rating: data.rating ? parseFloat(data.rating) : null,
      recommended: data.recommended ?? false,
      termsConditions: data.termsConditions
    }
  })

  return NextResponse.json({
    success: true,
    affiliate: affiliate
  })
}

async function handleCSVImport(csvData: string) {
  console.log('📊 ADMIN: Starting CSV import of affiliates')
  
  // Parse CSV data
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  console.log('📋 CSV Headers:', headers)
  
  // Expected headers: Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,Terms&Cond
  
  let imported = 0
  let errors = 0
  const errorDetails = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length < headers.length || !values[5]?.includes('@')) {
        console.log(`⚠️ Skipping row ${i + 1}: Invalid data`)
        continue
      }
      
      const affiliateData = {
        affiliateNum: values[0] || null,
        isActive: values[1]?.toLowerCase() === 'true' || values[1] === '1',
        name: values[2] || 'Unknown Business',
        firstName: values[3] || null,
        lastName: values[4] || null,
        email: values[5]?.toLowerCase(),
        workPhone: values[6] || null,
        whatsApp: values[7] || null,
        address: values[8] || null,
        web: values[9] || null,
        description: values[10] || null,
        city: values[11] || null,
        maps: values[12] || null,
        location: values[13] || null,
        discount: values[14] || null,
        logo: values[15] || null,
        facebook: values[16] || null,
        instagram: values[17] || null,
        category: values[18] || null,
        subCategory: values[19] || null,
        service: values[20] || null,
        type: values[21] || null,
        sticker: values[22] || null,
        rating: values[23] ? parseFloat(values[23]) : null,
        recommended: values[24]?.toLowerCase() === 'true' || values[24] === '1',
        termsConditions: values[25] || null
      }
      
      // Check if affiliate already exists
      const existing = await (prisma as any).affiliate.findUnique({
        where: { email: affiliateData.email }
      })
      
      if (existing) {
        console.log(`⚠️ Affiliate ${affiliateData.email} already exists, skipping`)
        continue
      }
      
      await (prisma as any).affiliate.create({
        data: affiliateData
      })
      
      imported++
      console.log(`✅ Imported: ${affiliateData.name} (${affiliateData.email})`)
      
    } catch (error) {
      errors++
      errorDetails.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error(`❌ Error importing row ${i + 1}:`, error)
    }
  }
  
  console.log(`📊 CSV Import completed: ${imported} imported, ${errors} errors`)
  
  return NextResponse.json({
    success: true,
    message: `Import completed: ${imported} affiliates imported, ${errors} errors`,
    imported,
    errors,
    errorDetails: errorDetails.slice(0, 10) // Limit to first 10 errors
  })
} 