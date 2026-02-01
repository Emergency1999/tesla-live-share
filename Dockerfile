# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the application
CMD ["node", "build"]
