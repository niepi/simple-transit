# Build stage
FROM node:25.7-alpine AS builder

WORKDIR /app

# NOTE: We intentionally do not run `apk update/upgrade` here.
# Base images are pinned; upgrading in Docker builds makes builds flaky when mirrors/DNS are unavailable.

# Install dependencies and build
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies with dev dependencies for build
# Configure retries/timeouts to reduce flakiness in CI.
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    NODE_ENV=development npm ci --legacy-peer-deps && \
    npm cache clean --force

ENV NODE_ENV=production

# Build application
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.29.5-alpine

# Copy built files and config
COPY --from=builder /app/dist /usr/share/nginx/html/
COPY nginx-custom.conf /etc/nginx/nginx.conf
COPY scripts/inject-runtime-env.sh /usr/local/bin/inject-runtime-env.sh
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# NOTE: We intentionally do not run `apk update/upgrade` here.
# Base images are pinned; upgrading in Docker builds makes builds flaky when mirrors/DNS are unavailable.

# Configure nginx and permissions
RUN mkdir -p /tmp && \
    chown -R nginx:nginx /tmp /var/cache/nginx /usr/share/nginx/html && \
    chmod -R 755 /tmp /var/cache/nginx /usr/share/nginx/html && \
    chmod +x /usr/local/bin/inject-runtime-env.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

USER nginx
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
