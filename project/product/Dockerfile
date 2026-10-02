FROM node:20-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Set working directory
WORKDIR /app

# Copy package manifests and workspace config first for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY .npmrc ./

# Copy all workspace package.json files (if any further caching needed)
COPY apps ./apps
COPY packages ./packages
COPY modules ./modules

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Default command: run all checks
CMD ["sh", "-c", "pnpm run lint && pnpm run typecheck && pnpm run test"]
