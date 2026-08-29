# JanBindu — Where Public Issues Become Priorities for Action

<p align="center">
  <img src="./public/logo.png" alt="JanBindu Logo" width="140" />
</p>

<p align="center">
  <strong>A digital platform to crowdsource societal challenges, rank civic priorities through intelligent algorithms, and facilitate swift collaborative resolution with municipal and government authorities.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</p>

---

## 📌 Problem Statement

In modern cities, public grievances (potholes, open drains, water leakage, non-functional streetlights, public safety hazards) often get lost in bureaucratic pipelines or social media noise. Authorities lack a centralized, transparent mechanism to identify which problems pose the highest immediate risk to citizens.

**JanBindu** solves this by combining **crowdsourced citizen reports**, **geolocation mapping**, and an automated **JanBindu Priority Algorithm** that weighs community engagement, urgency, density of nearby reports, and time decay to fast-track administrative action.

---

## 🌟 Key Features

1. **Civic Issue Reporting**:
   - Report issues with descriptions, category tags, urgency levels, and photo evidence.
   - Interactive **GPS pin-picker map** to tag exact coordinates and addresses.

2. **JanBindu Priority Scoring Algorithm**:
   - Ranks issues automatically based on community interactions, severity, geographic density, and recency.
   - Issues crossing the threshold ($\ge 50$ points) are **auto-escalated** to authorities.

3. **Live Civic Map**:
   - Interactive **Leaflet.js** map displaying reported issues with color-coded criticality markers (Green = Low, Yellow = Medium, Orange = High, Red = Critical).
   - Popups with direct links to issue details and status.

4. **Authority Action Portal**:
   - Dedicated dashboard for municipal officers to track escalated issues.
   - In-line status management (`Reported` &rarr; `Under Review` &rarr; `In Progress` &rarr; `Resolved`) with historical audit logs.

5. **Community Engagement & Discussion**:
   - Real-time upvoting and downvoting.
   - Threaded discussions for citizen updates and progress tracking.
   - One-click native link sharing.

---

## 🧠 The JanBindu Priority Algorithm

The **JanBindu Score** dynamically calculates the urgency of every issue:

$$\text{Score} = \Big[ \text{Interactions} + \text{Criticality Score} \Big] \times \text{Recency Multiplier} + \text{Density Bonus}$$

### 1. Community Interactions:
$$\text{Interactions} = (2 \times \text{Upvotes}) + (1.5 \times \text{Comments}) + (3 \times \text{Shares}) - (1 \times \text{Downvotes})$$

### 2. Criticality Weighting:
- **Low**: $1 \times 10 = 10\text{ pts}$
- **Medium**: $2 \times 10 = 20\text{ pts}$
- **High**: $4 \times 10 = 40\text{ pts}$
- **Critical**: $8 \times 10 = 80\text{ pts}$

### 3. Location Density Bonus:
If more than 5 issues are reported within a **~5km radius**:
$$\text{Density Bonus} = \log_2(\text{nearby count}) \times 5$$

### 4. Recency Decay:
Scores gradually decay over a 30-day window, maintaining a minimum 30% retention to ensure unresolved issues remain visible.

---

## 🏗️ System Architecture

