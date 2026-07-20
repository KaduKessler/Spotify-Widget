# syntax=docker/dockerfile:1

# ---- Build stage: instala deps, compila admin (Vite) e backend (tsc) ----
FROM node:22-bookworm-slim AS build

# Toolchain nativo pra better-sqlite3/bcrypt + openssl (Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# prisma.config.ts exige a var setada só pra existir (não conecta em nada
# nesse estágio, é só pra gerar o client e compilar).
ENV DATABASE_URL=file:./data/db.sqlite

# Copia só os manifests primeiro pra aproveitar cache de layer do pnpm install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json backend/package.json
COPY admin/package.json admin/package.json

RUN pnpm install --frozen-lockfile

# Agora copia o código de verdade
COPY backend backend
COPY admin admin

RUN pnpm --filter ./backend exec prisma generate
RUN pnpm --filter ./backend build
RUN pnpm --filter ./admin exec tsc -b
# base=/admin/ porque o backend serve o build estático sob esse prefixo
RUN pnpm --filter ./admin exec vite build --base=/admin/

# ---- Runtime stage: só o necessário pra rodar ----
FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/docker-entrypoint.sh"]
