# OTOHUB Deployment Guide for scr.modula.click

## Pre-Deployment Checklist

### 1. Environment Variables
Before deploying, make sure to set up your `.env` file:

```bash
# Copy example and edit
cp backend/.env.example backend/.env

# Required variables:
DATABASE_URL="postgresql://otohub:YOUR_PASSWORD@localhost:5432/otohub"
JWT_SECRET="minimum-32-character-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
CORS_ORIGINS="https://scr.modula.click"
```

### 2. Switch to PostgreSQL Schema
```bash
cd backend
# Backup current SQLite schema
mv prisma/schema.prisma prisma/schema.sqlite.prisma

# Use PostgreSQL schema
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Generate client and create migration
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Seed Superadmin
```bash
npx ts-node prisma/seed.ts
```

---

## Deployment Options

### Option A: Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option B: Manual Deployment

#### Backend
```bash
cd backend
npm ci --production
npm run build
npx prisma migrate deploy
node dist/main.js
```

#### Frontend
```bash
cd frontend
npm ci
npm run build
npm start
```

---

## Domain Configuration for scr.modula.click

### DNS Records
| Type | Name | Value |
|------|------|-------|
| A | scr | YOUR_VPS_IP |
| A | api.scr | YOUR_VPS_IP |

### Nginx Configuration (if not using Coolify)
```nginx
# Frontend: scr.modula.click
server {
    listen 80;
    server_name scr.modula.click;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

# Backend: api.scr.modula.click
server {
    listen 80;
    server_name api.scr.modula.click;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://api.scr.modula.click/health
```

### 2. Test Registration Flow
1. Open https://scr.modula.click
2. Register new account → Should receive OTP email
3. Verify OTP → Should redirect to onboarding
4. Complete onboarding → Should access dashboard

### 3. Login Credentials
| Role | Email | Password |
|------|-------|----------|
| **SUPERADMIN** | superadmin@otohub.id | superadmin123 |
| OWNER (Demo) | demo@otohub.id | demo123 |

---

## Troubleshooting

### SMTP Issues
- For Gmail: Enable 2FA and create App Password
- Check firewall allows port 587 outbound
- Test with: `telnet smtp.gmail.com 587`

### Database Connection
```bash
# Test PostgreSQL connection
psql -h localhost -U otohub -d otohub

# View Prisma migration status
npx prisma migrate status
```

### SSL Certificate (Let's Encrypt)
```bash
certbot --nginx -d scr.modula.click -d api.scr.modula.click
```
