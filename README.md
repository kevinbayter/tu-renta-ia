# TuRenta AI

[![Licencia: PolyForm Noncommercial](https://img.shields.io/badge/licencia-PolyForm%20Noncommercial-blue)](LICENSE)

Plataforma de declaración de renta para personas naturales en Colombia: el usuario sube su exógena y certificados, la IA extrae los datos y conduce una entrevista, y un **motor fiscal 100% determinista** liquida el formulario 210.

> **La IA lee, el código calcula.** Los documentos se leen dos veces con IA y el usuario confirma cada valor; el impuesto lo calcula un motor auditado cuyas reglas citan la norma que las respalda ([`normativa/`](normativa/)).

**Licencia:** [PolyForm Noncommercial 1.0.0](LICENSE) — código disponible para uso personal, educativo, de investigación y sin ánimo de lucro. La explotación comercial está reservada al titular del copyright ([detalles](NOTICE.md)).

## Documentos clave

- [`PLAN-DESARROLLO.md`](PLAN-DESARROLLO.md) — plan por fases, arquitectura y reglas.
- [`normativa/`](normativa/README.md) — fuentes normativas por año gravable (respaldo de las constantes del motor).
- [`research/`](research/README.md) — investigación (normativa, exógena, legal, mercado, IA).

## Arquitectura (hexagonal)

```
apps/web  →  packages/core  →  packages/motor-fiscal   (dominio puro, cero deps)
                  ↑
      packages/adaptadores  (LLM OpenAI-compatible, parsers, BD, storage)
```

Las fronteras se hacen cumplir con ESLint (`no-restricted-imports`) **y** con tests de arquitectura (`test/arquitectura.test.ts`).

## Comandos

```bash
pnpm install
pnpm test          # tests de paquetes + tests de arquitectura
pnpm lint          # reglas estrictas (max-depth 1, 25 líneas/función, capas)
pnpm typecheck
pnpm smoke:llm     # prueba de humo del LLM (Kimi K3 vía OpenCode Go)

docker compose up -d                                    # Postgres (OrbStack, puerto 5433)
nohup bash scripts/servir.sh > /tmp/turenta-servir.log 2>&1 &   # app estable en :3210 (producción + auto-restart)
pnpm --filter web dev -- -p 3210                        # o modo desarrollo (hot reload)
```

⚠️ **Puerto 3210, no 3000**: el contenedor de Grafana en OrbStack publica el 3000 y mata/pelea el puerto cuando OrbStack se reinicia.

Secretos en `.env.local` (nunca se commitea). Variables: `OPENCODE_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` — cambiar de proveedor de IA es solo cambiar estas variables (adaptador OpenAI-compatible genérico).

## Despliegue (Docker / Dokploy)

La imagen de producción es un multi-stage con salida `standalone` de Next.js (~300 MB):

```bash
docker build -t turenta-ai .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://usuario:clave@host:5432/turenta" \
  -e AUTH_SECRET="cadena-aleatoria-de-32-caracteres-o-mas" \
  -e OPENCODE_API_KEY="..." \
  turenta-ai
```

Variables requeridas: `DATABASE_URL`, `AUTH_SECRET`. Opcionales: `OPENCODE_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` (extracción con IA), `BREVO_API_KEY` + `EMAIL_FROM_ADDRESS` (correos de OTP y vencimientos).

Antes del primer arranque, aplicar el esquema: `pnpm --filter @turenta/adaptadores db:push`.

## El golden test

`packages/motor-fiscal/test/caso-dorado.test.ts` reproduce una declaración real AG2025 elaborada con referencia, casilla por casilla. Es la garantía de exactitud del motor: **si un cambio lo rompe, el cambio está mal** (o hay una decisión normativa nueva que primero se documenta en `normativa/`).
