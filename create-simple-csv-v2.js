const fs = require('fs');

// Simple function to clean a field for basic CSV
function cleanField(field) {
  if (!field) return '';
  
  let cleaned = String(field).trim();
  
  // Remove any line breaks
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove quotes entirely to avoid escaping issues
  cleaned = cleaned.replace(/"/g, '');
  
  // Replace commas with semicolons to avoid column issues
  cleaned = cleaned.replace(/,/g, ';');
  
  return cleaned;
}

function createSimpleCSVV2(inputFile, outputFile) {
  console.log('🔧 Creating Simple CSV V2 - Capturing All Records\n');
  
  const csvData = fs.readFileSync(inputFile, 'utf8');
  const lines = csvData.split('\n');
  
  // Expected header exactly as the system wants it
  const simpleHeader = 'Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,TyC';
  
  const outputLines = [simpleHeader];
  
  let currentRecord = '';
  let recordCount = 0;
  let inRecord = false;
  
  // Process lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (currentRecord) {
      currentRecord += ' ' + line;
    } else {
      currentRecord = line;
    }
    
    // Check if this looks like the start of a new record (starts with a number)
    const startsWithNumber = /^\d+,/.test(currentRecord);
    
    if (startsWithNumber) {
      inRecord = true;
    }
    
    if (inRecord) {
      // Look for signs this record is complete
      // Count sections that look like completed data
      const parts = currentRecord.split(',');
      
      // If we have enough parts and the last few look like the end pattern
      if (parts.length >= 20) {
        // Check if we have what looks like the end: ...,Services,Yes,1,FALSE,NO
        const lastParts = parts.slice(-6);
        const hasServicePattern = lastParts.some(part => 
          part.includes('Service') || part.includes('Store') || part.includes('Restaurant')
        );
        const hasYesNo = lastParts.some(part => 
          part === 'Yes' || part === 'No' || part === 'YES' || part === 'NO'
        );
        const hasTrueFalse = lastParts.some(part => 
          part === 'TRUE' || part === 'FALSE'
        );
        
        if (hasServicePattern && (hasYesNo || hasTrueFalse)) {
          // This looks like a complete record
          const cleanedParts = parts.slice(0, 26).map(cleanField);
          
          // Pad if needed
          while (cleanedParts.length < 26) {
            cleanedParts.push('');
          }
          
          const simpleLine = cleanedParts.join(',');
          outputLines.push(simpleLine);
          
          recordCount++;
          currentRecord = '';
          inRecord = false;
          
          console.log(`✅ Processed record ${recordCount}`);
        }
      }
    }
  }
  
  // Handle any remaining record
  if (currentRecord && inRecord) {
    const parts = currentRecord.split(',');
    const cleanedParts = parts.slice(0, 26).map(cleanField);
    
    while (cleanedParts.length < 26) {
      cleanedParts.push('');
    }
    
    const simpleLine = cleanedParts.join(',');
    outputLines.push(simpleLine);
    recordCount++;
    console.log(`✅ Processed final record ${recordCount}`);
  }
  
  const result = outputLines.join('\n');
  fs.writeFileSync(outputFile, result, 'utf8');
  
  console.log(`\n📊 Simple CSV V2 Results:`);
  console.log(`=========================`);
  console.log(`✅ Records created: ${recordCount}`);
  console.log(`💾 Output file: ${outputFile}`);
  console.log(`📋 Total lines: ${outputLines.length}`);
  
  return result;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node create-simple-csv-v2.js <input-csv-file> [output-csv-file]');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.csv$/i, '_simple_v2.csv');

try {
  createSimpleCSVV2(inputFile, outputFile);
  console.log(`\n✅ Simple CSV V2 created: ${outputFile}`);
  console.log('This file removes all quotes and uses simple comma separation.');
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
} 