### Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy only package manifests for caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/domain/package.json ./packages/domain/
COPY packages/agents/package.json ./packages/agents/
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/knowledge/package.json ./packages/knowledge/
COPY packages/reporting/package.json ./packages/reporting/
COPY packages/prompt-packets/package.json ./packages/prompt-packets/

# Install all deps (including devDeps needed for build)
RUN pnpm install

### Stage 2: Build
FROM deps AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY . .

# Pass environment variables for Vite build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build packages in dependency order
RUN pnpm --filter @cs/domain build
RUN pnpm --filter @cs/runtime build
RUN pnpm --filter @cs/knowledge build
RUN pnpm --filter @cs/agents build
RUN pnpm --filter @cs/reporting build
RUN pnpm --filter @cs/prompt-packets build
RUN pnpm --filter @cs/server build
RUN pnpm --filter @cs/web build

### Stage 3: Production API Server
FROM node:22-alpine AS server
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy only production dependencies and built artifacts
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-workspace.yaml .
COPY --from=builder /app/pnpm-lock.yaml .

COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/config ./config

# Install only production deps
RUN pnpm install --prod

# Ensure data directory exists for SQLite
RUN mkdir -p /app/data /app/data/projects

# Expose API port (matches config/ports.json)
EXPOSE 4311

# Runtime environment (override these in docker-compose or Kubernetes secrets)
ENV NODE_ENV=production
ENV CS_CORS_ORIGINS=http://localhost:4310

WORKDIR /app/apps/server
CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"]

### Stage 4: Web Frontend (served by nginx)
FROM nginx:alpine AS web
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Nginx config: SPA routing (all unknown paths -> index.html)
RUN printf 'server {\n  listen 4310;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}' > /etc/nginx/conf.d/default.conf

EXPOSE 4310
