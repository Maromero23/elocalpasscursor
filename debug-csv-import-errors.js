const fs = require('fs');
const path = require('path');

// Proper CSV parser that handles quoted fields and commas within quotes
function parseCSVLine(line) {
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
  
  return result
}

// Function to simulate the import process and capture errors
function debugCSVImport(csvData) {
  console.log('🔍 DEBUG: Starting CSV import simulation...')
  
  // Parse CSV data
  const lines = csvData.trim().split(/\r?\n/)
  const headers = parseCSVLine(lines[0])
  
  console.log('📋 CSV Headers:', headers)
  console.log('📋 Headers count:', headers.length)
  
  let successCount = 0
  let errorCount = 0
  const errorDetails = []
  const problematicRows = []
  
  for (let i = 1; i < lines.length; i++) {
    try {
      if (!lines[i].trim()) {
        console.log(`⚠️ Row ${i + 1}: Empty row, skipping`)
        continue
      }
      
      const values = parseCSVLine(lines[i])
      
      // Pad missing columns
      while (values.length < 26) {
        values.push('')
      }
      
      // Generate unique placeholder email if missing
      let processedEmail = values[5]?.trim()?.toLowerCase() || null
      if (!processedEmail) {
        processedEmail = `missing-email-row-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@placeholder.local`
      }
      
      const affiliateData = {
        affiliateNum: values[0] || null,
        isActive: values[1]?.toLowerCase() === 'true' || values[1] === '1',
        name: values[2]?.trim() || `Unnamed-${i}`,
        firstName: values[3]?.trim() || null,
        lastName: values[4]?.trim() || null,
        email: processedEmail,
        workPhone: values[6]?.trim() || null,
        whatsApp: values[7]?.trim() || null,
        address: values[8]?.trim() || null,
        web: values[9]?.trim() || null,
        description: values[10]?.trim() || null,
        city: values[11]?.trim() || null,
        maps: values[12]?.trim() || null,
        location: values[13]?.trim() || null,
        discount: values[14]?.trim() || null,
        logo: values[15]?.trim() || null,
        facebook: values[16]?.trim() || null,
        instagram: values[17]?.trim() || null,
        category: values[18]?.trim() || null,
        subCategory: values[19]?.trim() || null,
        service: values[20]?.trim() || null,
        type: values[21]?.trim() || null,
        sticker: values[22]?.trim() || null,
        rating: values[23] && values[23].trim() ? parseFloat(values[23]) : null,
        recommended: values[24]?.toLowerCase() === 'true' || values[24] === '1',
        termsConditions: values[25]?.trim() || null
      }
      
      // Check for potential issues
      const issues = []
      
      // Check for extremely long values that might cause database issues
      Object.keys(affiliateData).forEach(key => {
        const value = affiliateData[key]
        if (typeof value === 'string' && value.length > 1000) {
          issues.push(`${key}: ${value.length} characters (very long)`)
        }
      })
      
      // Check for special characters that might cause issues
      if (affiliateData.email && !affiliateData.email.includes('@')) {
        issues.push('Invalid email format')
      }
      
      // Check for problematic rating values
      if (affiliateData.rating && (isNaN(affiliateData.rating) || affiliateData.rating < 0 || affiliateData.rating > 5)) {
        issues.push(`Invalid rating: ${values[23]}`)
      }
      
      // Check for very long individual fields
      const longFields = []
      if (affiliateData.description && affiliateData.description.length > 500) {
        longFields.push(`description: ${affiliateData.description.length} chars`)
      }
      if (affiliateData.address && affiliateData.address.length > 300) {
        longFields.push(`address: ${affiliateData.address.length} chars`)
      }
      if (affiliateData.maps && affiliateData.maps.length > 500) {
        longFields.push(`maps: ${affiliateData.maps.length} chars`)
      }
      if (affiliateData.web && affiliateData.web.length > 500) {
        longFields.push(`web: ${affiliateData.web.length} chars`)
      }
      if (affiliateData.logo && affiliateData.logo.length > 500) {
        longFields.push(`logo: ${affiliateData.logo.length} chars`)
      }
      
      if (longFields.length > 0) {
        issues.push(`Long fields: ${longFields.join(', ')}`)
      }
      
      if (issues.length > 0) {
        problematicRows.push({
          rowNumber: i + 1,
          originalLine: lines[i],
          values: values,
          issues: issues,
          affiliateData: affiliateData
        })
        errorCount++
        console.log(`⚠️ Row ${i + 1} has issues: ${issues.join('; ')}`)
      } else {
        successCount++
        console.log(`✅ Row ${i + 1}: No issues detected`)
      }
      
    } catch (error) {
      errorCount++
      errorDetails.push({
        rowNumber: i + 1,
        originalLine: lines[i],
        error: error.message,
        stack: error.stack
      })
      console.error(`❌ Row ${i + 1} error:`, error.message)
    }
  }
  
  console.log('\n📊 SUMMARY:')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📋 Total processed: ${lines.length - 1}`)
  
  if (problematicRows.length > 0) {
    console.log('\n🔍 TOP 10 PROBLEMATIC ROWS:')
    problematicRows.slice(0, 10).forEach((row, index) => {
      console.log(`\n${index + 1}. Row ${row.rowNumber}:`)
      console.log(`   Issues: ${row.issues.join('; ')}`)
      console.log(`   Name: ${row.affiliateData.name}`)
      console.log(`   Email: ${row.affiliateData.email}`)
      console.log(`   Original CSV line: ${row.originalLine.substring(0, 100)}...`)
    })
  }
  
  if (errorDetails.length > 0) {
    console.log('\n💥 ACTUAL ERRORS:')
    errorDetails.slice(0, 5).forEach((error, index) => {
      console.log(`\n${index + 1}. Row ${error.rowNumber}:`)
      console.log(`   Error: ${error.error}`)
      console.log(`   Line: ${error.originalLine.substring(0, 100)}...`)
    })
  }
  
  return {
    success: successCount,
    errors: errorCount,
    problematicRows: problematicRows,
    errorDetails: errorDetails
  }
}

// Main execution
async function main() {
  try {
    // Read the CSV file
    const csvPath = path.join(__dirname, 'ELPCVSdatafile - Sheet1(4).csv')
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`)
      console.log('📋 Available CSV files:')
      const csvFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.csv'))
      csvFiles.forEach(file => console.log(`   - ${file}`))
      return
    }
    
    const csvData = fs.readFileSync(csvPath, 'utf8')
    console.log(`📊 Loaded CSV file: ${csvPath}`)
    console.log(`📋 File size: ${csvData.length} characters`)
    
    // Run the debug analysis
    const result = debugCSVImport(csvData)
    
    console.log('\n🎯 ANALYSIS COMPLETE!')
    console.log('This diagnostic shows what might be causing import failures.')
    console.log('Check the issues above to understand what needs to be fixed.')
    
  } catch (error) {
    console.error('❌ Error running diagnostic:', error)
  }
}

main() 