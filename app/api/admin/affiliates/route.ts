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
    const sortField = searchParams.get('sortField') || ''
    const sortDirection = searchParams.get('sortDirection') || 'asc'
    
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

    console.log(`📊 ADMIN: Fetching affiliates (page ${page}, limit ${limit}, sort: ${sortField} ${sortDirection})`)

    // Build orderBy clause
    let orderBy: any[] = []
    
    if (sortField && sortField !== '') {
      // Standard field sorting
      orderBy = [{ [sortField]: sortDirection as any }]
    } else {
      // Default sorting when no sort is specified
      orderBy = [
        { isActive: 'desc' }, // Active first
        { totalVisits: 'desc' }, // Most visits first
        { name: 'asc' }
      ]
    }

    // Get affiliates with pagination
    const affiliates = await (prisma as any).affiliate.findMany({
      where: whereClause,
      orderBy: orderBy,
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

// Reconstruct CSV records that may have embedded line breaks in quoted fields
function reconstructCSVRecords(csvData: string): string[] {
  const lines = csvData.trim().split(/\r?\n/)
  const reconstructedLines = []
  let currentRecord = ''
  let inQuotedField = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (currentRecord === '') {
      // Start of a new record
      currentRecord = line
      inQuotedField = isLineInQuotedField(line)
    } else {
      // Continuation of previous record (replace line break with space)
      currentRecord += ' ' + line
      inQuotedField = isLineInQuotedField(currentRecord)
    }
    
    // If we're not in a quoted field and this looks like a complete record, save it
    if (!inQuotedField && isCompleteAffiliateRecord(currentRecord)) {
      reconstructedLines.push(currentRecord)
      currentRecord = ''
    }
  }
  
  // Add any remaining record
  if (currentRecord !== '') {
    reconstructedLines.push(currentRecord)
  }
  
  return reconstructedLines
}

// Check if a line leaves us in a quoted field
function isLineInQuotedField(line: string): boolean {
  let inQuote = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      // Check if this is an escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        i += 2 // Skip escaped quote
        continue
      }
      inQuote = !inQuote
    }
    i++
  }
  
  return inQuote
}

// Check if a line represents a complete affiliate record
function isCompleteAffiliateRecord(line: string): boolean {
  // Skip header row
  if (line.includes('Afiliate number') || line.includes('Active')) {
    return true
  }
  
  // Skip obvious fragments that start with quotes or special characters
  if (line.startsWith('",') || line.startsWith('#')) {
    return false
  }
  
  // A complete record should have at least 15 fields
  const fields = line.split(',')
  return fields.length >= 15
}

