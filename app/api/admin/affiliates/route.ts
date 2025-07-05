import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 API DEBUG: Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      isAdmin: session?.user?.role === 'ADMIN'
    })
    
    if (!session) {
      console.log('❌ API DEBUG: No session found')
      return NextResponse.json({ error: 'No session - Please login' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      console.log('❌ API DEBUG: Wrong role:', session.user.role, 'Expected: ADMIN')
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
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
  
  // Don't remove empty fields - they are part of the structure
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
      
      console.log(`📋 Row ${i + 1} - Values count: ${values.length}, Email: ${values[5]}`)
      
      // Only skip rows with insufficient columns - import everything else
      if (values.length < 6) {
        console.log(`⚠️ Skipping row ${i + 1}: Insufficient columns (${values.length} < 6)`)
        errors++
        errorDetails.push(`Row ${i + 1}: Insufficient columns (${values.length} < 6)`)
        continue
      }
      
      const affiliateData = {
        affiliateNum: values[0] || null, // First column (sometimes has sequence number)
        isActive: values[1]?.toLowerCase() === 'true' || values[1] === '1',
        name: values[2] || 'Unknown Business',
        firstName: values[3] || null,
        lastName: values[4] || null,
        email: values[5]?.trim()?.toLowerCase() || null,
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
        termsConditions: values[25] || null // TyC field
      }
      
      // Import all affiliates - mark duplicates with annotations instead of skipping
      let isDuplicate = false
      if (affiliateData.email) {
        const existing = await (prisma as any).affiliate.findUnique({
          where: { email: affiliateData.email }
        })
        
        if (existing) {
          console.log(`🔄 Affiliate ${affiliateData.email} already exists, importing as duplicate`)
          isDuplicate = true
        }
      }
      
      const newAffiliate = await (prisma as any).affiliate.create({
        data: affiliateData
      })
      
      // Create annotations for problematic data
      const annotations = []
      const email = values[5]?.trim()
      
      // Mark missing emails
      if (!email) {
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'email',
          color: 'yellow',
          comment: 'Missing email address - imported from CSV',
          createdBy: 'admin' // Will be replaced with actual admin ID
        })
      }
      // Mark invalid email format
      else if (!email.includes('@')) {
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'email',
          color: 'red',
          comment: `Invalid email format: ${email} - needs correction`,
          createdBy: 'admin'
        })
      }
      
      // Mark duplicates
      if (isDuplicate) {
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'name',
          color: 'orange',
          comment: 'Potential duplicate affiliate - review needed',
          createdBy: 'admin'
        })
      }
      
      // Get admin user for annotations
      if (annotations.length > 0) {
        try {
          const adminUser = await (prisma as any).user.findFirst({
            where: { role: 'ADMIN' }
          })
          
          if (adminUser) {
            // Update annotations with real admin ID
            annotations.forEach(annotation => {
              annotation.createdBy = adminUser.id
            })
            
            // Create all annotations
            await (prisma as any).affiliateFieldAnnotation.createMany({
              data: annotations,
              skipDuplicates: true
            })
            
            console.log(`📝 Created ${annotations.length} annotation(s) for ${affiliateData.name}`)
          }
        } catch (annotationError) {
          console.warn(`⚠️ Could not create annotations for ${affiliateData.name}:`, annotationError)
        }
      }
      
      imported++
      console.log(`✅ Imported: ${affiliateData.name} (${affiliateData.email || 'no email'})`)
      
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