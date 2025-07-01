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

// Proper CSV parser that handles quoted fields and commas within quotes
function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }
  
  // Add the last field
  result.push(current.trim())
  
  // Filter out empty fields at the beginning and end (common CSV export issue)
  while (result.length > 0 && result[0] === '') {
    result.shift()
  }
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop()
  }
  
  return result
}

async function handleCSVImport(csvData: string) {
  console.log('📊 ADMIN: Starting CSV import of affiliates')
  
  // Parse CSV data properly
  const lines = csvData.trim().split(/\r?\n/)
  const headers = parseCSVLine(lines[0])
  
  console.log('📋 CSV Headers:', headers)
  console.log('📋 Headers count:', headers.length)
  
  // Expected headers: Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,Terms&Cond
  
  let imported = 0
  let errors = 0
  const errorDetails = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      if (!lines[i].trim()) {
        console.log(`⚠️ Skipping empty row ${i + 1}`)
        continue
      }
      
      const values = parseCSVLine(lines[i])
      
      console.log(`📋 Row ${i + 1} - Values count: ${values.length}, Email: ${values[4]}`)
      
      if (values.length < 5 || !values[4]?.includes('@')) {
        console.log(`⚠️ Skipping row ${i + 1}: Invalid data - insufficient columns or invalid email`)
        errors++
        errorDetails.push(`Row ${i + 1}: Invalid data (${values.length} columns, email: ${values[4]})`)
        continue
      }
      
      const affiliateData = {
        affiliateNum: null, // Not provided in this CSV format
        isActive: values[0]?.toLowerCase() === 'true' || values[0] === '1',
        name: values[1] || 'Unknown Business',
        firstName: values[2] || null,
        lastName: values[3] || null,
        email: values[4]?.toLowerCase(),
        workPhone: values[5] || null,
        whatsApp: values[6] || null,
        address: values[7] || null,
        web: values[8] || null,
        description: values[9] || null,
        city: values[10] || null,
        maps: values[11] || null,
        location: values[12] || null,
        discount: values[13] || null,
        logo: values[14] || null,
        facebook: values[15] || null,
        instagram: values[16] || null,
        category: values[17] || null,
        subCategory: values[18] || null,
        service: values[19] || null,
        type: values[20] || null,
        sticker: values[21] || null,
        rating: values[22] ? parseFloat(values[22]) : null,
        recommended: values[23]?.toLowerCase() === 'true' || values[23] === '1',
        termsConditions: values[24] || null // TyC field
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