# API image. Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine

RUN npm install --global pnpm@11.5.2
WORKDIR /app

# Install production dependencies first, so this layer is cached until a manifest changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/data/package.json packages/data/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --prod --filter "@ffvii/api..."

# TypeScript runs directly on Node (docs/decisions/0003), so the source is the build.
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/api apps/api
COPY data data

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node

# The database is a derived copy of data/ (docs/decisions/0004): bring it up to date, then serve.
CMD ["sh", "-c", "node packages/db/src/cli/migrate.ts && node packages/db/src/cli/seed.ts data && node apps/api/src/server.ts"]
