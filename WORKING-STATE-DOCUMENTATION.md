# 🚨 CRITICAL: WORKING STATE DOCUMENTATION - DO NOT BREAK WELCOME EMAILS

## ✅ WELCOME EMAILS - CURRENTLY WORKING (v3.6)

### **Database State (DO NOT MODIFY):**
- **WelcomeEmailTemplate table:** Has correct default template
  - **ID:** cmcbj63qh0000p47ebxq19bix  
  - **Subject:** "Welcome to eLocalPass!" ✅
  - **customHTML:** 5,068 characters of real branded content ✅
  - **isDefault:** true ✅

### **Working Configurations:**
- **Pedrita Gomez** paired to **"lets get welcome eail done"** (ID: cmcbgg9sv0000s17nxjl73zrf)
- **Configuration has:** `"customHTML": "USE_DEFAULT_TEMPLATE"` ✅
- **This triggers:** Database lookup to WelcomeEmailTemplate where isDefault=true ✅

### **Working Code Logic:**
1. **Landing Page Route:** `app/api/landing-page/submit/route.ts` (v3.6)
   - ✅ Parses `emailTemplates` JSON string correctly
   - ✅ Detects `customHTML === 'USE_DEFAULT_TEMPLATE'`
   - ✅ Loads default template from database
   - ✅ Uses `defaultTemplate.subject` for email subject
   - ✅ Uses `defaultTemplate.customHTML` for email content

2. **Seller Route:** `app/api/seller/generate-qr/route.ts` 
   - ✅ Already had correct logic for subject and content

### **Email Flow That Works:**
1. **Configuration:** `"customHTML": "USE_DEFAULT_TEMPLATE"`
2. **Database Lookup:** `prisma.welcomeEmailTemplate.findFirst({ where: { isDefault: true } })`
3. **Subject:** `defaultTemplate.subject` → "Welcome to eLocalPass!"
4. **Content:** `defaultTemplate.customHTML` → 5,068 chars of branded HTML
5. **Result:** Correct branded email with correct subject ✅

---

## 🚨 DANGER ZONES - DO NOT TOUCH THESE:

### **Database Tables - HANDS OFF:**
- ❌ **DO NOT** modify `WelcomeEmailTemplate` table
- ❌ **DO NOT** change `isDefault: true` record
- ❌ **DO NOT** update `customHTML` field in default template
- ❌ **DO NOT** change `subject` field in default template

### **Working Code - DO NOT MODIFY:**
- ❌ **DO NOT** change email subject logic in `app/api/landing-page/submit/route.ts`
- ❌ **DO NOT** modify `USE_DEFAULT_TEMPLATE` detection logic
- ❌ **DO NOT** change database lookup for default template
- ❌ **DO NOT** alter JSON parsing of `emailTemplates` field

### **Working Configurations - LEAVE ALONE:**
- ❌ **DO NOT** modify Pedrita's configuration (cmcbgg9sv0000s17nxjl73zrf)
- ❌ **DO NOT** change `"customHTML": "USE_DEFAULT_TEMPLATE"` values
- ❌ **DO NOT** update `emailTemplates` JSON structure

---

## 📋 REBUY EMAIL INVESTIGATION PLAN:

### **Safe Approach:**
1. **First:** Document current rebuy email state (like this doc for welcome emails)
2. **Check:** If rebuy emails use similar database structure
3. **Identify:** What's broken without touching welcome email code
4. **Fix:** Only rebuy-specific logic, avoid shared code paths
5. **Test:** Verify welcome emails still work after each change

### **Key Questions to Answer:**
- Do rebuy emails use the same `WelcomeEmailTemplate` table? (DON'T TOUCH IT)
- Do rebuy emails have their own `RebuyEmailTemplate` table? (SAFE TO MODIFY)
- Do rebuy emails share any code paths with welcome emails? (AVOID THOSE)
- Where are rebuy email templates stored and how are they loaded?

### **Golden Rule:**
**IF IN DOUBT, DON'T TOUCH ANYTHING RELATED TO WELCOME EMAILS**

---

## ✅ VERIFICATION CHECKLIST:
Before making ANY changes related to rebuy emails:

1. [ ] Welcome emails still send with "Welcome to eLocalPass!" subject
2. [ ] Welcome emails still use 5,068 character branded HTML content  
3. [ ] Default template option still works in QR configuration
4. [ ] Pedrita's configuration still works correctly
5. [ ] Database default template record unchanged

**If ANY of these fail after rebuy changes, IMMEDIATELY REVERT ALL CHANGES.** 