async function handleCSVImport(csvData: string) {
  console.log('📊 ADMIN: Starting CSV import of affiliates')
  
  // First, properly reconstruct CSV records that may have embedded line breaks
  const reconstructedLines = reconstructCSVRecords(csvData)
  const headers = parseCSVLine(reconstructedLines[0])
  
  console.log('📋 CSV Headers:', headers)
  console.log('📋 Headers count:', headers.length)
  console.log('📋 Original lines vs reconstructed:', csvData.split(/\r?\n/).length, 'vs', reconstructedLines.length)
  
  // Expected headers: Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,Terms&Cond
  
  let imported = 0
  let errors = 0
  const errorDetails = []
  
  for (let i = 1; i < reconstructedLines.length; i++) {
    try {
      if (!reconstructedLines[i].trim()) {
        console.log(`⚠️ Skipping empty row ${i + 1}`)
        continue
      }
      
      const values = parseCSVLine(reconstructedLines[i])
      
      console.log(`📋 Row ${i + 1} - Values count: ${values.length}, Email: ${values[5]}`)
      
      // Import ALL rows regardless of column count - pad with nulls if needed
      while (values.length < 26) {
        values.push('') // Pad missing columns with empty strings
      }
      console.log(`📋 Row ${i + 1} padded to ${values.length} columns for import`)
      
      // Generate unique placeholder email if missing or invalid (to avoid unique constraint violation)
      let processedEmail = values[5]?.trim()?.toLowerCase() || null
      
      // Sanitize email field - if it's clearly not an email, treat as missing
      if (processedEmail && (!processedEmail.includes('@') || processedEmail.length > 100 || processedEmail.includes('\n') || processedEmail.includes(','))) {
        console.log(`⚠️ Row ${i + 1}: Invalid email detected: "${processedEmail.substring(0, 50)}..." - treating as missing`)
        processedEmail = null
      }
      
      if (!processedEmail) {
        processedEmail = `missing-email-row-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@placeholder.local`
      }
      
      // Helper function to safely truncate and clean text fields
      const cleanTextField = (value: any, maxLength = 500): string | null => {
        if (!value) return null
        let cleaned = value.toString().trim()
        if (cleaned.length > maxLength) {
          console.log(`⚠️ Row ${i + 1}: Truncating field from ${cleaned.length} to ${maxLength} characters`)
          cleaned = cleaned.substring(0, maxLength) + '...'
        }
        return cleaned || null
      }

      const affiliateData = {
        affiliateNum: cleanTextField(values[0], 50),
        isActive: values[1]?.toLowerCase() === 'true' || values[1] === '1',
        name: cleanTextField(values[2], 200) || `Unnamed-${i}`, // Ensure every affiliate has a name
        firstName: cleanTextField(values[3], 100),
        lastName: cleanTextField(values[4], 100),
        email: processedEmail, // Already sanitized above
        workPhone: cleanTextField(values[6], 20),
        whatsApp: cleanTextField(values[7], 20),
        address: cleanTextField(values[8], 300),
        web: cleanTextField(values[9], 500),
        description: cleanTextField(values[10], 1000), // Allow longer descriptions
        city: cleanTextField(values[11], 100),
        maps: cleanTextField(values[12], 1000), // Google Maps URLs can be long
        location: cleanTextField(values[13], 200),
        discount: cleanTextField(values[14], 100),
        logo: cleanTextField(values[15], 1000), // URLs can be long
        facebook: cleanTextField(values[16], 500),
        instagram: cleanTextField(values[17], 500),
        category: cleanTextField(values[18], 100),
        subCategory: cleanTextField(values[19], 100),
        service: cleanTextField(values[20], 200),
        type: cleanTextField(values[21], 100),
        sticker: cleanTextField(values[22], 100),
        rating: values[23] && values[23].toString().trim() && !isNaN(parseFloat(values[23])) ? Math.max(0, Math.min(5, parseFloat(values[23]))) : null,
        recommended: values[24]?.toLowerCase() === 'true' || values[24] === '1',
        termsConditions: cleanTextField(values[25], 500)
      }
      
      // Import all affiliates - mark duplicates with annotations instead of skipping
      let isDuplicate = false
      if (affiliateData.email && !affiliateData.email.includes('@placeholder.local')) {
        try {
          const existing = await (prisma as any).affiliate.findUnique({
            where: { email: affiliateData.email }
          })
          
          if (existing) {
            console.log(`🔄 Affiliate ${affiliateData.email} already exists, importing as duplicate`)
            isDuplicate = true
          }
        } catch (duplicateError) {
          console.warn(`⚠️ Could not check for duplicate email ${affiliateData.email}:`, duplicateError)
          // Continue with import anyway
        }
      }
      
      let newAffiliate
      try {
        newAffiliate = await (prisma as any).affiliate.create({
          data: affiliateData
        })
        console.log(`✅ Created affiliate: ${affiliateData.name} (Row ${i + 1})`)
      } catch (dbError) {
        console.error(`❌ Database error for row ${i + 1} (${affiliateData.name}):`, dbError)
        // Try with even more sanitized data
        const fallbackData = {
          ...affiliateData,
          name: `Affiliate-Row-${i}`, // Ultra-safe fallback name
          email: `error-row-${i}-${Date.now()}@placeholder.local`, // New unique email
          description: affiliateData.description ? affiliateData.description.substring(0, 200) + '...' : null,
          address: affiliateData.address ? affiliateData.address.substring(0, 100) + '...' : null,
          web: affiliateData.web && affiliateData.web.length > 200 ? affiliateData.web.substring(0, 200) + '...' : affiliateData.web,
          maps: affiliateData.maps && affiliateData.maps.length > 200 ? affiliateData.maps.substring(0, 200) + '...' : affiliateData.maps,
          logo: affiliateData.logo && affiliateData.logo.length > 200 ? affiliateData.logo.substring(0, 200) + '...' : affiliateData.logo
        }
        
        try {
          newAffiliate = await (prisma as any).affiliate.create({
            data: fallbackData
          })
          console.log(`✅ Created affiliate with fallback data: ${fallbackData.name} (Row ${i + 1})`)
        } catch (fallbackError) {
          console.error(`❌ Even fallback failed for row ${i + 1}:`, fallbackError)
          errors++
          errorDetails.push(`Row ${i + 1}: Database error - ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
          continue // Skip this row entirely
        }
      }
      
      // Create annotations for problematic data
      const annotations = []
      
      // Mark missing critical fields as RED (as requested by user)
      if (!values[2]?.trim()) { // Missing name
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'name',
          color: 'red',
          comment: 'Missing business name - imported from CSV',
          createdBy: 'admin'
        })
      }
      
      if (!values[3]?.trim()) { // Missing firstName
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'firstName',
          color: 'red',
          comment: 'Missing first name - imported from CSV',
          createdBy: 'admin'
        })
      }
      
      if (!values[4]?.trim()) { // Missing lastName
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'lastName',
          color: 'red',
          comment: 'Missing last name - imported from CSV',
          createdBy: 'admin'
        })
      }
      
      const originalEmail = values[5]?.trim()
      if (!originalEmail) { // Missing email - we created a placeholder
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'email',
          color: 'red',
          comment: 'Missing email address - imported from CSV',
          createdBy: 'admin'
        })
      }
      // Mark invalid email format (but not placeholder emails)
      else if (!originalEmail.includes('@') || originalEmail.length > 100 || originalEmail.includes('\n') || originalEmail.includes(',')) {
        annotations.push({
          affiliateId: newAffiliate.id,
          fieldName: 'email',
          color: 'red',
          comment: `Invalid/corrupted email data: ${originalEmail.substring(0, 50)}${originalEmail.length > 50 ? '...' : ''} - needs correction`,
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