# ==================== BUILD STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL — required by Prisma to detect engine binary target
RUN apk add --no-cache openssl

# Copy dependency manifests first (layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# CRITICAL: Force development mode so devDependencies (@nestjs/cli, typescript, etc.)
# are installed. Without this, Coolify/Docker may inherit NODE_ENV=production from
# the host or runtime config, causing npm ci to skip devDependencies → "nest: not found".
ENV NODE_ENV=development
RUN npm ci

# Generate Prisma Client (needs openssl to detect libssl version)
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# ==================== PRODUCTION STAGE ====================
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL (required by Prisma) and dumb-init (proper PID 1)
RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production artifacts from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./

# Install ONLY production dependencies in the final image
ENV NODE_ENV=production
RUN npm ci --omit=dev && npx prisma generate

# Create uploads directory BEFORE switching to non-root user
RUN mkdir -p ./uploads && chown -R appuser:appgroup ./uploads

# Switch to non-root user
USER appuser

# Expose port (configurable at runtime via PORT env var)
EXPOSE 4000

# Health check (start-period=30s to allow prisma db push + Nest bootstrap)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# NOTE: All secrets (JWT_SECRET, DATABASE_URL, etc.) must be injected
# at RUNTIME via environment variables (docker run -e, docker-compose, Coolify, etc.)
# NEVER bake secrets into the image via ARG or ENV.

# Use dumb-init for proper signal handling, run migration then start
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/main.js"]
