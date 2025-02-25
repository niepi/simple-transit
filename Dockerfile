# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package.json .
RUN npm install -g npm@latest && \
    NODE_ENV=development npm install && \
    npm cache clean --force

ENV NODE_ENV=production

# Build application
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files and config
COPY --from=builder /app/dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Configure nginx
RUN rm -rf /var/cache/nginx/* && \
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

EXPOSE 80

USER nginx
CMD ["nginx", "-g", "daemon off;"]
