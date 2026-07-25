# Descuentos tributarios y comparación patrimonial — año gravable 2025

Respaldo normativo de `motor-fiscal/liquidacion/descuentos.ts` y
`motor-fiscal/patrimonio/comparacion.ts`.

## 1. Descuento por donaciones a ESAL (art. 257 E.T.)

- Las donaciones a entidades sin ánimo de lucro del **régimen tributario
  especial** NO son deducibles: dan un **descuento del 25%** del valor donado
  en el año gravable.
- **Requisito de soporte (art. 125-3 E.T. y art. 1.2.1.4.3 del Decreto 1625 de 2016)**: certificación dirigida al donante, firmada por el representante
  legal de la entidad donataria y por contador público o revisor fiscal cuando
  aplique. Sin ese certificado el descuento no procede — la plataforma lo
  advierte al capturar el valor.

### Límite (art. 258 E.T.)

Los descuentos de los arts. 255 (inversiones ambientales), 256 (ciencia y
tecnología) y 257 (donaciones) **no pueden exceder el 25% del impuesto sobre
la renta** del respectivo año gravable.

**Implementación**: descuento = min(25% × donaciones, 25% × impuesto sobre la
renta líquida gravable). El impuesto neto de renta (casilla 126) = impuesto
sobre la renta líquida (121) − total descuentos (125).

### Fuera de alcance (declarado)

- Descuento del **37%** por donaciones de alimentos y aseo a bancos de
  alimentos (art. 257 par., mod. art. 2 Ley 2380 de 2024): requiere validar
  que la donataria sea banco de alimentos calificado; no se implementa hasta
  contar con un caso real.
- Descuentos de los arts. 254 (impuestos pagados en el exterior), 255 y 256.

## 2. Renta por comparación patrimonial (arts. 236-239 E.T.)

**Regla (art. 236)**: cuando la suma de la renta gravable + rentas exentas +
ganancia ocasional neta resulta **inferior** a la diferencia entre el
patrimonio líquido del período y el del período inmediatamente anterior, esa
diferencia se considera renta gravable, **salvo que el contribuyente demuestre
que el incremento obedece a causas justificativas**.

**Ajustes (art. 237)**: a la renta gravable se le suman la ganancia ocasional
neta y las rentas exentas, y se le **restan los impuestos de renta y
complementarios pagados** durante el año.

**Valorizaciones (art. 238)**: los ajustes puramente nominales (valorización
de inmuebles o inversiones sin realización) NO cuentan como incremento.

**Causas justificativas (art. 239)**: demostradas las causas, no hay lugar a
la renta por comparación patrimonial. Ejemplos típicos: herencias, gananciales,
donaciones recibidas, préstamos obtenidos, valorizaciones y reajustes fiscales
(art. 70/73), venta de activos con su costo fiscal.

### Decisión de implementación: alerta, nunca renta automática

La plataforma **calcula la comparación y avisa**, pero **no agrega renta
gravable automáticamente**, porque:

1. Las causas justificativas son datos que **solo el contribuyente conoce** y
   la ley expresamente permite demostrarlas (art. 239).
2. Añadir renta sin justificación sería declarar de más contra el usuario.

La plataforma calcula:

```
incremento               = patrimonio líquido actual − patrimonio líquido anterior
capacidad de justificación = RLG + rentas exentas + GO neta − impuestos pagados + justificaciones declaradas
diferencia sin justificar  = max(0, incremento − capacidad)
```

Si la diferencia sin justificar es mayor que cero, se emite una recomendación
crítica explicando cuánto falta por justificar y con qué se justifica
normalmente. El usuario puede registrar sus justificaciones (herencia,
préstamo, gananciales, valorizaciones) y la alerta desaparece.

**Nota sobre el patrimonio anterior**: la exógena trae "Total patrimonio bruto
declarado en el año anterior", que es **bruto, no líquido**. Se ofrece como
referencia, pero el valor correcto (casilla 31 de la declaración anterior) lo
confirma el usuario.

## 3. Casillas del formulario 210

| Casilla | Contenido                                    |
| ------- | -------------------------------------------- |
| 121     | Impuesto sobre las rentas líquidas gravables |
| 123     | Descuento por donaciones (art. 257)          |
| 125     | Total descuentos tributarios                 |
| 126     | Impuesto neto de renta (121 − 125)           |

Limitación documentada: la posición exacta del descuento por donaciones dentro
del bloque 122-124 se validó por paridad de filas con la declaración real
usada de referencia (que no tenía descuentos). El **total (125)** y su efecto
en el impuesto neto (126) sí están verificados. Cuando exista un caso real con
donaciones se congela como fixture.

## 4. Fuentes

- Arts. 236-239 E.T.: https://estatuto.co/236 ·
  https://www.gerencie.com/renta-por-comparacion-patrimonial.html
- Arts. 257-259 E.T.: https://estatuto.co/257 ·
  https://actualicese.com/estatutotributario/257-2/
- Requisitos de la certificación de donación (art. 125-3, Decreto 1625/2016):
  https://www.ambitojuridico.com/noticias/contable/tributario-y-contable/requisitos-para-que-las-donaciones-esal-del-regimen
- Ley 2380 de 2024 (donaciones a bancos de alimentos, fuera de alcance):
  https://www.crowe.com/co/news/nuevo_descuento_tributario_por_donaciones_segun_ley_2380_de_2024
- Decreto 1625 de 2016, arts. 1.2.1.19.1 a 1.2.1.19.4 (comparación patrimonial).
