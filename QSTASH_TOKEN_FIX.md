# QStash Token Configuration Fix

**Issue Found:** Using wrong QStash token for job publishing

## 🔍 **Root Cause**

The system was using `QSTASH_CURRENT_SIGNING_KEY` for both:
1. ❌ Publishing QStash jobs (WRONG)
2. ✅ Verifying QStash webhooks (CORRECT)

## 🔧 **Fix Applied**

Updated code to use the correct tokens:

1. **`QSTASH_TOKEN`** - For publishing/creating jobs
2. **`QSTASH_CURRENT_SIGNING_KEY`** - For verifying webhooks

## ⚙️ **Required Action**

**Add to Vercel Environment Variables:**

```
QSTASH_TOKEN=your_qstash_publishing_token_here
```

### **How to get the QSTASH_TOKEN:**

1. Go to [Upstash Console](https://console.upstash.com/)
2. Navigate to QStash section
3. Look for **"QStash Token"** or **"Publishing Token"** (different from the signing key)
4. Copy that token
5. Add it to Vercel environment variables as `QSTASH_TOKEN`

## 📋 **Current Status**

**You already have:**
- ✅ `QSTASH_CURRENT_SIGNING_KEY` (for webhook verification)

**You need to add:**
- ❌ `QSTASH_TOKEN` (for publishing jobs)

## 🎯 **Expected Result**

Once `QSTASH_TOKEN` is added to Vercel:

1. ✅ QStash jobs will be created successfully (Status 200 instead of 401)
2. ✅ Automatic QR processing will work at scheduled times
3. ✅ Welcome emails will be sent automatically
4. ✅ No more "unable to authenticate: invalid token" errors

## 🧪 **Test After Adding Token**

1. Create a new scheduled QR from seller dashboard
2. Check logs - should see: `✅ SCHEDULED QR: QStash job created successfully!`
3. Wait for scheduled time - QR should be processed automatically
4. Customer should receive welcome email

---

**Status:** Ready for deployment once `QSTASH_TOKEN` is added to Vercel 