```mermaid
graph TD
    UserClient[Citizen / Authority Web Browser] -->|HTTPS Requests| VercelEdge[Vercel CDN / Edge Network]

    subgraph Next.js 14 Fullstack App (App Router)
        VercelEdge -->|Server Components & SSR| AppPages[React UI: Feed, Map, Create, Authority]
        VercelEdge -->|REST API Requests /api/*| RouteHandlers[Next.js API Route Handlers]
        
        RouteHandlers -->|Auth Guards| JWTMiddleware[JWT & bcryptjs Auth]
        RouteHandlers -->|Scoring Engine| JanBinduAlgorithm[JanBindu Priority Algorithm]
        RouteHandlers -->|Type-safe ORM| PrismaSingleton[Prisma Client Singleton]
    end

    subgraph Database Tier
        PrismaSingleton -->|Pooled Connection| NeonPostgres[(Neon Serverless PostgreSQL / SQLite)]
    end

    subgraph Scheduled Automation
        VercelCron[Vercel Cron Trigger] -->|GET /api/cron/recalculate-scores| JanBinduAlgorithm
    end
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router)** | Fullstack React framework with SSR, ISR & Client Components |
| **Language** | **TypeScript** | Strict static typing across models, APIs, and UI |
| **Styling** | **Tailwind CSS** | Modern glassmorphism UI & responsive design system |
| **Icons** | **Lucide React** | Clean, accessible iconography |
| **ORM** | **Prisma ORM (v5.x)** | Type-safe schema migrations & query builder |
| **Database** | **Neon PostgreSQL** / **SQLite** | Cloud-native serverless relational database |
| **Auth** | **JWT (`jsonwebtoken`) + `bcryptjs`** | Stateless authentication with role-based access |
| **Mapping** | **Leaflet.js + React-Leaflet** | Open-source interactive geospatial map & pin picker |
| **Hosting** | **Vercel** | Automated CI/CD deployment with Edge CDN |

---

## 📂 Project Structure

```text
JanBindu/
├── prisma/
│   ├── schema.prisma            # Prisma database models (User, Post, Vote, Comment, StatusUpdate)
│   └── seed.js                  # Sample data seeder
├── public/
│   └── logo.png                 # JanBindu logo
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # Serverless REST API route handlers
│   │   │   ├── auth/            # /register, /login, /me
│   │   │   ├── posts/           # CRUD, /vote, /comment, /share
│   │   │   ├── authority/       # /stats, /issues, /issues/[id]/status
│   │   │   └── cron/            # /recalculate-scores
│   │   ├── feed/                # Issues feed with filters & sort tabs
│   │   ├── map/                 # Fullscreen interactive civic map
│   │   ├── create/              # Issue reporting form with map picker
│   │   ├── post/[id]/           # Issue detail page & discussion thread
│   │   ├── authority/           # Authority KPI dashboard & action queue
│   │   ├── profile/             # Citizen profile & reported issue history
│   │   ├── login/               # Sign in page
│   │   ├── register/            # Sign up page (Citizen / Authority)
│   │   ├── layout.tsx           # Root layout with Navbar & Toaster
│   │   ├── page.tsx             # High-converting landing page
│   │   └── globals.css          # Tailwind & Leaflet styles
│   ├── components/              # Navbar, PostCard, StatusBadge, CategoryBadge, MapComponent
│   ├── context/                 # AuthContext (JWT session management)
│   └── lib/                     # Prisma singleton, JWT auth helpers, JanBindu algorithm
├── .env.example                 # Environment variables template
├── package.json                 # Project dependencies & build scripts
├── tailwind.config.ts           # Tailwind theme & color config
└── tsconfig.json                # TypeScript compiler configuration
```

---

## ⚡ Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd JanBindu
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
DATABASE_URL="file:./dev.db" # Local SQLite or Neon PostgreSQL connection string
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize & Seed Database
```bash
# Push schema to database
npx prisma db push

# Seed sample issues and test accounts
node prisma/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 Demo Test Accounts

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@janbindu.in` | `citizen123` | Report civic issues, vote, comment, explore interactive map |
| **Authority** | `authority@janbindu.in` | `authority123` | Access `/authority` dashboard, review escalated issues, update resolution status |

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new Citizen or Authority account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Fetch authenticated user profile
- `PUT /api/auth/me` — Update user profile details

### Posts & Issues
- `GET /api/posts?sort=trending&category=roads&status=reported&page=1` — List & filter issues
- `POST /api/posts` — Create a new issue report
- `GET /api/posts/:id` — Get single issue details, images, comments & audit history
- `POST /api/posts/:id/vote` — Upvote / downvote an issue (recalculates score)
- `POST /api/posts/:id/comment` — Post a citizen comment
- `POST /api/posts/:id/share` — Record a share event
- `DELETE /api/posts/:id` — Delete issue (author or admin only)

### Authority Actions
- `GET /api/authority/stats` — High-level KPI metrics & category distribution
- `GET /api/authority/issues` — Fetch escalated issues ($\text{score} \ge 50$)
- `PATCH /api/authority/issues/:id/status` — Update issue status with audit note

### Automation
- `GET /api/cron/recalculate-scores` — Triggered by Vercel Cron to refresh priority scores with recency decay

---

## 🚀 Deploying to Vercel + Neon Postgres

1. Push your repository to **GitHub**.
2. Create a free PostgreSQL database on [Neon.tech](https://neon.tech).
3. Import the repository into [Vercel](https://vercel.com).
4. Add the following **Environment Variables** in Vercel settings:
   - `DATABASE_URL`: Your pooled Neon connection string (`-pooler` endpoint)
   - `DIRECT_URL`: Your direct Neon connection string
   - `JWT_SECRET`: A secure random string
5. Deploy! Vercel will automatically run `prisma generate && next build`.

---

## 📄 License

This project is open-source and built for social good under the **MIT License**.
