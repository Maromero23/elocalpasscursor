import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { csvData } = await request.json()
    
    if (!csvData) {
      return NextResponse.json({ error: 'CSV data required' }, { status: 400 })
    }

    console.log('📊 ADMIN: Previewing CSV data')
    
    // Parse CSV data
    const lines = csvData.trim().split(/\r?\n/)
    const headers = parseCSVLine(lines[0])
    
    // Expected headers for reference (matching user's actual CSV format with empty columns)
    const expectedHeaders = [
      '', 'Active', 'Name', 'FirstName', 'LastName', 'Email', 
      'WorkPhone', 'WhatsApp', 'Address', 'Web', 'Descripcion', 'City', 
      'Maps', 'Location', 'Discount', 'Logo', 'Facebook', 'Instagram', 
      'Category', 'Sub-Categoria', 'Service', 'Type', 'Sticker', 
      'Rating', 'Recommended', 'TyC', 'DaysAllowed', ''
    ]
    
    // Count all rows and preview first 5 data rows for display
    const previewRows = []
    let validRows = 0
    let invalidRows = 0
    
    // First pass: Count all valid/invalid rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      const values = parseCSVLine(lines[i])
      const isValid = values.length >= 6 && values[5]?.includes('@')
      
      if (isValid) validRows++
      else invalidRows++
    }
    
    // Second pass: Create preview rows for display (first 5 only)
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      if (!lines[i].trim()) continue
      
      const values = parseCSVLine(lines[i])
      const isValid = values.length >= 6 && values[5]?.includes('@')
      
      previewRows.push({
        rowNumber: i + 1,
        values: values,
        isValid: isValid,
        issues: !isValid ? [
          values.length < 6 ? `Only ${values.length} columns (expected ${expectedHeaders.length})` : null,
          !values[5]?.includes('@') ? 'Invalid email format' : null
        ].filter(Boolean) : []
      })
    }
    
    // Count total rows
    const totalDataRows = lines.length - 1 // Exclude header
    
    return NextResponse.json({
      success: true,
      preview: {
        headers: headers,
        expectedHeaders: expectedHeaders,
        headerMatch: headers.length === expectedHeaders.length,
        totalRows: totalDataRows,
        previewRows: previewRows,
        estimatedValid: validRows,
        estimatedInvalid: invalidRows
      }
    })

  } catch (error) {
    console.error('❌ ADMIN: Error previewing CSV:', error)
    return NextResponse.json(
      { error: 'Failed to preview CSV data' },
      { status: 500 }
    )
  }
} 