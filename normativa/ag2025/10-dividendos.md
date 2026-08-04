# Dividendos de personas naturales residentes — base de la Fase 4

Verificado 2026-08-04. Régimen de la Ley 2277/2022 intacto (la propuesta de eliminar
el descuento 254-1 se hundió con la reforma de dic-2025).

## Art. 242 (mod. art. 3, Ley 2277)

- Dividendos de utilidades **no gravadas** en cabeza de la sociedad (num. 3 art. 49):
  **integran la base gravable general** y tributan con la **tabla del art. 241**.
- Dividendos de utilidades **gravadas** (par. 2 art. 49) y de sociedades extranjeras:
  primero tarifa del art. 240 (35%) y el neto va a la tabla.
- Retención en la fuente: 0% hasta 1.090 UVT; **15% marginal sobre el exceso**,
  imputable en la declaración (reglamento: Decreto 1103/2023, desde utilidades 2017
  no exigibles a 31-12-2022).

## Art. 254-1 (adicionado por art. 5, Ley 2277) — descuento tributario

- 0% hasta 1.090 UVT de renta líquida cedular de dividendos.
- **19% marginal sobre el exceso**: (renta cedular de dividendos en UVT − 1.090) × 19%.

## Decisiones de implementación

- Casillas verificadas: **107** = 1ª subcédula 2017+ (num. 3 art. 49, no gravados) y
  **108** = 2ª subcédula (par. 2 art. 49, gravados). La 121 suma tabla + 35%.
- El descuento 254-1 se calcula SOLO sobre la 1ª subcédula (lectura conservadora del
  texto, que remite a los dividendos gravados vía tabla del inciso 1 del 242); no está
  sujeto al tope del art. 258 (este cubre 255/256/257).

## Reglas para el motor

- Insumo: certificado del emisor discriminando no gravados / gravados + retención.
- No gravados → suman a la base de la tabla 241 (junto con general + pensiones,
  art. 331); descuento 254-1 sobre la parte de dividendos.
- Gravados → 35% primero, neto a la tabla.
- Retención de dividendos suma al total de retenciones.

Fuentes: http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr010.html ·
https://normograma.dian.gov.co/dian/compilacion/docs/decreto_1103_2023.htm
