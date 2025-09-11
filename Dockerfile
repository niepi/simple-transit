# Build stage
FROM node:24.8-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies with dev dependencies for build
RUN npm install -g npm@latest && \
    NODE_ENV=development npm install --legacy-peer-deps && \
    npm cache clean --force

ENV NODE_ENV=production

# Build application
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.29.1-alpine

# Copy built files and config
COPY --from=builder /app/dist /usr/share/nginx/html/
COPY nginx-custom.conf /etc/nginx/nginx.conf
COPY scripts/inject-runtime-env.sh /usr/local/bin/inject-runtime-env.sh
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Configure nginx and permissions
RUN mkdir -p /tmp && \
    chown -R nginx:nginx /tmp /var/cache/nginx /usr/share/nginx/html && \
    chmod -R 755 /tmp /var/cache/nginx /usr/share/nginx/html && \
    chmod +x /usr/local/bin/inject-runtime-env.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

USER nginx
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
