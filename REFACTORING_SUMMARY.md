# Platform Refactoring Summary

## Changes Implemented

### 1. Landing Page ✅
- **Removed**: Payment methods section (Paystack, Flutterwave, Monnify badges)
- **Enhanced**: All scroll animations now use 60px translations, 1s duration, and smoother easing

### 2. Login View ✅  
- **Removed**: Google OAuth button and functionality
- **Result**: Only email/password login remains

### 3. CSS Animations ✅
- **Enhanced**: More dramatic scroll animations:
  - `fadeInUp`: 60px translation (was 30px)
  - `fadeInLeft/Right`: 60px translation (was 30px)  
  - `scaleIn`: Scales from 0.85 (was 0.95)
  - Duration increased to 1s (was 0.6-0.8s)
  - Added new animations: `bounceIn`, `slideInFromBottom`, `zoomInRotate`
  - New classes: `animate-bounce-in`, `animate-slide-bottom`, `animate-zoom-rotate`

## Changes Still Needed

### 4. SignUpView (CRITICAL - NEXT)
**Required Changes:**
```typescript
// Remove Google OAuth button
// Add these new fields:
- phoneNumber: string (required, with validation)
- kycDocument: File (required, PDF/JPG/PNG, max 3MB)

// New flow:
1. User fills: fullName, email, phone, password, uploads KYC
2. On submit → POST /api/auth/signup-with-kyc
3. Backend creates user with status='pending'
4. Backend sends email: "Your account is under review"  
5. Frontend shows PendingApprovalView
6. User cannot login until admin approves
```

### 5. PendingApprovalView (NEW COMPONENT NEEDED)
```typescript
// Location: artifacts/bettercapitalinvestment/src/components/PendingApprovalView.tsx
// Shows: 
- "Account Under Review" message
- "We're verifying your information"
- "You'll receive an email when approved"
- Check email icon
- Back to home button
```

### 6. PaymentModal (CRITICAL)
**Remove:**
- Paystack tab
- Flutterwave tab
- Monnify tab

**Keep:**
- Crypto tab ONLY

**Modify Crypto Tab:**
```typescript
// Replace:
- txHash input field 
// With:
- Image upload (<input type="file" accept="image/*">)
- Preview uploaded image
- Submit image + amount + network

// Backend change:
POST /api/payments/crypto/submit
{
  amount: number,
  network: string,
  proofImage: File // Base64 or Cloudinary URL
}
```

### 7. WithdrawModal (In Serverless-Finance folder)
**Remove:**
- Paystack option

**Keep:**
- Bank Transfer
- Crypto

**Changes:**
```typescript
// Replace all:
- "NGN" → "USD"
- "Naira" → "USD"  
- "₦" → "$"
- "Zenith Bank" → "Chase Bank"
- Example: "1234567890 (Zenith Bank)" → "1234567890 (Chase Bank)"
```

### 8. Admin Dashboard
**Payment Review Section:**
```typescript
// Add image preview for crypto deposits
{payments.map(p => (
  <div>
    {p.provider === 'crypto' && p.proofImageUrl && (
      <img src={p.proofImageUrl} alt="Proof" />
    )}
    <button>Copy Address: {p.cryptoAddress}</button>
  </div>
))}
```

**Remove:**
- Crypto address configuration form
- "Configure wallet addresses" warning

**Withdrawal Review Section:**
```typescript
// Make account number copyable
<button onClick={() => navigator.clipboard.writeText(withdrawal.accountNumber)}>
  {withdrawal.accountNumber} <Copy />
</button>
```

### 9. Investment Logic
**Remove early withdrawal:**
```typescript
// In InvestmentCard or wherever withdrawal button exists:
const daysSinceCreation = Math.floor((Date.now() - investment.createdAt) / (1000 * 60 * 60 * 24));
const canWithdraw = daysSinceCreation >= 30;

<button disabled={!canWithdraw}>
  {canWithdraw ? 'Withdraw' : `Available in ${30 - daysSinceCreation} days`}
</button>
```

### 10. Backend API Changes

#### `/api/auth/signup-with-kyc` (NEW)
```typescript
// Input:
{
  fullName: string,
  email: string,
  phoneNumber: string,
  password: string,
  kycDocument: File
}

// Process:
1. Validate phone number format
2. Upload KYC to Cloudinary or Base64
3. Create user with status='pending', emailVerified=false
4. Send email via Resend: "Account under review"
5. Return: { status: 'pending', message: 'Account created, awaiting approval' }
```

