# Showroom/Dealer SaaS

Aplikasi multi-tenant untuk pengelolaan showroom/dealer kendaraan.

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Auth**: NextAuth.js (JWT)

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Setup database
# Edit .env with your MySQL credentials
cp .env.example .env

# Push schema + seed demo data
npm run db:push
npm run db:seed

# Run development server
npm run dev
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@showroom.com | admin123 |
| Owner | owner@demo-dealer.com | owner123 |
| Sales | sales@demo-dealer.com | sales123 |

## Deployment (Coolify)

### 1. Create Resource
- New Resource → Docker → Git Repository
- Repository: `https://github.com/dhikoh/dealer-saas`
- Branch: `master`

### 2. Environment Variables
```
DATABASE_URL=mysql://user:pass@mysql-host:3306/dealer_saas
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### 3. Build Settings
- Build Pack: **Dockerfile**
- Port: **3000**

### 4. After Deploy
Run database migration:
```bash
npx prisma db push
npx prisma db seed
```

## Features

- ✅ Multi-tenant (dealer isolation)
- ✅ Vehicle CRUD with photos
- ✅ Vehicle Legal (STNK, BPKB)
- ✅ Vehicle Condition (grading)
- ✅ Sales Draft & Transaction
- ✅ Credit Simulation
- ✅ PDF Export (Quotation, SPK, Invoice)
- ✅ Commission & Payout tracking

## License

Private - All rights reserved
