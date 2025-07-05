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

function createSimpleCSV(inputFile, outputFile) {
  console.log('🔧 Creating Simple CSV - No Complex Formatting\n');
  
  const csvData = fs.readFileSync(inputFile, 'utf8');
  const lines = csvData.split('\n');
  
  // Expected header exactly as the system wants it
  const simpleHeader = 'Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,TyC';
  
  const outputLines = [simpleHeader];
  
  let currentRecord = '';
  let recordCount = 0;
  
  // Process lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (currentRecord) {
      currentRecord += ' ' + line;
    } else {
      currentRecord = line;
    }
    
    // Simple comma counting (ignoring quotes completely)
    const commaCount = (currentRecord.match(/,/g) || []).length;
    
    if (commaCount >= 24 && commaCount <= 27) { // Allow some tolerance
      // Split by comma and take first 26 parts
      const rawParts = currentRecord.split(',');
      const parts = rawParts.slice(0, 26);
      
      // Pad if needed
      while (parts.length < 26) {
        parts.push('');
      }
      
      // Clean each field
      const cleanedParts = parts.map(cleanField);
      
      // Join with commas - no quotes, no escaping
      const simpleLine = cleanedParts.join(',');
      outputLines.push(simpleLine);
      
      recordCount++;
      currentRecord = '';
    }
  }
  
  // Handle any remaining record
  if (currentRecord) {
    const rawParts = currentRecord.split(',');
    const parts = rawParts.slice(0, 26);
    
    while (parts.length < 26) {
      parts.push('');
    }
    
    const cleanedParts = parts.map(cleanField);
    const simpleLine = cleanedParts.join(',');
    outputLines.push(simpleLine);
    recordCount++;
  }
  
  const result = outputLines.join('\n');
  fs.writeFileSync(outputFile, result, 'utf8');
  
  console.log(`📊 Simple CSV Results:`);
  console.log(`=====================`);
  console.log(`✅ Records created: ${recordCount}`);
  console.log(`💾 Output file: ${outputFile}`);
  console.log(`📋 Total lines: ${outputLines.length}`);
  
  return result;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node create-simple-csv.js <input-csv-file> [output-csv-file]');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.csv$/i, '_simple.csv');

try {
  createSimpleCSV(inputFile, outputFile);
  console.log(`\n✅ Simple CSV created: ${outputFile}`);
  console.log('This file removes all quotes and complex formatting.');
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
} 