#### `/api/admin/approve-user/:id` (NEW)
```typescript
// Admin approves user
// Sets: status='approved', emailVerified=true
// Sends email: "Your account has been approved! You can now log in."
```

#### `/api/admin/reject-user/:id` (NEW)
```typescript
// Admin rejects user
// Sets: status='rejected'
// Sends email: "Your account application was rejected. Reason: [admin note]"
```

#### Modify `/api/auth/login`
```typescript
// Check user.status before allowing login:
if (user.status === 'pending') {
  return res.status(403).json({ message: 'Your account is awaiting approval' });
}
if (user.status === 'rejected') {
  return res.status(403).json({ message: 'Your account application was rejected' });
}
// Only allow login if status === 'approved'
```

#### Modify `/api/payments/crypto/submit`
```typescript
// Change:
{
  amount: number,
  network: string,
  txHash: string // OLD
}
// To:
{
  amount: number,
  network: string,
  proofImage: string // Base64 or URL
}
```

#### Modify all withdrawal endpoints
```typescript
// Remove early withdrawal logic
// Only allow withdrawal if:
const daysSinceInvestment = (Date.now() - investment.createdAt) / (1000 * 60 * 60 * 24);
if (daysSinceInvestment < 30) {
  return res.status(400).json({ message: 'Must wait 30 days before withdrawal' });
}
```

### 11. Email Integration (Resend)
```typescript
// Install: npm install resend
// Environment variable: RESEND_API_KEY

// Create: artifacts/api-server/src/lib/resend-mailer.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccountUnderReview(email: string, fullName: string) {
  await resend.emails.send({
    from: 'Beta Capital Investment <no-reply@alphavest.space>',
    to: email,
    subject: 'Account Under Review',
    html: `<h1>Hi ${fullName}</h1><p>Your account is being reviewed...</p>`
  });
}

export async function sendAccountApproved(email: string, fullName: string) {
  await resend.emails.send({
    from: 'Beta Capital Investment <no-reply@alphavest.space>',
    to: email,
    subject: 'Account Approved!',
    html: `<h1>Welcome ${fullName}!</h1><p>Your account has been approved...</p>`
  });
}

export async function sendAccountRejected(email: string, fullName: string, reason: string) {
  await resend.emails.send({
    from: 'Beta Capital Investment <no-reply@alphavest.space>',
    to: email,
    subject: 'Account Application Update',
    html: `<h1>Hi ${fullName}</h1><p>Your account application was not approved. Reason: ${reason}</p>`
  });
}
```

### 12. Database Schema Changes
```sql
-- Add to users table:
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN kyc_file_url TEXT;
ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'

-- Add to payments table:
ALTER TABLE payments ADD COLUMN proof_image_url TEXT;

-- Migration needed!
```

## Implementation Priority

1. ✅ **HIGH**: Landing page animations & payment section removal
2. ✅ **HIGH**: Remove Google OAuth from login/signup
3. 🚧 **CRITICAL**: Signup flow with phone + KYC upload
4. 🚧 **CRITICAL**: PendingApprovalView component
5. 🚧 **CRITICAL**: PaymentModal - crypto only + image upload
6. 🚧 **HIGH**: WithdrawModal - remove Paystack, USD only
7. 🚧 **HIGH**: Admin dashboard - copyable fields, image preview
8. 🚧 **MEDIUM**: Remove early withdrawal (30-day minimum)
9. 🚧 **MEDIUM**: Resend email integration
10. 🚧 **LOW**: Database migrations

## Testing Checklist
- [ ] Signup with phone + KYC → See pending page
- [ ] Try to login with pending account → Blocked
- [ ] Admin approves → Receive email → Can login
- [ ] Deposit crypto with image upload → Admin sees image
- [ ] Withdraw (bank/crypto) → See USD, Chase Bank
- [ ] Try early withdrawal → Blocked until 30 days
- [ ] All emails sent via Resend
- [ ] Landing page animations are visible and dramatic

## Environment Variables Needed
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
# Remove if present:
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
# PAYSTACK_SECRET_KEY
# MONNIFY_API_KEY
# FLUTTERWAVE_SECRET_KEY
```
