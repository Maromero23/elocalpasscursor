const fs = require('fs');

// Function to count columns in a row (simple comma count)
function countColumns(row) {
  return (row.match(/,/g) || []).length + 1;
}

// Function to analyze a row for issues
function analyzeRow(row, rowNumber, expectedColumns = 26) {
  const issues = [];
  const columnCount = countColumns(row);
  
  if (columnCount !== expectedColumns) {
    issues.push(`Column count: ${columnCount} (expected ${expectedColumns})`);
  }
  
  // Check for empty row
  if (!row.trim()) {
    issues.push('Empty row');
  }
  
  // Check for unusual characters
  if (row.includes('"')) {
    issues.push('Contains quotes');
  }
  
  if (row.includes('\n') || row.includes('\r')) {
    issues.push('Contains line breaks');
  }
  
  // Check if row starts with a number (should be affiliate ID)
  if (!/^\d+,/.test(row.trim())) {
    issues.push('Does not start with affiliate number');
  }
  
  return {
    rowNumber,
    columnCount,
    issues,
    preview: row.substring(0, 100) + (row.length > 100 ? '...' : '')
  };
}

function identifyInvalidRows(csvFile) {
  console.log('🔍 Identifying Invalid Rows - Detailed Analysis\n');
  
  const csvData = fs.readFileSync(csvFile, 'utf8');
  const lines = csvData.split('\n');
  
  const expectedColumns = 26;
  const header = lines[0];
  const headerColumnCount = countColumns(header);
  
  console.log(`📋 File: ${csvFile}`);
  console.log(`📊 Total lines: ${lines.length}`);
  console.log(`📝 Header columns: ${headerColumnCount}`);
  console.log(`🎯 Expected columns: ${expectedColumns}\n`);
  
  const validRows = [];
  const invalidRows = [];
  
  // Analyze each data row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    const analysis = analyzeRow(line, i + 1, expectedColumns);
    
    if (analysis.issues.length > 0) {
      invalidRows.push(analysis);
    } else {
      validRows.push(analysis);
    }
  }
  
  console.log(`📊 SUMMARY:`);
  console.log(`===========`);
  console.log(`✅ Valid rows: ${validRows.length}`);
  console.log(`❌ Invalid rows: ${invalidRows.length}`);
  console.log(`📋 Total processed: ${validRows.length + invalidRows.length}\n`);
  
  if (invalidRows.length > 0) {
    console.log(`🚨 INVALID ROWS ANALYSIS:`);
    console.log(`========================\n`);
    
    // Group invalid rows by issue type
    const issueGroups = {};
    invalidRows.forEach(row => {
      row.issues.forEach(issue => {
        if (!issueGroups[issue]) {
          issueGroups[issue] = [];
        }
        issueGroups[issue].push(row);
      });
    });
    
    // Show issue summary
    console.log(`📊 Issue Summary:`);
    Object.keys(issueGroups).forEach(issue => {
      console.log(`   ${issue}: ${issueGroups[issue].length} rows`);
    });
    console.log('');
    
    // Show first 10 invalid rows in detail
    console.log(`🔍 First 10 Invalid Rows (detailed):`);
    console.log(`===================================`);
    invalidRows.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. Row ${row.rowNumber}:`);
      console.log(`   Columns: ${row.columnCount}`);
      console.log(`   Issues: ${row.issues.join(', ')}`);
      console.log(`   Preview: ${row.preview}`);
      console.log('');
    });
    
    if (invalidRows.length > 10) {
      console.log(`... and ${invalidRows.length - 10} more invalid rows\n`);
    }
    
    // Show column count distribution
    console.log(`📊 Column Count Distribution:`);
    console.log(`============================`);
    const columnCounts = {};
    invalidRows.forEach(row => {
      if (!columnCounts[row.columnCount]) {
        columnCounts[row.columnCount] = 0;
      }
      columnCounts[row.columnCount]++;
    });
    
    Object.keys(columnCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(count => {
      const icon = count == expectedColumns ? '✅' : '❌';
      console.log(`   ${icon} ${count} columns: ${columnCounts[count]} rows`);
    });
  }
  
  return {
    valid: validRows.length,
    invalid: invalidRows.length,
    invalidRows: invalidRows
  };
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node identify-invalid-rows.js <csv-file>');
  process.exit(1);
}

const csvFile = args[0];

try {
  const result = identifyInvalidRows(csvFile);
  
  if (result.invalid === 0) {
    console.log('🎉 All rows are valid!');
  } else {
    console.log(`\n💡 RECOMMENDATION:`);
    console.log(`=================`);
    console.log(`Review the invalid rows above and fix the column count issues.`);
    console.log(`Most common issues are usually extra commas or missing fields.`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
} 