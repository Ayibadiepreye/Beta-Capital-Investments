# 🚀 Vercel Migration Guide

## ✅ What's Been Done

All code changes for Vercel compatibility have been completed:

### Files Created:
1. ✅ `vercel.json` - Vercel configuration
2. ✅ `api/index.ts` - Vercel serverless function handler
3. ✅ `.vercelignore` - Files to exclude from deployment
4. ✅ Updated `.gitignore` - Added Vercel entries

### Files Modified:
1. ✅ `artifacts/api-server/src/index.ts` - Now exports app for Vercel
2. ✅ `package.json` - Added `@vercel/node` and `vercel` CLI

---

## 📋 What YOU Need To Do

### Step 1: Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Or if you don't want global install, use npx
npx vercel --version
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate with Vercel.

### Step 3: Link Your Project

```bash
cd "C:\Users\Hello\Downloads\Alphavest\Serverless-Finance44"
vercel link
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your Vercel account
- **Link to existing project?** → No (first time)
- **Project name?** → `bettercapitalinvestments` (or your choice)
- **Directory?** → `.` (current directory)

### Step 4: Add Environment Variables

You need to add all your environment variables to Vercel. Run this for EACH variable:

```bash
vercel env add <VARIABLE_NAME>
```

**Required Environment Variables:**
```
DATABASE_URL
SESSION_SECRET
ADMIN_EMAILS
RESEND_API_KEY
EMAIL_FROM
FRONTEND_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```

**Optional (if you're still using them):**
```
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
MONNIFY_API_KEY
MONNIFY_SECRET_KEY
MONNIFY_CONTRACT_CODE
MONNIFY_BASE_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

**OR** add them through Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable for **Production**, **Preview**, and **Development**

### Step 5: Deploy to Vercel

```bash
# Install dependencies first
pnpm install

# Deploy to production
vercel --prod
```

The first deployment might take 3-5 minutes.

---

## 🔧 Testing Locally with Vercel

Before deploying, test locally:

```bash
# Install dependencies (if you haven't)
pnpm install

# Run Vercel dev server
vercel dev
```

This starts a local server that mimics Vercel's environment.

Test your API:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/...

---

## 📊 Vercel vs Netlify Differences

| Feature | Netlify (Before) | Vercel (Now) |
|---------|------------------|--------------|
| Functions Location | `netlify/functions/` | `api/` |
| Config File | `netlify.toml` | `vercel.json` |
| Function Handler | `serverless-http` wrapper | Direct Express export |
| Build Command | In `netlify.toml` | In `vercel.json` |
| Env Variables | Netlify Dashboard | Vercel Dashboard or CLI |

---

## 🌐 Update Frontend API URL

After deployment, Vercel will give you a URL like:
```
https://bettercapitalinvestments.vercel.app
```

Make sure your frontend API calls point to the correct URL. Check:
- `FRONTEND_URL` environment variable
- `GOOGLE_CALLBACK_URL` environment variable
- Any hardcoded API URLs

---

## 🐛 Troubleshooting

### Build Fails
**Error**: `Cannot find module '@vercel/node'`
**Solution**: Run `pnpm install` to install new dependencies

### API Returns 404
**Error**: `/api/*` routes return 404
**Solution**: 
1. Check `vercel.json` routes configuration
2. Ensure `api/index.ts` exists
3. Redeploy with `vercel --prod`

### Environment Variables Not Working
**Error**: Database connection fails, auth doesn't work
**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Make sure all variables are added for **Production**
3. Redeploy after adding variables

### Cold Start Issues
**Problem**: First request is slow
**Solution**: This is normal for serverless. Vercel has better cold starts than Netlify. Consider:
- Using Vercel Pro for faster cold starts
- Implementing connection pooling (already done with pg)

---

## 🎯 Post-Migration Checklist

After successful deployment:

- [ ] Test user signup
- [ ] Test user login
- [ ] Test admin dashboard
- [ ] Test deposits (if using payment APIs)
- [ ] Test withdrawals
- [ ] Test email notifications
- [ ] Check database connections
- [ ] Verify session persistence
- [ ] Test all API endpoints
- [ ] Update DNS (if using custom domain)
- [ ] Update OAuth redirect URLs (Google, etc.)

---

## 🔗 Custom Domain Setup (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `bettercapitalinvestments.com`)
3. Vercel will provide DNS records
4. Add records to your domain registrar:
   - Type: `A` or `CNAME`
   - Value: Provided by Vercel
5. Wait for DNS propagation (5-30 minutes)
6. Vercel will auto-provision SSL certificate

---

## 📈 Performance Benefits You'll Get

- ✅ **Faster cold starts** (~200-500ms vs 1-2s on Netlify)
- ✅ **Better caching** at edge locations worldwide
- ✅ **Automatic HTTPS** with Let's Encrypt
- ✅ **Better DX** with preview deployments for every PR
- ✅ **Built-in analytics** (on Pro plan)
- ✅ **Edge functions** (if you want to use them later)

---

## 💰 Pricing Comparison

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Serverless Functions: 100GB-hours
- Unlimited team members (Hobby)

**Vercel Pro ($20/month):**
- 1TB bandwidth
- Faster builds
- Better support
- Advanced analytics
- Team collaboration features

---

## 🚨 Important Notes

1. **Keep Netlify Running** until you've fully tested Vercel
2. **Database stays the same** - no migration needed
3. **Sessions will reset** on first deploy (users need to re-login)
4. **Update OAuth callbacks** in Google Console to new Vercel URL
5. **Git push auto-deploys** - each push to `main` deploys to production

---

## 🆘 Need Help?

**Vercel Docs:**
- https://vercel.com/docs
- https://vercel.com/docs/functions/serverless-functions

**Vercel Support:**
- Community: https://github.com/vercel/vercel/discussions
- Twitter: @vercel

**Common Issues:**
- https://vercel.com/guides

---

## 🎉 You're Ready!

Run these commands to deploy:

```bash
# 1. Install dependencies
pnpm install

# 2. Login to Vercel
vercel login

# 3. Deploy!
vercel --prod
```

Good luck! 🚀

---

**Developed by Setons and Kirito**
