# Dependencies stage - prepare package.json without version for better caching
FROM node:22-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN node -e "const pkg=require('./package.json'); delete pkg.version; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Build stage
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install dependencies using version-less package.json
COPY --from=deps /app/package.json /app/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Copy the full package.json with version
COPY package.json ./

# Copy source files
COPY tsconfig.json svelte.config.js vite.config.ts ./
COPY src src
COPY static static

# Accept build arguments for public environment variables
ARG PUBLIC_CONVEX_URL
ARG PUBLIC_CONVEX_SITE_URL
ARG CONVEX_DEPLOY_KEY

# Set as environment variables for the build process
# ENV PUBLIC_CONVEX_URL=$PUBLIC_CONVEX_URL
# ENV PUBLIC_CONVEX_SITE_URL=$PUBLIC_CONVEX_SITE_URL

# Generate Convex types and build the application
RUN pnpm convex codegen
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy package files and install production dependencies only
COPY --from=deps /app/package.json /app/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

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
