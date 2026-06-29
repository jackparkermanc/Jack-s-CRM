# Quick Start Deployment Guide

## Deploy to Vercel in 5 Minutes

### Step 1: Prepare Your Code
```bash
cd /workspaces/Jack-s-CRM
git init
git add .
git commit -m "Initial React + Vercel CRM"
```

### Step 2: Push to GitHub
```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B: Vercel Web Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Click "Deploy"

### Step 4: Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_ULTRAMSG_INSTANCE=instance123456
VITE_ULTRAMSG_TOKEN=your_token_here
```

### Step 5: Trigger Redeploy
```bash
vercel --prod
```

✅ Your app is now live! 🎉

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Click Settings → API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon Public Key → `VITE_SUPABASE_ANON_KEY`

## Getting UltraMsg Credentials

1. Sign up at [ultramsg.com](https://ultramsg.com)
2. Go to Dashboard
3. Copy Instance ID and API Token
4. Add to Vercel environment variables

## Verify Deployment

After deployment:
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try adding a contact
3. Check Supabase dashboard to confirm data is saved
4. Test the WhatsApp webhook by visiting `/api/whatsapp` (should return 405)

## Troubleshooting

### "Supabase credentials missing"
- Verify environment variables are set in Vercel
- Redeploy after adding environment variables
- Check that variable names match exactly (case-sensitive)

### "Cannot connect to API"
- Ensure build succeeded (check Vercel logs)
- Verify `/api` routes are present
- Check CORS is enabled in browser dev tools

### "WhatsApp not working"
- Confirm UltraMsg webhook URL is set to `/api/whatsapp`
- Test by sending a message to your instance number

## Monitoring

Monitor your app health:
- Vercel Analytics: https://vercel.com/analytics
- Supabase Dashboard: Activity tab
- Application Logs: `/logs` tab in your app

## Updates

To update your app:
```bash
git add .
git commit -m "Update features"
git push origin main
# Vercel automatically redeploys!
```

## Support

- React Docs: https://react.dev
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
