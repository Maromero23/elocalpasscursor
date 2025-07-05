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

// Function to analyze CSV file
function analyzeCsvFile(csvData) {
  console.log('🔍 CSV Diagnostic Tool - Starting Analysis...\n');
  
  // Split into lines and filter out empty lines
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  
  console.log(`📋 Total lines found: ${lines.length}`);
  
  if (lines.length === 0) {
    console.log('❌ No data found in CSV file!');
    return;
  }
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log(`📝 Header columns (${header.length}): ${header.join(', ')}`);
  console.log('');
  
  // Track statistics
  const stats = {
    totalRows: lines.length - 1, // Exclude header
    validRows: 0,
    invalidRows: 0,
    emptyRows: 0,
    columnCounts: {},
    issues: []
  };
  
  // Analyze each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNumber = i + 1;
    
    // Skip empty lines
    if (line.trim() === '') {
      stats.emptyRows++;
      continue;
    }
    
    try {
      const fields = parseCSVLine(line);
      const columnCount = fields.length;
      
      // Track column count distribution
      if (!stats.columnCounts[columnCount]) {
        stats.columnCounts[columnCount] = 0;
      }
      stats.columnCounts[columnCount]++;
      
      // Check if column count matches header
      if (columnCount === header.length) {
        stats.validRows++;
      } else {
        stats.invalidRows++;
        stats.issues.push({
          row: rowNumber,
          issue: `Column count mismatch: Expected ${header.length}, got ${columnCount}`,
          preview: line.substring(0, 100) + (line.length > 100 ? '...' : '')
        });
      }
      
      // Check for specific issues
      if (fields.some(field => field.includes('\n') || field.includes('\r'))) {
        stats.issues.push({
          row: rowNumber,
          issue: 'Contains line breaks within fields',
          preview: line.substring(0, 100) + (line.length > 100 ? '...' : '')
        });
      }
      
      // Check for unmatched quotes
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        stats.issues.push({
          row: rowNumber,
          issue: 'Unmatched quotes detected',
          preview: line.substring(0, 100) + (line.length > 100 ? '...' : '')
        });
      }
      
    } catch (error) {
      stats.invalidRows++;
      stats.issues.push({
        row: rowNumber,
        issue: `Parse error: ${error.message}`,
        preview: line.substring(0, 100) + (line.length > 100 ? '...' : '')
      });
    }
  }
  
  // Display results
  console.log('📊 ANALYSIS RESULTS:');
  console.log('==================');
  console.log(`Total data rows: ${stats.totalRows}`);
  console.log(`✅ Valid rows: ${stats.validRows}`);
  console.log(`❌ Invalid rows: ${stats.invalidRows}`);
  console.log(`⚪ Empty rows: ${stats.emptyRows}`);
  console.log('');
  
  // Column count distribution
  console.log('📈 Column Count Distribution:');
  Object.entries(stats.columnCounts)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([count, frequency]) => {
      const isExpected = parseInt(count) === header.length;
      const icon = isExpected ? '✅' : '❌';
      console.log(`  ${icon} ${count} columns: ${frequency} rows`);
    });
  console.log('');
  
  // Show first 10 issues
  if (stats.issues.length > 0) {
    console.log('🚨 ISSUES FOUND:');
    console.log('================');
    stats.issues.slice(0, 10).forEach(issue => {
      console.log(`Row ${issue.row}: ${issue.issue}`);
      console.log(`  Preview: ${issue.preview}`);
      console.log('');
    });
    
    if (stats.issues.length > 10) {
      console.log(`... and ${stats.issues.length - 10} more issues`);
    }
  }
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  console.log('===================');
  
  if (stats.invalidRows > 0) {
    console.log('• Fix column count mismatches by checking for:');
    console.log('  - Unescaped commas in field values');
    console.log('  - Missing or extra commas');
    console.log('  - Unmatched quotes');
    console.log('  - Line breaks within fields');
  }
  
  if (stats.emptyRows > 0) {
    console.log('• Remove empty rows from the CSV file');
  }
  
  if (stats.validRows === stats.totalRows) {
    console.log('✅ All rows are valid! CSV format looks good.');
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node csv-diagnostic-tool-fixed.js <csv-file>');
    process.exit(1);
  }
  
  const csvFile = args[0];
  
  if (!fs.existsSync(csvFile)) {
    console.log(`Error: File "${csvFile}" not found!`);
    process.exit(1);
  }
  
  try {
    const csvData = fs.readFileSync(csvFile, 'utf8');
    analyzeCsvFile(csvData);
  } catch (error) {
    console.log(`Error reading file: ${error.message}`);
    process.exit(1);
  }
}

// Run the tool
main(); 