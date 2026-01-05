# Quick Deploy Commands

## 1. Commit and Push to GitHub

```bash
cd "/Users/tomasslakotko/Library/Mobile Documents/com~apple~CloudDocs/bookthecall "

# Commit all changes
git add .
git commit -m "Initial commit - BookTheCall project"

# Create GitHub repo first at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/bookthecall.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. **IMPORTANT**: Set **Root Directory** to `web`
6. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `RESEND_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. Click "Deploy"

## 3. After Deployment

Update Google OAuth redirect URIs:
- `https://your-app.vercel.app/api/auth/callback/google`

Update `NEXTAUTH_URL` in Vercel:
- `https://your-app.vercel.app`

Run database migrations:
```bash
cd web
npx prisma migrate deploy
```

