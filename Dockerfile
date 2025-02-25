# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Install all dependencies including dev dependencies for build
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build for production
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
