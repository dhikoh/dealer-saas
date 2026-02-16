# ==================== BUILD STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL — required by Prisma to detect engine binary target
RUN apk add --no-cache openssl

# Copy dependency manifests first (layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (dev needed for build tools)
RUN npm ci

# Generate Prisma Client (needs openssl to detect libssl version)
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# ==================== PRODUCTION STAGE ====================
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL (required by Prisma) and dumb-init (proper PID 1)
RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production artifacts from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
# NOTE: scripts/ intentionally NOT copied — not needed in production

# Switch to non-root user
USER appuser

# Expose port (configurable at runtime via PORT env var)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# NOTE: All secrets (JWT_SECRET, DATABASE_URL, etc.) must be injected
# at RUNTIME via environment variables (docker run -e, docker-compose, Coolify, etc.)
# NEVER bake secrets into the image via ARG or ENV.

# Use dumb-init for proper signal handling, run migration then start
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/main.js"]
