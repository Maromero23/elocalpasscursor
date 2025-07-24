# ELocalPass v3.39.67 - Critical PayPal Discount Code Fix

## 🚨 **URGENT FIX: PayPal BAD_INPUT_ERROR with Discount Codes**

### Issue Fixed
**Problem**: When users applied discount codes in the passes page modal and clicked "Pay with PayPal", they would get stuck on "processing" and then receive a PayPal error page showing:
- Error: `BAD_INPUT_ERROR` 
- Message: "Things don't appear to be working at the moment. Please try again later."

**Root Cause**: PayPal's `custom` field has a 256-character limit. When discount codes were present, the JSON being sent in the custom field became too long (especially when URL-encoded), causing PayPal to reject the payment request.

### Solution Applied

#### ✅ **Minimized PayPal Custom Data**
**Before (Too Long)**:
```javascript
custom: JSON.stringify({
  customerEmail: orderData.customerEmail,
  customerName: orderData.customerName,
  passType: orderData.passType,
  guests: orderData.guests,
  days: orderData.days,
  deliveryType: orderData.deliveryType,
  deliveryDate: orderData.deliveryDate,
  deliveryTime: orderData.deliveryTime,
  discountCode: orderData.discountCode,
  sellerId: orderData.sellerId,
  calculatedPrice: orderData.calculatedPrice
})
```

**After (Compact)**:
```javascript
custom: JSON.stringify({
  email: orderData.customerEmail,
  name: orderData.customerName,
  type: orderData.passType,
  g: orderData.guests,
  d: orderData.days,
  price: orderData.calculatedPrice
})
```

#### ✅ **Updated Webhook Handler**
- **Backward Compatible**: Handles both old and new custom data formats
- **Simplified Processing**: Essential data only in custom field
- **Complete Data**: Full order details handled via success route

## 🎯 Files Modified

- **`components/PassSelectionModal.tsx`**: Minimized custom field data
- **`app/api/paypal/webhook/route.ts`**: Added backward compatibility for custom data parsing

## ✅ **Expected Results**

**Discount Code Payments**: ✅ Should now process successfully  
**PayPal Redirect**: ✅ No more BAD_INPUT_ERROR  
**Order Processing**: ✅ Complete data preserved via success route  
**Backward Compatibility**: ✅ Existing payments still work  

## 🚀 **Test Instructions**

1. Go to passes page
2. Select any pass type
3. **Add a discount code** (this was the trigger)
4. Fill in customer details
5. Click "Pay with PayPal"
6. Should redirect to PayPal successfully (no error page)

---

**Priority**: 🔥 **CRITICAL** - Fixes payment processing for discount code users 