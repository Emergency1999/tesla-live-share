# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Generate Convex types and build the application
RUN yarn convex codegen
RUN yarn build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built application
COPY --from=builder /app/build ./build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["node", "build"]
