# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mkdir -p public/sql-wasm

ENV HUSKY=0
# Keep the pnpm version in sync with "packageManager" in package.json
RUN npm install -g pnpm@12.15.0 && pnpm install --frozen-lockfile

COPY . .

# Most settings are inlined by Next.js at build time. The .env file is mounted only for the
# build (see "secrets" in docker-compose.yml), so it does not end up in the image.
RUN --mount=type=secret,id=env,target=/app/.env,required=true pnpm build

EXPOSE 3000
