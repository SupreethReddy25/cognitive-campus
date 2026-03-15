# ── Cognitive Campus — Server Dockerfile ──
# Lightweight Node.js 18 Alpine image for production

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package.json package-lock.json ./

# Install production dependencies only (deterministic, fast)
RUN npm ci --only=production

# Copy rest of source code
COPY . .

# Expose API port
EXPOSE 5000

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Start the server
CMD ["node", "index.js"]
