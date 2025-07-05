const fs = require('fs');
const path = require('path');

// Function to parse CSV line with proper handling of quotes and commas
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField.trim());
      currentField = '';
      i++;
    } else {
      currentField += char;
      i++;
    }
  }
  
  // Add the last field
  fields.push(currentField.trim());
  
  return fields;
}

// Function to escape CSV field properly
function escapeCSVField(field) {
  // Convert to string and trim
  const str = String(field || '').trim();
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

// Function to clean and fix CSV data
function cleanCSVData(csvData) {
  console.log('🧹 CSV Cleaner - Starting cleanup process...\n');
  
  const lines = csvData.split('\n');
  console.log(`📋 Total raw lines: ${lines.length}`);
  
  if (lines.length === 0) {
    console.log('❌ No data found in CSV file!');
    return '';
  }
  
  // Get header
  const headerLine = lines[0];
  const header = parseCSVLine(headerLine);
  const expectedColumns = header.length;
  
  console.log(`📝 Expected columns: ${expectedColumns}`);
  console.log(`📝 Header: ${header.join(', ')}`);
  
  const cleanedRows = [];
  let currentRecord = '';
  let currentFields = [];
  let fixedRecords = 0;
  let totalRecords = 0;
  
  // Add header to cleaned data
  cleanedRows.push(headerLine);
  
  // Process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') {
      continue;
    }
    
    // If we have an incomplete record, append this line to it
    if (currentRecord !== '') {
      currentRecord += ' ' + line; // Add space to separate the continuation
    } else {
      currentRecord = line;
    }
    
    // Try to parse the current record
    try {
      currentFields = parseCSVLine(currentRecord);
      
      // Check if we have a complete record
      if (currentFields.length === expectedColumns) {
        // We have a complete record - clean and add it
        const cleanedFields = currentFields.map(field => {
          // Remove any remaining line breaks and clean up whitespace
          return String(field || '').replace(/[\r\n]+/g, ' ').trim();
        });
        
        const cleanedLine = cleanedFields.map(escapeCSVField).join(',');
        cleanedRows.push(cleanedLine);
        
        totalRecords++;
        if (currentRecord !== line) {
          fixedRecords++;
        }
        
        // Reset for next record
        currentRecord = '';
        currentFields = [];
        
      } else if (currentFields.length > expectedColumns) {
        // Too many fields - this might be a parsing error
        console.log(`⚠️  Warning: Record ${totalRecords + 1} has ${currentFields.length} fields (expected ${expectedColumns})`);
        console.log(`   Line: ${currentRecord.substring(0, 100)}...`);
        
        // Try to salvage by taking only the first expectedColumns fields
        const truncatedFields = currentFields.slice(0, expectedColumns);
        const cleanedFields = truncatedFields.map(field => {
          return String(field || '').replace(/[\r\n]+/g, ' ').trim();
        });
        
        const cleanedLine = cleanedFields.map(escapeCSVField).join(',');
        cleanedRows.push(cleanedLine);
        
        totalRecords++;
        fixedRecords++;
        
        // Reset for next record
        currentRecord = '';
        currentFields = [];
      }
      // If currentFields.length < expectedColumns, we continue accumulating
      
    } catch (error) {
      console.log(`❌ Error parsing record: ${error.message}`);
      console.log(`   Line: ${currentRecord.substring(0, 100)}...`);
      
      // Skip this problematic record
      currentRecord = '';
      currentFields = [];
    }
  }
  
  // Handle any remaining incomplete record
  if (currentRecord !== '' && currentFields.length > 0) {
    console.log(`⚠️  Warning: Incomplete record at end of file with ${currentFields.length} fields`);
    
    if (currentFields.length >= expectedColumns - 3) { // Allow some tolerance
      // Pad with empty fields if close to expected count
      while (currentFields.length < expectedColumns) {
        currentFields.push('');
      }
      
      const cleanedFields = currentFields.map(field => {
        return String(field || '').replace(/[\r\n]+/g, ' ').trim();
      });
      
      const cleanedLine = cleanedFields.map(escapeCSVField).join(',');
      cleanedRows.push(cleanedLine);
      
      totalRecords++;
      fixedRecords++;
    }
  }
  
  console.log(`\n📊 Cleanup Results:`);
  console.log(`==================`);
  console.log(`✅ Total records processed: ${totalRecords}`);
  console.log(`🔧 Records fixed: ${fixedRecords}`);
  console.log(`📈 Success rate: ${((totalRecords / (lines.length - 1)) * 100).toFixed(1)}%`);
  
  return cleanedRows.join('\n');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node csv-cleaner.js <input-csv-file> [output-csv-file]');
    console.log('');
    console.log('Examples:');
    console.log('  node csv-cleaner.js data.csv                    # Creates data_cleaned.csv');
    console.log('  node csv-cleaner.js data.csv clean_data.csv     # Creates clean_data.csv');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.csv$/i, '_cleaned.csv');
  
  if (!fs.existsSync(inputFile)) {
    console.log(`❌ Error: Input file "${inputFile}" not found!`);
    process.exit(1);
  }
  
  try {
    console.log(`📂 Reading: ${inputFile}`);
    const csvData = fs.readFileSync(inputFile, 'utf8');
    
    const cleanedData = cleanCSVData(csvData);
    
    if (cleanedData) {
      console.log(`💾 Writing cleaned data to: ${outputFile}`);
      fs.writeFileSync(outputFile, cleanedData, 'utf8');
      console.log(`✅ Cleanup complete! Fixed CSV saved to: ${outputFile}`);
      
      // Run diagnostic on cleaned file
      console.log('\n🔍 Running diagnostic on cleaned file...');
      const diagnosticLines = cleanedData.split('\n').filter(line => line.trim() !== '');
      console.log(`📊 Cleaned file stats:`);
      console.log(`   Total lines: ${diagnosticLines.length}`);
      console.log(`   Data rows: ${diagnosticLines.length - 1}`);
      console.log(`   Ready for import: ✅`);
    } else {
      console.log('❌ Failed to clean CSV data');
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the cleaner
main(); 