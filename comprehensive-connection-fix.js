#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the list of leaking files
const leakingFiles = `app/api/seller/landing-urls/route.ts
app/api/seller/landing-urls/[id]/route.ts
app/api/seller/config/route.ts
app/api/landing/default-template/route.ts
app/api/landing/config/[qrId]/route.ts
app/api/rebuy-emails/send-single/route.ts
app/api/rebuy-emails/send/route.ts
app/api/test-default-template/route.ts
app/api/location/dashboard/route.ts
app/api/manual-order/route.ts
app/api/admin/landing-page-templates/route.ts
app/api/admin/rebuy-templates/route.ts
app/api/admin/email-templates/route.ts
app/api/admin/email-templates/[id]/route.ts
app/api/admin/website-sales/route.ts
app/api/admin/assign-config/route.ts
app/api/admin/distributors/test/route.ts
app/api/admin/distributors/[id]/toggle-status/route.ts
app/api/admin/distributors/analytics/route.ts
app/api/admin/qr-config/route.ts
app/api/admin/qr-config/[id]/route.ts
app/api/admin/qr-config/sellers/route.ts
app/api/admin/qr-global-config/route.ts
app/api/admin/locations/[id]/toggle-status/route.ts
app/api/admin/locations/[id]/route.ts
app/api/admin/locations/analytics/route.ts
app/api/admin/saved-configs/[id]/route.ts
app/api/admin/affiliates/bulk-delete/route.ts
app/api/admin/affiliates/annotations/route.ts
app/api/admin/affiliates/bulk-fix-logos/route.ts
app/api/admin/affiliates/[id]/route.ts
app/api/admin/default-email-template/route.ts
app/api/admin/scheduled-qrs/route.ts
app/api/admin/sellers/[sellerId]/toggle-status/route.ts
app/api/admin/sellers/[sellerId]/generate-code/route.ts
app/api/admin/sellers/[sellerId]/route.ts
app/api/admin/sellers/[sellerId]/unpair-config/route.ts
app/api/admin/independent-sellers/route.ts
app/api/test-order-processing/route.ts
app/api/manual-order-simple/route.ts
app/api/user/preferences/route.ts
app/api/check-latest-template/route.ts
app/api/test-db/route.ts
app/api/manual-order-sql/route.ts
app/api/paypal/webhook/route.ts
app/api/locations/affiliates/route.ts
app/api/locations/stats/route.ts
app/api/debug-template/route.ts
app/api/landing-page/[qrId]/route.ts
app/api/landing-page/config/[qrId]/route.ts
app/api/check-paypal-template/route.ts
app/api/scheduled-qr/process-single/route.ts
app/api/scheduled-qr/process-overdue/route.ts
app/api/scheduled-qr/retry-overdue/route.ts
app/api/scheduled-qr/process/route.ts
app/api/affiliate/auth/logout/route.ts
app/api/affiliate/auth/login/route.ts
app/api/affiliate/scan-qr/route.ts
app/api/affiliate/profile/route.ts
app/api/affiliate/session/recover/route.ts
app/api/orders/payment/[paymentId]/route.ts
app/api/orders/[orderId]/route.ts
app/api/check-recent-qr/route.ts
app/api/validate-discount-code/route.ts
app/api/verify-payment/route.ts
app/api/check-sellers/route.ts
app/api/test-passes-rebuy/route.ts
app/api/customer/reactivate/route.ts
app/api/customer/access/route.ts
app/api/customer/download-qr/route.ts
app/api/check-all-templates/route.ts`.split('\n');

console.log(`🔧 COMPREHENSIVE CONNECTION LEAK FIX`);
console.log(`📊 Found ${leakingFiles.length} files to fix`);

let fixedCount = 0;
let errorCount = 0;
let skippedCount = 0;
const errors = [];

