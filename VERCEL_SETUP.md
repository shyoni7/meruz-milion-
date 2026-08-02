# Vercel Deployment Setup Guide

This project has been adapted for independent deployment on Vercel.
All Manus-specific infrastructure has been replaced with standard services.

---

## Required Environment Variables

Set these in the Vercel dashboard under **Settings → Environment Variables**:

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | PlanetScale / TiDB Cloud / Railway |
| `JWT_SECRET` | Admin JWT signing secret (any 32+ char random string) | Generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | OpenAI API key for slideshow captions | https://platform.openai.com/api-keys |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | https://cloudinary.com (free tier) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary dashboard |

---

## Database Setup

1. Create a free MySQL database at one of:
   - **PlanetScale** (https://planetscale.com) — recommended, MySQL-compatible
   - **TiDB Cloud Serverless** (https://tidbcloud.com) — free tier, MySQL-compatible
   - **Railway** (https://railway.app) — free tier, MySQL

2. Copy the connection string and set it as `DATABASE_URL`

3. Run the database migration once:
   ```bash
   pnpm db:push
   ```

4. Create an admin user via the Vercel deployment URL:
   - Visit `/admin` and log in with the default credentials
   - Or run the seed script: `pnpm tsx scripts/seed-admin.ts`

---

## Cloudinary Setup

1. Sign up at https://cloudinary.com (free tier: 25 GB storage, 25 GB bandwidth/month)
2. Go to **Dashboard** → copy **Cloud Name**, **API Key**, **API Secret**
3. Set the three `CLOUDINARY_*` environment variables in Vercel

**Note:** Photos uploaded during the game are stored directly in Cloudinary as public CDN URLs.
No proxy server is needed — images load directly from Cloudinary's CDN.

---

## OpenAI Setup

1. Get an API key at https://platform.openai.com/api-keys
2. Set `OPENAI_API_KEY` in Vercel
3. The slideshow uses `gpt-4o-mini` to generate witty Hebrew captions per photo

---

## Vercel Deployment Steps

1. Push this repo to GitHub (already done)
2. Go to https://vercel.com and click **Add New Project**
3. Import the GitHub repo `shyoni7/meruz-milion-`
4. Set all environment variables listed above
5. Click **Deploy**

Vercel will automatically:
- Run `pnpm install && pnpm build`
- Build the React frontend with Vite
- Deploy the Express API as a serverless function
- Route `/api/*` to the serverless function, all other routes to the SPA

---

## Architecture After Migration

| Layer | Before (Manus) | After (Vercel) |
|---|---|---|
| Hosting | Manus WebDev | Vercel Serverless |
| Database | Manus-managed MySQL | User-provided MySQL |
| File Storage | Manus Forge S3 | Cloudinary CDN |
| LLM (captions) | Manus Forge API | OpenAI API directly |
| Auth (game) | Phone + name registration | Same (unchanged) |
| Auth (admin) | Username + password JWT | Same (unchanged) |

---

## Notes

- **Existing data**: Game data in the Manus-managed database is NOT migrated automatically.
  The new deployment starts with a fresh database.
- **Existing photos**: Photos uploaded to Manus S3 are not accessible after migration.
  Only new uploads go to Cloudinary.
- **Vercel cold starts**: The first request after inactivity may take ~200ms longer.
- **Image upload size**: Vercel serverless functions have a 4.5 MB request body limit.
  If photos are large, consider enabling direct Cloudinary upload from the frontend.
