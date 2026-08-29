# 🚀 Deploying JanBindu to Vercel with Neon PostgreSQL

Follow these straightforward steps to deploy **JanBindu** live to production on **Vercel** with a free **Neon Serverless PostgreSQL** database.

---

## 📋 Prerequisites
- A **GitHub** account
- A free **[Neon.tech](https://neon.tech)** account
- A free **[Vercel.com](https://vercel.com)** account

---

## Step 1: Create a Free Database on Neon

1. Go to **[https://neon.tech](https://neon.tech)** and sign in.
2. Click **Create Project**:
   - **Project name**: `janbindu`
   - **Postgres version**: `16` (Default)
   - **Region**: Choose the region closest to your target users (e.g., `AWS ap-south-1 Mumbai` or `AWS us-east-2`).
3. In the **Dashboard** / **Connection Details** screen:
   - Check the **Pooled connection** checkbox:
     - Copy this connection string &rarr; this will be your `DATABASE_URL`.
     - *(It looks like: `postgresql://neondb_owner:password@ep-xyz-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require`)*
   - Uncheck the **Pooled connection** checkbox (Direct connection):
     - Copy this connection string &rarr; this will be your `DIRECT_URL`.
     - *(It looks like: `postgresql://neondb_owner:password@ep-xyz.ap-south-1.aws.neon.tech/neondb?sslmode=require`)*

---

## Step 2: Push Your Code to GitHub

In your local project folder:

```bash
git init
git add .
git commit -m "feat: complete JanBindu Next.js fullstack platform"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/JanBindu.git
git push -u origin main
```

---

## Step 3: Deploy on Vercel

1. Log in to **[Vercel.com](https://vercel.com)**.
2. Click **Add New...** &rarr; **Project**.
3. Select your **JanBindu** GitHub repository and click **Import**.
4. In the **Configure Project** screen, expand **Environment Variables** and add the following 3 variables:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...-pooler...` | Pooled connection string from Neon |
| `DIRECT_URL` | `postgresql://...` (no -pooler) | Direct connection string from Neon |
| `JWT_SECRET` | `janbindu-super-secret-key-neon-2024-secure` | Auth signing secret |
| `CLOUDINARY_CLOUD_NAME` | `qj9klcxi` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | `869954752719738` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `6oyic_Z7KVLk1DjmUxxEtnOcs64` | Cloudinary API Secret |

5. *(Optional)* In **Build and Output Settings**, you can leave it as default or set the Build Command to:
   ```bash
   prisma generate && prisma db push && next build
   ```
6. Click **Deploy**.

Vercel will automatically build the Next.js app, connect to Neon, synchronize your Prisma database schema, and generate your live `.vercel.app` production URL!

---

## Step 4: Seed Initial Data on Neon (Optional)

To seed demo issues and accounts into your live Neon database:

1. In your local terminal, update your `.env` file with the Neon `DATABASE_URL` and `DIRECT_URL`.
2. Run:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```
3. Your live production database now has initial civic issues, ready for live testing!

---

## 🕒 Automated Cron Jobs (JanBindu Scoring)

The project includes `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/recalculate-scores",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
Vercel will automatically trigger the scoring recalculation every 10 minutes to decay old issues and adjust priorities based on recent activity.