for (const filePath of leakingFiles) {
  if (!filePath.trim()) continue;
  
  try {
    console.log(`\n🔍 Processing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found, skipping`);
      skippedCount++;
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has disconnect
    if (content.includes('prisma.$disconnect')) {
      console.log(`   ✅ Already has disconnect, skipping`);
      skippedCount++;
      continue;
    }
    
    // Skip if no try/catch blocks
    if (!content.includes('} catch (')) {
      console.log(`   ⚠️  No try/catch blocks found, skipping`);
      skippedCount++;
      continue;
    }
    
    // Find all function exports (GET, POST, PUT, DELETE, PATCH)
    const functionRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{/g;
    const functions = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        method: match[1],
        start: match.index,
        startPos: match.index + match[0].length
      });
    }
    
    if (functions.length === 0) {
      console.log(`   ⚠️  No HTTP functions found, skipping`);
      skippedCount++;
      continue;
    }
    
    console.log(`   📝 Found ${functions.length} HTTP functions: ${functions.map(f => f.method).join(', ')}`);
    
    // Process each function
    let modifiedContent = content;
    let offset = 0;
    
    for (const func of functions) {
      const adjustedStart = func.startPos + offset;
      
      // Find the function body
      let braceCount = 1;
      let pos = adjustedStart;
      let functionEnd = -1;
      
      while (pos < modifiedContent.length && braceCount > 0) {
        const char = modifiedContent[pos];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        pos++;
      }
      
      if (braceCount === 0) {
        functionEnd = pos - 1;
      } else {
        console.log(`   ❌ Could not find end of ${func.method} function`);
        continue;
      }
      
      const functionBody = modifiedContent.substring(adjustedStart, functionEnd);
      
      // Check if this function has a try/catch
      if (!functionBody.includes('} catch (')) {
        console.log(`   ⚠️  ${func.method} function has no try/catch, skipping`);
        continue;
      }
      
      // Find the last catch block in this function
      const catchRegex = /}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/g;
      const catches = [];
      let catchMatch;
      
      while ((catchMatch = catchRegex.exec(functionBody)) !== null) {
        catches.push({
          match: catchMatch[0],
          start: catchMatch.index,
          end: catchMatch.index + catchMatch[0].length
        });
      }
      
      if (catches.length === 0) {
        console.log(`   ⚠️  ${func.method} function has no catch blocks, skipping`);
        continue;
      }
      
      // Get the last catch block
      const lastCatch = catches[catches.length - 1];
      const catchEnd = adjustedStart + lastCatch.end;
      
      // Check if there's already a finally block after this catch
      const afterCatch = modifiedContent.substring(catchEnd).trim();
      if (afterCatch.startsWith('finally')) {
        console.log(`   ✅ ${func.method} already has finally block, skipping`);
        continue;
      }
      
      // Insert finally block
      const finallyBlock = ` finally {\n    await prisma.$disconnect()\n  }`;
      
      modifiedContent = modifiedContent.substring(0, catchEnd) + 
                      finallyBlock + 
                      modifiedContent.substring(catchEnd);
      
      offset += finallyBlock.length;
      console.log(`   ✅ Added finally block to ${func.method} function`);
    }
    
    // Only write if we made changes
    if (modifiedContent !== content) {
      fs.writeFileSync(filePath, modifiedContent);
      fixedCount++;
      console.log(`   🎉 Successfully fixed ${filePath}`);
    } else {
      skippedCount++;
      console.log(`   ⚠️  No changes needed for ${filePath}`);
    }
    
  } catch (error) {
    errorCount++;
    const errorMsg = `Error processing ${filePath}: ${error.message}`;
    errors.push(errorMsg);
    console.log(`   ❌ ${errorMsg}`);
  }
}

console.log(`\n📊 COMPREHENSIVE FIX SUMMARY:`);
console.log(`✅ Successfully Fixed: ${fixedCount} files`);
console.log(`⚠️  Skipped: ${skippedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);

if (errors.length > 0) {
  console.log(`\n❌ ERRORS:`);
  errors.forEach(error => console.log(`   - ${error}`));
}

console.log(`\n🎯 NEXT STEPS:`);
console.log(`1. Review the changes`);
console.log(`2. Test a few critical endpoints`);
console.log(`3. Commit and deploy if everything looks good`);
console.log(`4. Monitor for any remaining connection issues`);
