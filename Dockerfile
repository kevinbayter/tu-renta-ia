# TuRenta AI — imagen de producción (monorepo pnpm + Next.js standalone)
# Multi-stage: dependencias → build → runtime mínimo sin toolchain.

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# ---------- Dependencias ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/motor-fiscal/package.json packages/motor-fiscal/
COPY packages/core/package.json packages/core/
COPY packages/adaptadores/package.json packages/adaptadores/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
# El cliente de Prisma se genera en el build (no se versiona). La URL es un
# placeholder: generate solo lee el schema, no conecta a la base.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm --filter @turenta/adaptadores db:generate
RUN pnpm --filter web build

# ---------- Runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Salida standalone: server.js + solo las dependencias que realmente usa.
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
# Plantilla oficial del formulario 210 que usa el generador de borradores.
COPY --from=build --chown=nextjs:nodejs /app/packages/adaptadores/plantillas ./packages/adaptadores/plantillas

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
