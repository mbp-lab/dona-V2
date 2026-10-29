# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mkdir -p public/sql-wasm

ENV HUSKY=0
# Keep the pnpm version in sync with "packageManager" in package.json
RUN npm install -g pnpm@12.15.0 && pnpm install --frozen-lockfile

# .env is excluded here and only mounted for the build below, so it does not end up in the image
COPY --exclude=.env . .

# Most settings are inlined by Next.js at build time. A bind mount (unlike a secret mount) makes
# Docker rebuild this step when .env changes, instead of reusing a build with the old settings.
RUN --mount=type=bind,source=.env,target=/app/.env pnpm build

EXPOSE 3000
