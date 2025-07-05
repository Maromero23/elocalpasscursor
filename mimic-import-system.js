const fs = require('fs');

// Function to parse CSV exactly like most import systems do
function parseCSVLikeImportSystem(csvContent) {
  const lines = csvContent.split(/\r?\n/);
  const results = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    invalidRowDetails: []
  };
  
  if (lines.length === 0) return results;
  
  // Get header and expected column count
  const header = lines[0];
  const expectedColumns = header.split(',').length;
  
  console.log(`📝 Header: ${header}`);
  console.log(`🎯 Expected columns: ${expectedColumns}\n`);
  
  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    results.totalRows++;
    
    // Parse the line exactly like most CSV parsers
    const fields = line.split(',');
    const columnCount = fields.length;
    
    if (columnCount === expectedColumns) {
      results.validRows++;
    } else {
      results.invalidRows++;
      results.invalidRowDetails.push({
        rowNumber: i + 1,
        actualColumns: columnCount,
        expectedColumns: expectedColumns,
        content: line.substring(0, 150) + (line.length > 150 ? '...' : ''),
        fields: fields.slice(0, 5) // First 5 fields for debugging
      });
    }
  }
  
  return results;
}

// Function to check for hidden characters
function checkForHiddenCharacters(csvContent) {
  const hiddenChars = [];
  
  // Check for common hidden characters
  const patterns = [
    { name: 'Zero Width Space', char: '\u200B', regex: /\u200B/g },
    { name: 'Non-Breaking Space', char: '\u00A0', regex: /\u00A0/g },
    { name: 'Carriage Return', char: '\r', regex: /\r/g },
    { name: 'Tab', char: '\t', regex: /\t/g },
    { name: 'Vertical Tab', char: '\v', regex: /\v/g },
    { name: 'Form Feed', char: '\f', regex: /\f/g },
    { name: 'Null Character', char: '\0', regex: /\0/g }
  ];
  
  patterns.forEach(pattern => {
    const matches = csvContent.match(pattern.regex);
    if (matches) {
      hiddenChars.push({
        name: pattern.name,
        count: matches.length,
        char: pattern.char
      });
    }
  });
  
  return hiddenChars;
}

// Function to analyze encoding
function analyzeEncoding(csvContent) {
  const analysis = {
    hasBOM: csvContent.charCodeAt(0) === 0xFEFF,
    length: csvContent.length,
    byteLength: Buffer.byteLength(csvContent, 'utf8'),
    firstLine: csvContent.split('\n')[0],
    lastLine: csvContent.split('\n').slice(-2)[0] // Get last non-empty line
  };
  
  return analysis;
}

function mimicImportSystem(csvFile) {
  console.log('🔍 Mimicking Import System Analysis\n');
  console.log('=====================================\n');
  
  const csvContent = fs.readFileSync(csvFile, 'utf8');
  
  // Check encoding
  console.log('📊 ENCODING ANALYSIS:');
  console.log('====================');
  const encoding = analyzeEncoding(csvContent);
  console.log(`BOM detected: ${encoding.hasBOM ? 'YES' : 'NO'}`);
  console.log(`Content length: ${encoding.length} characters`);
  console.log(`Byte length: ${encoding.byteLength} bytes`);
  console.log(`First line: ${encoding.firstLine.substring(0, 100)}...`);
  console.log(`Last line: ${encoding.lastLine.substring(0, 100)}...`);
  console.log('');
  
  // Check for hidden characters
  console.log('🔍 HIDDEN CHARACTER ANALYSIS:');
  console.log('=============================');
  const hiddenChars = checkForHiddenCharacters(csvContent);
  if (hiddenChars.length === 0) {
    console.log('✅ No hidden characters found');
  } else {
    hiddenChars.forEach(char => {
      console.log(`❌ ${char.name}: ${char.count} instances`);
    });
  }
  console.log('');
  
  // Parse CSV like import system
  console.log('📋 CSV PARSING (Import System Style):');
  console.log('=====================================');
  const results = parseCSVLikeImportSystem(csvContent);
  
  console.log(`📊 Results:`);
  console.log(`   Total rows: ${results.totalRows}`);
  console.log(`   Valid rows: ${results.validRows}`);
  console.log(`   Invalid rows: ${results.invalidRows}`);
  console.log('');
  
  if (results.invalidRows > 0) {
    console.log('🚨 INVALID ROWS DETAILS:');
    console.log('========================');
    
    const columnCounts = {};
    results.invalidRowDetails.forEach(row => {
      if (!columnCounts[row.actualColumns]) {
        columnCounts[row.actualColumns] = 0;
      }
      columnCounts[row.actualColumns]++;
    });
    
    console.log('📊 Column count distribution:');
    Object.keys(columnCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(count => {
      console.log(`   ${count} columns: ${columnCounts[count]} rows`);
    });
    console.log('');
    
    console.log('🔍 First 10 invalid rows:');
    results.invalidRowDetails.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. Row ${row.rowNumber}:`);
      console.log(`   Columns: ${row.actualColumns} (expected ${row.expectedColumns})`);
      console.log(`   First 5 fields: ${JSON.stringify(row.fields)}`);
      console.log(`   Content: ${row.content}`);
      console.log('');
    });
  }
  
  return results;
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node mimic-import-system.js <csv-file>');
  process.exit(1);
}

const csvFile = args[0];

try {
  const result = mimicImportSystem(csvFile);
  
  if (result.invalidRows === 0) {
    console.log('🎉 All rows would be valid in the import system!');
  } else {
    console.log(`\n💡 CONCLUSION:`);
    console.log(`=============`);
    console.log(`The import system would find ${result.invalidRows} invalid rows.`);
    console.log(`This explains the discrepancy you're seeing.`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
} 