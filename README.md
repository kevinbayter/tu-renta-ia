# tu-renta-ai

Plataforma de declaración de renta para personas naturales en Colombia (tipo referencia): el usuario sube su exógena y certificados, la IA extrae los datos y conduce una entrevista, y un **motor fiscal 100% determinista** liquida el formulario 210.

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

## El golden test

`packages/motor-fiscal/test/caso-dorado.test.ts` reproduce una declaración real AG2025 elaborada con referencia, casilla por casilla. Es la garantía de exactitud del motor: **si un cambio lo rompe, el cambio está mal** (o hay una decisión normativa nueva que primero se documenta en `normativa/`).
