# BookTheCall - Deployment Guide

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
```bash
cd "/Users/tomasslakotko/Library/Mobile Documents/com~apple~CloudDocs/bookthecall "
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `bookthecall`)
   - **DO NOT** initialize with README, .gitignore, or license

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/bookthecall.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web` (IMPORTANT!)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install`

5. **Environment Variables**:
   Add all your `.env` variables in Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (will be auto-set, but you can override)
   - `RESEND_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_BASE_URL` (optional, Vercel sets this automatically)

6. **Important Settings**:
   - **Node.js Version**: 18.x or 20.x
   - **Environment**: Production

7. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### Step 3: Update Google OAuth Settings

After deployment, update Google Cloud Console:

1. **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   ```

2. **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

3. **Update NEXTAUTH_URL in Vercel**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Set `NEXTAUTH_URL=https://your-app.vercel.app`

### Step 4: Database Migration

After first deployment, run migrations:

1. **Option 1: Via Vercel CLI**:
```bash
npm i -g vercel
vercel login
cd web
vercel env pull .env.local
npx prisma migrate deploy
```

2. **Option 2: Direct connection**:
   - Use your database connection string
   - Run: `npx prisma migrate deploy`

### Step 5: Verify Deployment

1. Check if app loads: `https://your-app.vercel.app`
2. Test sign up / sign in
3. Test Google Calendar connection
4. Check logs in Vercel dashboard for errors

## 📝 Important Notes

- **Root Directory**: Must be set to `web` in Vercel settings
- **Environment Variables**: Never commit `.env` file
- **Database**: Make sure your database allows connections from Vercel IPs
- **Google OAuth**: Update redirect URIs after getting Vercel URL
- **Email**: Update `RESEND_FROM_EMAIL` if using custom domain

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Check if all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` is correct in Vercel
- Check if database allows external connections
- For Supabase: Use Session Pooler connection string

### OAuth Not Working
- Verify redirect URIs match exactly
- Check `NEXTAUTH_URL` in Vercel environment variables
- Make sure domain is added to Google OAuth settings

## 🎉 After Deployment

Your app will be available at: `https://your-app.vercel.app`

Vercel automatically:
- Provides HTTPS
- Handles CDN
- Auto-deploys on git push
- Provides preview deployments for PRs

