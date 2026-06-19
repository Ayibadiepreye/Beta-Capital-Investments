# Major Platform Refactoring - Implementation Progress

## Overview
Complete platform overhaul to:
- Remove payment gateways (Paystack, Monnify, Flutterwave)
- Keep only Crypto payments
- Remove Google OAuth
- Implement manual approval workflow
- Replace transaction hashes with image uploads
- Remove NGN, use only USD
- Enhance animations

## Progress Tracker

### ✅ COMPLETED
1. **Landing Page**
   - ✅ Removed payment methods section (Paystack, Flutterwave, Monnify, Crypto badges)
   - ✅ Enhanced CSS animations (60px translations, 1s duration, bounce effects)

### 🚧 IN PROGRESS  
2. **Authentication Changes**
   - ⏳ Remove Google OAuth from LoginView.tsx
   - ⏳ Remove Google OAuth from SignUpView.tsx
   - ⏳ Add phone number field to signup
   - ⏳ Add KYC upload to signup
   - ⏳ Implement pending approval flow
   - ⏳ Create PendingApprovalView component

3. **Payment System**
   - ⏳ Modify PaymentModal.tsx - Keep only Crypto
   - ⳹ Replace transaction hash input with image upload
   - ⏳ Update admin to view deposit images

4. **Withdrawal System**
   - ⏳ Modify WithdrawModal - Only Bank & Crypto
   - ⏳ Remove Paystack withdrawal option
   - ⏳ Replace NGN with USD everywhere
   - ⏳ Change Zenith Bank to Chase Bank

5. **Admin Dashboard**
   - ⏳ Remove crypto address configuration
   - ⏳ Make account numbers copyable
   - ⏳ Remove address configuration warning
   - ⏳ Update deposit verification UI for images

6. **Investment Logic**
   - ⏳ Remove early withdrawal functionality
   - ⏳ Enforce 30-day minimum hold period

7. **Email Notifications**
   - ⏳ Integrate Resend for all notifications
   - ⏳ Send approval email after admin verification
   - ⏳ Send rejection email if KYC rejected
   - ⏳ Send all transaction notifications via email

### 📋 TODO
8. **Backend API Changes**
   - Add `/api/auth/signup` - Include phone + KYC upload
   - Add `/api/auth/verify-pending` - Admin verification endpoint
   - Modify `/api/payments/crypto/submit` - Accept image file instead of hash
   - Add Resend email service integration
   - Update withdrawal endpoint - Remove early withdrawal
   - Update all endpoints to use USD only

9. **Database Schema**
   - Add `phoneNumber` to users table
   - Add `kycFileUrl` or `kycFileData` to users table
   - Add `accountStatus` enum: pending, approved, rejected
   - Add `depositImageUrl` to payments table
   - Remove or deprecate NGN-related columns

10. **Testing & Verification**
    - Test signup → pending → admin approval flow
    - Test crypto deposit with image upload
    - Test withdrawal with only Bank & Crypto
    - Test email notifications via Resend
    - Verify all animations on landing page

## Files Modified So Far
1. ✅ `artifacts/bettercapitalinvestment/src/components/LandingView.tsx`
2. ✅ `artifacts/bettercapitalinvestment/src/index.css`

## Files To Modify Next
- `artifacts/bettercapitalinvestment/src/components/LoginView.tsx`
- `artifacts/bettercapitalinvestment/src/components/SignUpView.tsx`
- `artifacts/bettercapitalinvestment/src/components/PaymentModal.tsx`
- `Serverless-Finance/artifacts/bettercapitalinvestment/src/components/WithdrawModal.tsx`
- `artifacts/bettercapitalinvestment/src/components/AdminDashboard.tsx`
- `artifacts/api-server/src/routes/auth.ts`
- `artifacts/api-server/src/routes/payments.ts`
- `artifacts/api-server/src/routes/admin.ts`

## Notes
- Using Chase Bank instead of Zenith Bank
- All amounts in USD (no NGN conversion)
- Manual admin approval required for all new signups
- Crypto is the ONLY deposit method
- Bank Transfer & Crypto are the ONLY withdrawal methods
- Transaction image uploads instead of hash pasting
- Resend for email notifications
