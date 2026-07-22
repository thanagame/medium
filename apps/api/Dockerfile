# build context = repo root
FROM node:22-bookworm-slim

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# ---- install deps (cached by manifests) ----
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install

# ---- copy sources & build ----
COPY packages/shared packages/shared
COPY apps/api apps/api

ARG DATABASE_URL="postgresql://ci:ci@localhost:5432/ci?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm --filter @repo/shared build \
  && pnpm --filter @repo/api exec prisma generate \
  && pnpm --filter @repo/api build

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3005

# ไม่รันเป็น root
USER node

# รัน migrate ก่อนแล้วค่อย start (prod)
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
