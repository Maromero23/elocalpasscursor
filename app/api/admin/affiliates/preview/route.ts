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
    
    // Parse CSV data and reconstruct records that may have embedded line breaks
    const reconstructedLines = reconstructCSVRecords(csvData)
    const headers = parseCSVLine(reconstructedLines[0])
    
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
    
    // First pass: Count all valid/invalid rows (ALL rows are valid now - no rejections)
    for (let i = 1; i < reconstructedLines.length; i++) {
      if (!reconstructedLines[i].trim()) continue
      
      const values = parseCSVLine(reconstructedLines[i])
      // ALL rows are now valid - we import everything with padding
      validRows++
    }
    
    // Second pass: Create preview rows for display (first 5 only)
    for (let i = 1; i < Math.min(reconstructedLines.length, 6); i++) {
      if (!reconstructedLines[i].trim()) continue
      
      const values = parseCSVLine(reconstructedLines[i])
      // ALL rows are now valid - we import everything with padding and annotations
      const isValid = true
      
      // Pad values to ensure we have enough columns for display
      while (values.length < 26) {
        values.push('')
      }
      
      // Determine what annotations will be added
      const willHaveAnnotations = []
      if (!values[2]?.trim()) willHaveAnnotations.push('Missing name (will be marked as red)')
      if (!values[3]?.trim()) willHaveAnnotations.push('Missing first name (will be marked as red)')
      if (!values[4]?.trim()) willHaveAnnotations.push('Missing last name (will be marked as red)')
      
      const email = values[5]?.trim()
      if (!email) {
        willHaveAnnotations.push('Missing email (placeholder email will be generated, marked as red)')
      } else if (!email.includes('@') || email.length > 100 || email.includes('\n') || email.includes(',')) {
        willHaveAnnotations.push('Corrupted email data (will be sanitized & marked as red)')
      }
      
      previewRows.push({
        rowNumber: i + 1,
        values: values,
        isValid: isValid,
        issues: willHaveAnnotations
      })
    }
    
    // Count total rows
    const totalDataRows = reconstructedLines.length - 1 // Exclude header
    
    return NextResponse.json({
      success: true,
      preview: {
        headers: headers,
        expectedHeaders: expectedHeaders,
        headerMatch: headers.length === expectedHeaders.length,
        totalRows: totalDataRows,
        previewRows: previewRows,
        estimatedValid: validRows,
        estimatedInvalid: 0 // No invalid rows - everything is imported
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