#!/bin/bash
# Supervisor de TuRenta AI para pruebas locales.
# Compila una vez y mantiene vivo `next start` en el puerto 3210 (el 3000 lo
# usa el contenedor de Grafana en OrbStack — conflicto documentado).
# Uso:  nohup bash scripts/servir.sh > /tmp/turenta-servir.log 2>&1 &

set -u
cd "$(dirname "$0")/.."
PUERTO="${PUERTO:-3210}"

echo "[servir] $(date '+%H:%M:%S') compilando…"
pnpm --filter web build || { echo "[servir] build falló"; exit 1; }

while true; do
  echo "[servir] $(date '+%H:%M:%S') arrancando next start en :$PUERTO"
  pnpm --filter web exec next start -p "$PUERTO"
  CODIGO=$?
  echo "[servir] $(date '+%H:%M:%S') el servidor terminó (código $CODIGO) — reinicio en 2s"
  sleep 2
done
