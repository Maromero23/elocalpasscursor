const fs = require('fs');

function extractCompleteRecords(inputFile, outputFile) {
    console.log('📋 Extracting complete affiliate records...');
    
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split(/\r?\n/);
    
    const completeRecords = [];
    let headerLine = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Handle header
        if (i === 0 || line.startsWith('Afiliate number')) {
            headerLine = line;
            completeRecords.push(line);
            continue;
        }
        
        // Count fields in this line
        const fields = line.split(',');
        
        // Only keep records with 20+ fields (complete affiliate records)
        if (fields.length >= 20) {
            completeRecords.push(line);
        } else {
            console.log(`⚠️  Skipping incomplete record (${fields.length} fields): ${line.substring(0, 100)}...`);
        }
    }
    
    console.log(`📊 Original lines: ${lines.length}`);
    console.log(`📊 Complete records: ${completeRecords.length - 1} (excluding header)`);
    console.log(`📊 Removed ${lines.length - completeRecords.length} incomplete fragments`);
    
    // Write clean CSV
    fs.writeFileSync(outputFile, completeRecords.join('\n'));
    console.log(`✅ Clean CSV saved to: ${outputFile}`);
    
    return completeRecords.length - 1; // Exclude header from count
}

// Extract complete records
const inputFile = 'ELPCVSdatafile - Sheet1(4)_ALIGNED.csv';
const outputFile = 'ELPCVSdatafile - Sheet1(4)_COMPLETE_RECORDS.csv';

try {
    const finalCount = extractCompleteRecords(inputFile, outputFile);
    console.log(`🎉 Clean CSV created! Final affiliate count: ${finalCount}`);
    
    // Show first few lines to verify
    console.log('\n📋 First 3 lines preview:');
    const content = fs.readFileSync(outputFile, 'utf8');
    const previewLines = content.split('\n').slice(0, 3);
    previewLines.forEach((line, i) => {
        console.log(`${i + 1}: ${line.substring(0, 100)}...`);
    });
    
    // Show the count breakdown
    console.log('\n📊 Field count analysis:');
    const lines = content.split('\n');
    const fieldCounts = {};
    
    for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (line) {
            const fieldCount = line.split(',').length;
            fieldCounts[fieldCount] = (fieldCounts[fieldCount] || 0) + 1;
        }
    }
    
    Object.keys(fieldCounts).sort((a, b) => b - a).forEach(count => {
        console.log(`  ${count} fields: ${fieldCounts[count]} records`);
    });
    
} catch (error) {
    console.error('❌ Error extracting records:', error);
} 