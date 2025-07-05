const fs = require('fs');

// The exact header format expected by the import system
const EXPECTED_HEADER = 'Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,TyC';

function fixCSV(inputFile, outputFile) {
  console.log('🔧 Final CSV Fix - Targeted Solution\n');
  
  const csvData = fs.readFileSync(inputFile, 'utf8');
  const lines = csvData.split('\n');
  
  console.log(`📋 Input: ${lines.length} lines`);
  
  // Replace the header with the expected format
  lines[0] = EXPECTED_HEADER;
  console.log(`✅ Header corrected to: ${EXPECTED_HEADER.substring(0, 50)}...`);
  
  const outputLines = [lines[0]]; // Start with corrected header
  let currentRecord = '';
  let processedRecords = 0;
  let fixedRecords = 0;
  
  // Process data lines - simple approach
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') continue;
    
    // Add to current record
    if (currentRecord) {
      currentRecord += ' ' + line;
    } else {
      currentRecord = line;
    }
    
    // Count commas to see if we have a complete record
    let commaCount = 0;
    let inQuotes = false;
    
    for (const char of currentRecord) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        commaCount++;
      }
    }
    
    // We expect 25 commas for 26 columns
    if (commaCount === 25) {
      // Complete record - clean it up
      let cleanRecord = currentRecord;
      
      // Remove line breaks within the record
      cleanRecord = cleanRecord.replace(/\r?\n/g, ' ');
      
      // Clean up multiple spaces
      cleanRecord = cleanRecord.replace(/\s+/g, ' ');
      
      outputLines.push(cleanRecord);
      processedRecords++;
      
      if (currentRecord !== line) {
        fixedRecords++;
      }
      
      currentRecord = '';
    }
    // If commaCount < 25, continue accumulating
    // If commaCount > 25, we'll still take it (might be quotes issue)
    else if (commaCount > 25) {
      console.log(`⚠️  Record ${processedRecords + 1}: ${commaCount + 1} columns, keeping as-is`);
      
      let cleanRecord = currentRecord;
      cleanRecord = cleanRecord.replace(/\r?\n/g, ' ');
      cleanRecord = cleanRecord.replace(/\s+/g, ' ');
      
      outputLines.push(cleanRecord);
      processedRecords++;
      fixedRecords++;
      currentRecord = '';
    }
  }
  
  // Handle any remaining record
  if (currentRecord.trim()) {
    let cleanRecord = currentRecord.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
    outputLines.push(cleanRecord);
    processedRecords++;
    fixedRecords++;
  }
  
  const result = outputLines.join('\n');
  fs.writeFileSync(outputFile, result, 'utf8');
  
  console.log(`\n📊 Final Fix Results:`);
  console.log(`====================`);
  console.log(`✅ Records processed: ${processedRecords}`);
  console.log(`🔧 Records fixed: ${fixedRecords}`);
  console.log(`💾 Output file: ${outputFile}`);
  
  // Quick verification
  const verifyLines = result.split('\n').filter(line => line.trim());
  console.log(`📋 Final file: ${verifyLines.length} lines (${verifyLines.length - 1} data rows)`);
  
  return result;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node csv-final-fix.js <input-csv-file> [output-csv-file]');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.csv$/i, '_final_fixed.csv');

try {
  fixCSV(inputFile, outputFile);
  console.log(`\n✅ Done! Use the file: ${outputFile}`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
} 