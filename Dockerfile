# Build stage
FROM node:24.3-alpine AS builder

# Accept version as build argument
ARG VERSION=dev
ENV VITE_APP_VERSION=${VERSION}

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
RUN echo "Building with version: ${VITE_APP_VERSION}" && npm run build

# Production stage
FROM nginx:1.29-alpine

# Copy built files and config
COPY --from=builder /app/dist /usr/share/nginx/html/
COPY nginx-custom.conf /etc/nginx/nginx.conf

# Configure nginx and permissions
RUN mkdir -p /tmp && \
    chown -R nginx:nginx /tmp /var/cache/nginx /usr/share/nginx/html && \
    chmod -R 755 /tmp /var/cache/nginx /usr/share/nginx/html

EXPOSE 80

USER nginx
CMD ["nginx", "-g", "daemon off;"]
