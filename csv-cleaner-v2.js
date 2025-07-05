const fs = require('fs');

// Function to properly parse CSV with quote handling
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
      fields.push(currentField);
      currentField = '';
      i++;
    } else {
      currentField += char;
      i++;
    }
  }
  
  // Add the last field
  fields.push(currentField);
  
  return fields;
}

// Function to properly escape and format a CSV field
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  
  let str = String(field);
  
  // Clean up line breaks and extra whitespace
  str = str.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // If field contains comma, quote, or starts/ends with whitespace, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str !== str.trim()) {
    // Escape existing quotes by doubling them
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  
  return str;
}

// Function to clean CSV data with strict column control
function cleanCSVDataV2(csvData) {
  console.log('🧹 CSV Cleaner V2 - Starting advanced cleanup...\n');
  
  const lines = csvData.split('\n');
  console.log(`📋 Total raw lines: ${lines.length}`);
  
  if (lines.length === 0) {
    console.log('❌ No data found in CSV file!');
    return '';
  }
  
  // Parse header
  const headerLine = lines[0].trim();
  const header = parseCSVLine(headerLine);
  const expectedColumns = header.length;
  
  console.log(`📝 Expected columns: ${expectedColumns}`);
  console.log(`📝 Header: ${header.join(', ')}`);
  
  const cleanedRows = [headerLine]; // Keep original header
  let currentRecord = '';
  let recordNumber = 0;
  let fixedRecords = 0;
  let skippedRecords = 0;
  
  // Process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') {
      continue;
    }
    
    // Accumulate lines until we have a complete record
    if (currentRecord !== '') {
      currentRecord += ' ' + line;
    } else {
      currentRecord = line;
    }
    
    try {
      const fields = parseCSVLine(currentRecord);
      
      if (fields.length === expectedColumns) {
        // Perfect match - clean and add
        recordNumber++;
        const cleanedFields = fields.map(field => {
          return String(field || '').replace(/[\r\n]+/g, ' ').trim();
        });
        
        // Ensure exactly the right number of columns
        while (cleanedFields.length < expectedColumns) {
          cleanedFields.push('');
        }
        
        // Truncate if too many (shouldn't happen but safety)
        if (cleanedFields.length > expectedColumns) {
          cleanedFields.splice(expectedColumns);
        }
        
        const cleanedLine = cleanedFields.map(escapeCSVField).join(',');
        cleanedRows.push(cleanedLine);
        
        if (currentRecord !== line) {
          fixedRecords++;
        }
        
        currentRecord = '';
        
      } else if (fields.length < expectedColumns) {
        // Not enough fields - continue accumulating
        continue;
        
      } else {
        // Too many fields - try to fix by merging excess fields
        console.log(`⚠️  Record ${recordNumber + 1}: ${fields.length} fields, merging excess...`);
        
        const fixedFields = fields.slice(0, expectedColumns - 1);
        // Merge all remaining fields into the last column
        const lastField = fields.slice(expectedColumns - 1).join(' ');
        fixedFields.push(lastField);
        
        recordNumber++;
        const cleanedFields = fixedFields.map(field => {
          return String(field || '').replace(/[\r\n]+/g, ' ').trim();
        });
        
        const cleanedLine = cleanedFields.map(escapeCSVField).join(',');
        cleanedRows.push(cleanedLine);
        
        fixedRecords++;
        currentRecord = '';
      }
      
    } catch (error) {
      console.log(`❌ Error parsing record: ${error.message}`);
      skippedRecords++;
      currentRecord = '';
    }
  }
  
  // Handle incomplete record at end
  if (currentRecord !== '') {
    try {
      const fields = parseCSVLine(currentRecord);
      if (fields.length >= expectedColumns - 3) { // Allow some tolerance
        recordNumber++;
        
        // Pad or truncate to exact column count
        while (fields.length < expectedColumns) {
          fields.push('');
        }
        if (fields.length > expectedColumns) {
          fields.splice(expectedColumns);
        }
        
        const cleanedFields = fields.map(field => {
          return String(field || '').replace(/[\r\n]+/g, ' ').trim();
        });
        
        const cleanedLine = cleanedFields.map(escapeCSVField).join(',');
        cleanedRows.push(cleanedLine);
        
        fixedRecords++;
      } else {
        console.log(`❌ Incomplete record at end with only ${fields.length} fields - skipping`);
        skippedRecords++;
      }
    } catch (error) {
      console.log(`❌ Error with final record: ${error.message}`);
      skippedRecords++;
    }
  }
  
  console.log(`\n📊 Advanced Cleanup Results:`);
  console.log(`============================`);
  console.log(`✅ Total records processed: ${recordNumber}`);
  console.log(`🔧 Records fixed: ${fixedRecords}`);
  console.log(`❌ Records skipped: ${skippedRecords}`);
  console.log(`📈 Success rate: ${((recordNumber / (lines.length - 1)) * 100).toFixed(1)}%`);
  
  return cleanedRows.join('\n');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node csv-cleaner-v2.js <input-csv-file> [output-csv-file]');
    console.log('');
    console.log('Examples:');
    console.log('  node csv-cleaner-v2.js data.csv                    # Creates data_v2_cleaned.csv');
    console.log('  node csv-cleaner-v2.js data.csv fixed_data.csv     # Creates fixed_data.csv');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.csv$/i, '_v2_cleaned.csv');
  
  if (!fs.existsSync(inputFile)) {
    console.log(`❌ Error: Input file "${inputFile}" not found!`);
    process.exit(1);
  }
  
  try {
    console.log(`📂 Reading: ${inputFile}`);
    const csvData = fs.readFileSync(inputFile, 'utf8');
    
    const cleanedData = cleanCSVDataV2(csvData);
    
    if (cleanedData) {
      console.log(`💾 Writing cleaned data to: ${outputFile}`);
      fs.writeFileSync(outputFile, cleanedData, 'utf8');
      console.log(`✅ Advanced cleanup complete! Fixed CSV saved to: ${outputFile}`);
      
      // Verify column counts
      const verifyLines = cleanedData.split('\n').filter(line => line.trim() !== '');
      const headerCols = (verifyLines[0].match(/,/g) || []).length + 1;
      console.log(`\n🔍 Verification:`);
      console.log(`   Header columns: ${headerCols}`);
      console.log(`   Total lines: ${verifyLines.length}`);
      console.log(`   Data rows: ${verifyLines.length - 1}`);
      
      // Check first few data rows
      for (let i = 1; i <= Math.min(3, verifyLines.length - 1); i++) {
        const dataCols = (verifyLines[i].match(/,/g) || []).length + 1;
        const status = dataCols === headerCols ? '✅' : '❌';
        console.log(`   Row ${i} columns: ${dataCols} ${status}`);
      }
      
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