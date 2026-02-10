# Dependencies stage - prepare package.json without version for better caching
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./
RUN node -e "const pkg=require('./package.json'); delete pkg.version; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies using version-less package.json
COPY --from=deps /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the full package.json with version
COPY package.json ./

# Copy source files
COPY tsconfig.json svelte.config.js vite.config.ts ./
COPY src src
COPY static static

# Generate Convex types and build the application
# RUN yarn convex codegen
RUN yarn build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY --from=deps /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built application
COPY --from=builder /app/build ./build

# Copy the full package.json with version
COPY package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["node", "build"]
