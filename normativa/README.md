# Normativa por año gravable

Respaldo documental humano del motor fiscal. Cada subcarpeta `agYYYY/` contiene las normas, valores y reglas que sustentan el archivo de constantes correspondiente (`packages/motor-fiscal/src/constantes/agYYYY.ts`).

**Regla de oro**: ningún valor entra a `constantes/agYYYY.ts` sin estar documentado aquí con su fuente normativa (ley, decreto, resolución o concepto). Si la DIAN o el Congreso cambian algo, primero se documenta aquí, luego se actualiza la constante, y el cambio debe romper/actualizar golden tests.

## Estructura por año

```
normativa/
└── ag2025/
    ├── 01-fuentes-normativas.md    # leyes/decretos/resoluciones aplicables y su estado
    ├── 02-constantes.md            # todos los valores (UVT, topes, tarifas) con fuente
    └── 03-calendario.md            # vencimientos por dígitos de cédula
```

## Años disponibles

| Año gravable      | Se declara en          | Estado                    |
| ----------------- | ---------------------- | ------------------------- |
| [AG2025](ag2025/) | 2026 (12-ago → 26-oct) | ✅ Vigente — base del MVP |

Investigación extendida (mercado, legal, exógena, IA): ver [`research/`](../research/README.md).
