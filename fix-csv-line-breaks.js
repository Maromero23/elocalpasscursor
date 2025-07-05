const fs = require('fs');

function fixCSVLineBreaks(inputFile, outputFile) {
    console.log('🔧 Fixing CSV line breaks...');
    
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split(/\r?\n/);
    
    const fixedLines = [];
    let currentRecord = '';
    let inQuotedField = false;
    let quoteCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Count quotes in this line
        const quotes = (line.match(/"/g) || []).length;
        quoteCount += quotes;
        
        if (currentRecord === '') {
            // Start of a new record
            currentRecord = line;
            inQuotedField = (quoteCount % 2 === 1);
        } else {
            // Continuation of previous record
            currentRecord += ' ' + line;
            inQuotedField = (quoteCount % 2 === 1);
        }
        
        // If we're not in a quoted field and the line doesn't start with a quote
        // then this record is complete
        if (!inQuotedField && !line.startsWith('"')) {
            fixedLines.push(currentRecord);
            currentRecord = '';
            quoteCount = 0;
        }
        // Special case: if line starts with quote but we're not in quoted field,
        // it's likely a continuation that should be merged
        else if (line.startsWith('"') && currentRecord !== line) {
            // This is a continuation line, keep building the record
            continue;
        }
        // If we have a complete record (even quotes)
        else if (!inQuotedField && currentRecord !== '') {
            fixedLines.push(currentRecord);
            currentRecord = '';
            quoteCount = 0;
        }
    }
    
    // Add any remaining record
    if (currentRecord !== '') {
        fixedLines.push(currentRecord);
    }
    
    // Now identify and merge broken records by pattern
    const finalLines = [];
    
    for (let i = 0; i < fixedLines.length; i++) {
        const line = fixedLines[i];
        
        // If this line starts with a quote and comma, it's likely a continuation
        if (line.startsWith('",') && finalLines.length > 0) {
            // Merge with previous line
            finalLines[finalLines.length - 1] += line;
        } else {
            finalLines.push(line);
        }
    }
    
    // Clean up any malformed records
    const cleanedLines = finalLines.map(line => {
        // Remove excessive spaces
        line = line.replace(/\s+/g, ' ');
        // Fix quote issues
        line = line.replace(/"{2,}/g, '"');
        return line.trim();
    }).filter(line => line.length > 0);
    
    console.log(`📊 Original lines: ${lines.length}`);
    console.log(`📊 Fixed lines: ${cleanedLines.length}`);
    console.log(`📊 Merged ${lines.length - cleanedLines.length} broken records`);
    
    // Write fixed CSV
    fs.writeFileSync(outputFile, cleanedLines.join('\n'));
    console.log(`✅ Fixed CSV saved to: ${outputFile}`);
    
    return cleanedLines.length;
}

// Fix the CSV file
const inputFile = 'ELPCVSdatafile - Sheet1(4)_ALIGNED.csv';
const outputFile = 'ELPCVSdatafile - Sheet1(4)_LINE_BREAKS_FIXED.csv';

try {
    const finalCount = fixCSVLineBreaks(inputFile, outputFile);
    console.log(`🎉 CSV line breaks fixed! Final row count: ${finalCount - 1} data rows + 1 header`);
} catch (error) {
    console.error('❌ Error fixing CSV:', error);
} 