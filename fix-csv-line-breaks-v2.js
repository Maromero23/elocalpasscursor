const fs = require('fs');

function fixCSVLineBreaks(inputFile, outputFile) {
    console.log('🔧 Fixing CSV line breaks with proper CSV parsing...');
    
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split(/\r?\n/);
    
    const fixedLines = [];
    let currentRecord = '';
    let inQuotedField = false;
    let consecutiveQuotes = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // If we're starting a new record
        if (currentRecord === '') {
            currentRecord = line;
            
            // Check if this line leaves us in a quoted field
            inQuotedField = isInQuotedField(line);
        } else {
            // We're continuing a record from previous line
            // Add the line with a space (to replace the line break)
            currentRecord += ' ' + line;
            
            // Check if we're still in a quoted field
            inQuotedField = isInQuotedField(currentRecord);
        }
        
        // If we're not in a quoted field, this record is complete
        if (!inQuotedField) {
            // Only add records that look like complete affiliate records
            if (isCompleteRecord(currentRecord)) {
                fixedLines.push(currentRecord);
            }
            currentRecord = '';
        }
    }
    
    // Add any remaining record
    if (currentRecord !== '') {
        if (isCompleteRecord(currentRecord)) {
            fixedLines.push(currentRecord);
        }
    }
    
    console.log(`📊 Original lines: ${lines.length}`);
    console.log(`📊 Fixed lines: ${fixedLines.length}`);
    console.log(`📊 Merged ${lines.length - fixedLines.length} broken records`);
    
    // Write fixed CSV
    fs.writeFileSync(outputFile, fixedLines.join('\n'));
    console.log(`✅ Fixed CSV saved to: ${outputFile}`);
    
    return fixedLines.length;
}

function isInQuotedField(line) {
    let inQuote = false;
    let quoteCount = 0;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            // Check if this is an escaped quote
            if (i + 1 < line.length && line[i + 1] === '"') {
                // Skip the escaped quote
                i++;
                continue;
            }
            
            // Toggle quote state
            inQuote = !inQuote;
            quoteCount++;
        }
    }
    
    return inQuote;
}

function isCompleteRecord(record) {
    // Skip header row
    if (record.startsWith('Afiliate number')) {
        return true;
    }
    
    // Skip lines that are clearly continuation fragments
    if (record.startsWith('",') || record.startsWith('"') && record.split(',').length < 5) {
        return false;
    }
    
    // A complete record should have at least 10 fields
    const fields = record.split(',');
    return fields.length >= 10;
}

// Fix the CSV file
const inputFile = 'ELPCVSdatafile - Sheet1(4)_ALIGNED.csv';
const outputFile = 'ELPCVSdatafile - Sheet1(4)_LINE_BREAKS_FIXED_V2.csv';

try {
    const finalCount = fixCSVLineBreaks(inputFile, outputFile);
    console.log(`🎉 CSV line breaks fixed! Final row count: ${finalCount - 1} data rows + 1 header`);
    
    // Show first few lines to verify
    console.log('\n📋 First 3 lines preview:');
    const content = fs.readFileSync(outputFile, 'utf8');
    const previewLines = content.split('\n').slice(0, 3);
    previewLines.forEach((line, i) => {
        console.log(`${i + 1}: ${line.substring(0, 100)}...`);
    });
} catch (error) {
    console.error('❌ Error fixing CSV:', error);
} 