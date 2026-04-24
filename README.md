# Booqd — Beauty Service Connection Platform
### BSc Final Year Project · FUPRE · 2026

A web-based platform connecting clients with beauty service providers in Nigeria.  
Built with **Next.js 14**, **PostgreSQL (Neon)**, **Prisma ORM**, and **Tailwind CSS**.  
Deployed on **Vercel** (free tier).

---

## Live Demo

Once deployed, your demo credentials are:
| Role | Email | Password |
|------|-------|----------|
| Client | client@booqd.ng | password123 |
| Provider | zara@booqd.ng | password123 |
| Admin | admin@booqd.ng | admin1234 |

---

## Deployment Guide (Step-by-Step)

### Step 1 — Set up your database (Neon PostgreSQL — free)

1. Go to **https://neon.tech** and create a free account
2. Click **New Project** → name it `booqd`
3. Select the **Frankfurt** or **US East** region
4. Once created, click **Connection Details**
5. Copy the two connection strings:
   - **Connection string** → this is your `DATABASE_URL`
   - **Direct connection** → this is your `DIRECT_URL`

They look like:
```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

---

### Step 2 — Push your code to GitHub

```bash
# In the project folder
git init
git add .
git commit -m "Initial commit — Booqd beauty platform"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/booqd.git
git push -u origin main
```

---

### Step 3 — Deploy to Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **Add New Project** → select your `beauty-platform` repo
3. Vercel will auto-detect it as a Next.js project
4. Under **Environment Variables**, add these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `DIRECT_URL` | Your Neon direct connection string |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://beauty-platform.vercel.app`) |

5. Click **Deploy** — Vercel will build and deploy automatically

---

### Step 4 — Set up the database schema

Once deployed, go to your Vercel project dashboard:

1. Click **Functions** tab → open a terminal, OR
2. Use the **Vercel CLI** locally:

```bash
npm i -g vercel
vercel login
vercel env pull .env.local   # pulls your env vars locally
npx prisma db push           # creates all tables in Neon
node prisma/seed.js          # seeds demo data
```

Or run the seed from Vercel's dashboard using a one-time function.

---

### Step 5 — Verify deployment

Visit your Vercel URL. You should see:
- ✅ Home page with hero section and featured providers
- ✅ Search page with filters
- ✅ Provider profiles with booking form
- ✅ Provider dashboard (login as zara@booqd.ng)
- ✅ Admin panel (login as admin@booqd.ng)

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/booqd.git
cd beauty-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Neon database URLs

# 4. Set up database
npx prisma db push
node prisma/seed.js

# 5. Run development server
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
beauty-platform/
├── app/
│   ├── page.js                    # Home page
│   ├── layout.js                  # Root layout
│   ├── globals.css                # Global styles
│   ├── search/page.js             # Service search
│   ├── providers/[id]/
│   │   ├── page.js                # Provider profile
│   │   └── BookingForm.js         # Booking form (client)
│   ├── provider/
│   │   ├── page.js                # Provider dashboard
│   │   └── ProviderDashboardClient.js
│   ├── admin/page.js              # Admin panel
│   ├── (auth)/
│   │   ├── login/page.js
│   │   └── register/page.js
│   └── api/
│       ├── auth/
│       │   ├── register/route.js  # POST /api/auth/register
│       │   ├── login/route.js     # POST /api/auth/login
│       │   └── logout/route.js    # POST /api/auth/logout
│       ├── appointments/
│       │   ├── route.js           # GET, POST /api/appointments
│       │   └── [id]/route.js      # PATCH /api/appointments/:id
│       └── services/
│           ├── route.js           # POST /api/services
│           └── [id]/route.js      # DELETE /api/services/:id
├── components/
│   └── layout/Navbar.js
├── lib/
│   ├── prisma.js                  # Prisma client singleton
│   └── auth.js                    # JWT sign/verify/session
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.js                    # Demo data seed
├── middleware.js                  # Route protection
├── vercel.json
└── .env.example
```

---

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 14 App Router | SSR + client components, Vercel-native |
| Styling | Tailwind CSS | Rapid, responsive UI development |
| Backend | Next.js API Routes (serverless) | No separate server required for Vercel |
| Database | PostgreSQL via Neon | Free tier, Vercel-compatible, relational |
| ORM | Prisma | Type-safe queries, schema migration, seeding |
| Auth | JWT + httpOnly cookies | Secure, stateless authentication |
| Deployment | Vercel | Free tier, automatic CI/CD from GitHub |

---

## Key Features

- **Service discovery** — search and filter providers by category, location, and keyword
- **Provider profiles** — business info, services with pricing, portfolio gallery
- **Appointment booking** — date/time selection with server-side conflict detection
- **Provider dashboard** — manage bookings (confirm/decline/complete), services, portfolio
- **Admin panel** — platform statistics, user management, provider verification
- **Security** — bcrypt password hashing, JWT sessions, SQL injection prevention via Prisma

---

## Notes for Thesis Documentation

The system was designed using PHP/MySQL as specified in the thesis. For live deployment, Next.js (Node.js) and PostgreSQL were used due to their native compatibility with the Vercel hosting platform. The database schema, entity relationships, security architecture, and functional requirements described in the thesis are fully implemented — only the server-side language and hosting environment differ from the design specification. All five tables (Users, Providers, Services, Appointments, Portfolios) are implemented as specified in Chapter 3.
