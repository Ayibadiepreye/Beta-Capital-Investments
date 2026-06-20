# Email Setup Guide 📧

## Overview

Your platform now sends automated emails for:
1. **Account Pending** - When a user signs up, they receive a "Your account is under review" email
2. **Account Approved** - When an admin approves an account, the user receives an "Account approved, start investing!" email
3. **Withdrawal Notifications** - When withdrawals are approved/rejected

## ✅ What's Been Added

### Email Functions in `auth.ts`
- `sendAccountPendingEmail()` - Sends when user creates account
- `sendAccountApprovedEmail()` - Sends when admin approves account (called from admin.ts)

### Email Templates
All emails use professional HTML templates with:
- BetterCapitalInvestment branding
- Gold accent color (#f2ca50)
- Responsive design
- Developer credits footer ("Developed by Setons and Kirito")

### When Emails Are Sent

**On Signup** (non-admin users):
```
User signs up → Account created → sendAccountPendingEmail() called
```

**On Admin Approval**:
```
Admin clicks "Approve" → accountApproved set to true → sendAccountApprovedEmail() called
```

## 🔧 Setup Required: Get Resend API Key

To enable email sending, you need to set up Resend (free email API service):

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email

### Step 2: Get API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it "BetterCapitalInvestment Production"
4. Copy the API key (starts with `re_...`)

### Step 3: Add Domain (Optional but Recommended)
1. Go to https://resend.com/domains
2. Add your domain: `bettercapitalinvestment.com`
3. Add the DNS records they provide to your domain registrar
4. Wait for verification (usually 5-10 minutes)

**Note**: Without a verified domain, emails will be sent from `onboarding@resend.dev` (free tier limitation)

### Step 4: Configure Environment Variable on Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your API key from Step 2 (e.g., `re_123abc456def...`)
6. Click **Save**
7. **Redeploy** your site for the environment variable to take effect

### Step 5: Update Email Sender Address (if using custom domain)

If you verified a custom domain in Step 3, update the `from` address in the email functions:

**File**: `artifacts/api-server/src/routes/auth.ts`

Change:
```typescript
from: "BetterCapitalInvestment <no-reply@bettercapitalinvestment.com>",
```

To your verified domain:
```typescript
from: "BetterCapitalInvestment <no-reply@yourdomain.com>",
```

## 📧 Testing Email Functionality

### Test 1: Pending Email on Signup
1. Create a new account (non-admin email)
2. Check the email inbox you signed up with
3. You should receive "Welcome to BetterCapitalInvestment - Your Account is Under Review"

### Test 2: Approval Email
1. Log in as admin
2. Go to Admin Dashboard → Users tab
3. Find a pending user and click "Approve"
4. The user should receive "Your BetterCapitalInvestment Account Has Been Approved!"

### If Emails Don't Send

**Check Netlify Logs:**
1. Go to Netlify dashboard → Deploys → Function logs
2. Look for errors like:
   - `RESEND_API_KEY not configured` → Environment variable not set
   - `Resend error 401` → Invalid API key
   - `Resend error 403` → Domain not verified (using wrong from address)

**Without API Key:**
- Emails will be logged to console only (dev mode)
- Users won't receive actual emails
- Console log will show: `RESEND_API_KEY not configured — email logged to console`

## 📝 Email Content

### Pending Email
- **Subject**: "Welcome to BetterCapitalInvestment - Your Account is Under Review"
- **Content**: Welcome message, explains account is under review, 24-48 hour timeframe
- **Tone**: Friendly, professional, reassuring

### Approval Email
- **Subject**: "Your BetterCapitalInvestment Account Has Been Approved!"
- **Content**: Celebration emoji, account approved notice, "Login Now" button
- **Button**: Links to `https://bettercapitalinvestments.netlify.app`
- **Tone**: Excited, welcoming, action-oriented

## 💰 Cost Breakdown

**Resend Pricing:**
- **Free Tier**: 100 emails/day, 3,000/month
- **Pro Plan**: $20/month for 50,000 emails/month
- **Enterprise**: Custom pricing

For a new platform, the free tier is usually sufficient. You can upgrade later if you exceed limits.

## 🔒 Security Notes

- Never commit the `RESEND_API_KEY` to git
- Store it only in Netlify environment variables
- Rotate the key periodically for security
- Monitor usage in Resend dashboard to detect abuse

## 🐛 Troubleshooting

**Problem**: "Emails not being sent"
**Solution**: Check that `RESEND_API_KEY` is set in Netlify environment variables and redeploy

**Problem**: "Email shows from onboarding@resend.dev"
**Solution**: Verify your custom domain in Resend and update the `from` address

**Problem**: "User says they didn't receive email"
**Solution**: Check spam folder, verify email address, check Netlify logs for send errors

**Problem**: "Resend error 403"
**Solution**: You're using a custom domain that isn't verified yet. Use `onboarding@resend.dev` until verification completes

## 📦 Dependencies Added

- `resend`: ^4.0.1 (added to `artifacts/api-server/package.json`)

Run `pnpm install` in the workspace root to install the new dependency before deploying.

## ✅ Checklist for Production

- [ ] Create Resend account
- [ ] Get API key
- [ ] Add `RESEND_API_KEY` to Netlify environment variables
- [ ] Redeploy site
- [ ] Test signup email with non-admin account
- [ ] Test approval email by approving a user as admin
- [ ] (Optional) Verify custom domain in Resend
- [ ] (Optional) Update `from` addresses to custom domain
- [ ] Monitor email logs in Netlify and Resend dashboard

---

**Developed by Setons and Kirito** 🚀
