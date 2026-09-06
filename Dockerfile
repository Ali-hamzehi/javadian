# ========================================================
# Javadian Operations System - Production Multi-Stage Dockerfile
# Stage 1: Build static PWA application bundle
# Stage 2: Serve via Caddy Web Server with auto-HTTPS & HTTP/3
# ========================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Production Server ---
FROM caddy:2.9-alpine

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/caddy

# Copy custom Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Expose HTTP (80) and HTTPS (443)
EXPOSE 80 443

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
