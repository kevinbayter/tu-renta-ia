# Presentación del 210 en MUISCA — mapeo del flujo de escritura (AG2025)

Mapeado en vivo el 19-sep-2026 sobre una cuenta real, en modo lectura: se editó el borrador, no se guardó ni se firmó nada. Base de
la Fase 3 de [`PLAN-DIAN.md`](../PLAN-DIAN.md).

## 1. Entrada: la declaración sugerida

`Dashboard → "Presentar Declaración de Renta"` (o menú → Diligenciar / Presentar →
Formulario 210) ya **no abre la lista de presentadas**: abre la **declaración sugerida**
que la DIAN arma con la exógena.

- Ruta: `WebDilIngresoFormRenta210/#/ingreso/sugerida?idRequest=<base64("sugerida=2025")>`
- Texto: "valor a pagar por su declaración sugerida de renta es: $ X"
- Botones: **"Firmar y presentar"** (presenta la sugerida TAL CUAL — el robot nunca lo
  pulsa), "Sí, editar", "No, ir al inicio", "Descargar declaración sugerida" (PDF con
  marca SUGERIDA; el nombre del archivo es el número de formulario).
- La sugerida ya trae número de formulario (13 dígitos) y queda como **Borrador** al editar.

**Con un borrador ya creado** la entrada cambia: el mismo botón abre
`#/ingreso/borradores` ("Edite su declaración de renta"), una `mat-table` con una
`mat-row` por borrador (No. formulario, "2025 / anual", Concepto "Inicial", Estado
"Edición") y tres íconos de acción identificados por `mattooltip`: **Descargar**,
**Editar** (`lapiz.png`) y **Anular** (`anular.png`). "Editar" abre el mismo editor
(misma URL `WebFormRenta210v18/...&idedocumento=<nro>`, misma pregunta inicial). El
robot pulsa solo `img[mattooltip="Editar"]` de la fila del año pedido; **Anular** anula la
declaración y no está en ninguna lista de lo que el robot puede pulsar.

Lo que la sugerida hace mal y por qué hay que editarla (caso real): arriendos por
mandato en rentas no laborales (74) en vez de capital (58), sin costos (60); no trae
rendimientos sin fila en la exógena; casilla 24 con la actividad SECUNDARIA del RUT.

## 2. Editor: `WebFormRenta210v18`

`?concepto=inicial&anio=2025&periodicidad=anual&periodo=1&idedocumento=<nro>&modo=experto`

Secuencia de pantallas al pulsar "Sí, editar":

1. **Pregunta inicial** — permanencia en Colombia: radios `#rbSi` (value 1, más de 183
   días → residente) y `#rbNo` (name `rbTiempoPermanencia`). Modal "usted es residente
   fiscal" → **Siguiente**.
2. Modal "Declaración de renta sugerida — ¿Desea consultar?" → **Sí, consultar** / No, gracias.
3. Modal con el resumen de la sugerida — "¿Desea continuar con los datos sugeridos?" → **Si** / No.
4. Modal "Tenga en cuenta: es necesario completar las casillas 286 y 24" → **Entendido**.
5. Formulario en 15 secciones (stepper), una sección en el DOM a la vez, botones
   **Siguiente** / **Anterior**; barra lateral con 💾 (guardar) y PDF, y el estado
   (Nro. de formulario, año, periodicidad, período, concepto, Estado: Borrador).
   Flujo superior: Pregunta(s) inicial(es) → Formulario 210 → Firmar → Presentar → Pagar.

**Cada casilla es `#cs_id_<número>`** (inputs de texto con separador de miles, selects).
Las calculadas vienen `readonly`/`disabled`.

Detalles verificados en vivo (19-sep-2026) que rompieron al robot:

- Los botones Angular Material incluyen el nombre del ícono en su texto: el "Siguiente"
  del formulario se lee `Siguientechevron_right` (el del modal de residente sí es
  "Siguiente" a secas). Guardar es `button.save-button` con texto `save`; el PDF,
  `picture_as_pdf`. Hay además "Consultar declaración sugerida" y "Salir".
- La pregunta inicial es un `<input type="radio" id="rbSi">` con `<label for="rbSi">`. Un
  clic antes de que Angular enlace sus manejadores se pierde (el input queda
  `ng-pristine` y no abre el modal); el robot pulsa la etiqueta y reintenta.
- Retomando un borrador, tras el modal de residente aparece directamente "Tenga en
  cuenta… casillas 286 y 24" → **Entendido** (no ofrece consultar la sugerida).
- Guardar solo si se leyeron casillas de todo el formulario (anclas 31, 91 y 111): un
  robot que se detuvo en la sección 1 no tiene nada que comparar y "sin diferencias"
  no significa nada. Pasó una vez (guardó un borrador tras la sección 1); ya no puede.

## 3. Secciones y casillas

| #   | Sección                                         | Entrada (se llenan)                                                                                      | Calculadas por MUISCA (se verifican) |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | Datos declarante                                | 286 género (select: 1 F, 2 M, 3 No binario, 4 Otro, 6 No responde); 24 actividad (select de 507 códigos) | 5-10 y 12 vienen del RUT             |
| 2   | Deducción imputable y beneficios sin limitantes | 297 valor compras con factura electrónica                                                                | 28 (1%)                              |
| 3   | Dependiente                                     | 241/242/244, 287-295, 357-359                                                                            | 138, 139                             |
| 4   | Patrimonio                                      | 29, 30                                                                                                   | 31                                   |
| 5   | Rentas de trabajo                               | 355 salarios, 356 honorarios sin costos, 33, 35, 36, 38, 39                                              | 32, 34, 37, 40, 41, 42               |
| 6   | Trabajo sin relación laboral                    | 43, 44, 45, 47, 48, 50, 51, 56                                                                           | 46, 49, 52-55, 57                    |
| 7   | Rentas de capital                               | 58, 59, 60, 62, 63, 64, 66, 67, 72                                                                       | 61, 65, 68-71, 73                    |
| 8   | Rentas no laborales                             | 74-77, 79-81, 83, 84, 89                                                                                 | 78, 82, 85-88, 90                    |
| 9   | Cédula general                                  | 94, 95, 96, 98                                                                                           | 91, 92, 93, 97                       |
| 10  | Pensiones                                       | 99, 100, 102                                                                                             | 101, 103                             |
| 11  | Dividendos                                      | 104, 105, 107, 109, 110                                                                                  | 106, 108                             |
| 12  | (no aplicó al caso; el stepper la salta)        | —                                                                                                        | —                                    |
| 13  | Ganancia ocasional                              | 112, 113, 114                                                                                            | 115                                  |
| 14  | Liquidación privada                             | 122, 123, 124, **126**, 127, 128, 130, 131, 132, **133**, 141, 994                                       | 111, 116-121, 125, 129, 134-137, 296 |
| 15  | Pago total                                      | —                                                                                                        | 136, 137                             |

Ojo: **126 (impuesto neto) y 133 (anticipo) son de entrada**, no calculadas. **28 se
calcula desde 297**: el robot envía el valor de las compras, no el 1%.

## 4. Casilla 24 (instructivo oficial)

"código que corresponde a la actividad económica que le generó el mayor valor de
ingresos en el período gravable a declarar, la cual debe corresponder a alguna de las
informadas en el RUT, para el período declarado, casilla 46, casilla 48 o casilla 50".
La sugerida precarga una del RUT, no necesariamente la de mayor ingreso.

## 5. Firma (Resolución DIAN 000139 de 2023)

Firmar exige firma electrónica vigente (se genera antes, "Gestionar mi firma
electrónica"; dura 3 años) y DOS factores: la contraseña de la firma y un código dinámico
que la DIAN envía en el momento al correo y/o celular del RUT.

Cómo lo resuelve Tributi sin pedirle nada al usuario (investigado el 19-sep-2026):

- La DIAN unificó credenciales: "La contraseña de la cuenta de usuario y de la firma
  electrónica será la misma" (micrositio de firma electrónica). El robot ya la tiene.
- El código dinámico, además del correo, queda en la **bandeja de comunicaciones** de
  MUISCA ("Ver mi bandeja de comunicaciones" junto a "Solicítela aquí"): el robot, ya
  dentro de la sesión, lo lee de ahí.
- Los T&C de Tributi le otorgan mandato para firmar y presentar "haciendo uso de las
  credenciales electrónicas" del usuario. TuRenta necesita el mismo mandato (alcance
  `presentar_declaracion` en `textoAutorizacion` + cláusula en T&C revisada por abogado).

### Mapeado en vivo el 19-sep-2026 (cuenta real, sin firmar)

- Guardar (ícono `save`) abre un diálogo "Mensaje: **Borrador actualizado con éxito**"
  con un único botón `close`.
- El paso "Firmar" del stepper **no es pulsable**. Se llega con el botón
  **"Guardar y continuar"** de la última sección (15. Pago total).
- Esa pantalla se titula **"Firmar formulario"** y solo tiene **"Ver borrador"**,
  **"Firmar"** y "Salir": **no hay campos** de contraseña ni de código. Aparecen al
  pulsar "Firmar", que es el punto sin retorno.
- En MUISCA **firmar es presentar**: el robot se detiene antes de ese botón.
- La bandeja de comunicaciones (`/WebComunicaciones/DefComunicados.faces`, tabla
  "Asunto | Fecha envío" con buscador `txtBusqueda`) estaba **vacía** en la cuenta real:
  no sirve como fuente garantizada del código dinámico.

### Mapeado en vivo el 19-sep-2026, intentando presentar (sin firmar)

- Tras "Guardar y continuar", MUISCA **vuelve a guardar** y reabre el aviso
  "Borrador actualizado con éxito", que **tapa el botón "Firmar"**. Hay que cerrarlo
  (botón `close`) antes de pulsar Firmar.
- "Firmar" abre primero un diálogo de **autorización del firmante**, no la contraseña:
  "Persona que va a firmar: Nombre: … NIT: … Representante legal · Certificado" con un
  botón **"Autorizar"**.
- Tras autorizar, el mismo diálogo pregunta **"¿Desea firmar de manera electrónica su
  declaración de renta?"** con **"Firmar"** y **"Desautorizar"** (autorizar es reversible).
  La contraseña llega después de ese "Firmar" (pendiente de ver).

### Requisito previo: firma electrónica vigente (19-sep-2026)

Con una cuenta **sin** firma electrónica el portal **no abre el formulario**: devuelve a
`#/ingreso` con un diálogo de error que tapa la pantalla:

> "Señor usuario, el formulario requiere de Firma Electrónica, la cual Ud. NO posee. Favor
> realizar la migración de la firma digital a la firma electrónica o solicitar la emisión
> de la misma acercándose a un punto de atención."

Es el caso de las cuentas que se quedaron con la **firma digital** del esquema anterior.
TuRenta lo detecta (`sin_firma_electronica`) y le dice al usuario que la genere en línea;
la genera él, no el robot, porque el código va a su correo o celular del RUT. Ojo: al
generarla **cambia la contraseña de la cuenta** (la DIAN las unificó), así que el acceso
guardado en TuRenta queda obsoleto.

Lección de diseño: el portal comunica los bloqueos en diálogos que además interceptan los
clics. Por eso el robot cierra avisos antes de cada paso y, cuando ya conoce el número del
borrador, abre el editor por su URL en vez de navegar el menú.

### Lo implementado (sin estrenar en real)

`firmar-210-muisca.ts` asume lo mínimo y verifica todo:

1. Pulsa "Firmar" (texto exacto: nunca "Firmar y presentar") y espera un diálogo.
2. Escribe la contraseña en el `input[type=password]`. Si además hay un campo de texto
   (el código dinámico) y no lo tenemos: **no firma**, pulsa "Solicítela aquí", cierra y
   devuelve `requiereCodigo` para que TuRenta se lo pida al usuario.
3. Firma, busca "Presentar" (paso aparte de firmar) y confirma con Sí/Aceptar/Continuar.
4. Descarga el acuse. **Sin acuse no marca `presentada`**: Res. 000227 de 2025,
   art. 1.7.4.2 num. 7 ("se entiende firmado… en el momento en que el sistema genera el
   acuse de recibo").

Si algo no aparece donde se espera, devuelve el mapa de la pantalla y se detiene: firmada
sin presentar es un estado posible y el usuario tiene que saberlo.

Pendiente de ver en vivo: el diálogo de firma, la pantalla de Presentar, el acuse y Pagar.

### Mapeado en vivo el 20-sep-2026: el diálogo de firma está en un iframe

El diagnóstico del adaptador (`diagnostico-firma.ts`) devolvió, ya en la pantalla de firma:

```
d0: Autorizar=ausente, Firmar=inerte/tapado:iframe, Desautorizar=inerte/tapado:iframe
```

Tres hallazgos, los tres necesarios para firmar:

1. **La firma vive dentro de un `iframe`.** Los botones "Firmar"/"Desautorizar" que se ven
   en el documento principal son una cáscara **deshabilitada**; los que responden —y
   después la contraseña y el código— están dentro del marco. Hay que recorrer
   `page.frames()`, y dentro de un marco el contenedor puede ser el propio `body`
   (un iframe no necesita `role="dialog"`). En la página principal el `body` NO vale:
   su "Firmar" solo reabre el diálogo, y pulsarlo en bucle es peor que no hacer nada.
2. **Otra capa se come el clic.** El panel de "Ayuda" queda por encima del marco, así que
   `click()` agota el tiempo. El evento directo (`dispatchEvent('click')`) sí llega, y solo
   se usa sobre controles ya comprobados como habilitados: nunca despierta un botón que el
   portal apagó a propósito.
3. **Con el firmante ya autorizado el portal no ofrece "Autorizar" sino "Desautorizar"**, y
   mantiene "Consultando información" mientras trae el certificado. Rendirse al primer
   intento fallido es rendirse antes de tiempo.

### El código electrónico es el segundo factor, no una excepción

Res. 000227 de 2025, art. 1.7.4.2: el Instrumento de Firma Electrónica es la combinación de
la **contraseña de la identidad electrónica** (primer factor) y el **Código Electrónico**
(segundo factor), este último "enviado al correo electrónico y/o celular… (SMS)".

La DIAN no lo exige en cada firma, pero sí cuando el instrumento es nuevo. **Regenerar la
firma electrónica deja el instrumento como recién creado**, así que vuelve a pedirlo: es lo
que pasó el 20-sep-2026, con la firma generada ese mismo día. No es algo que otros
operadores esquiven; es el estado del instrumento, no la herramienta.

### La ventana de firma, mapeada por dentro (20-sep-2026)

El mapa de marcos la mostró al fin. Ruta `/firmaelectronica/firma.html`, dentro del iframe:

```
campos:  txtOTP  → "Escriba el código"
         txtPsw  → "Contraseña de la firma electrónica"
botones: ["aquí", "remove_red_eye", "Firmar", "Volver"]
avisos:  ["Firmar documento"]
```

Dos cosas que cuestan una corrida entera si se deducen en vez de mirarse:

1. **El control para pedir el código lleva SOLO la palabra "aquí".** La frase es
   "…solicítela aquí", pero el botón es únicamente ese "aquí". Buscar un control que diga
   "solicitar" no encuentra nada, y buscar por texto suelto pulsa el párrafo
   "si no realizaste esta solicitud…", que acepta el clic y no pide nada: el usuario se
   queda esperando un correo que nunca salió.
2. **El campo del código se reconoce por su etiqueta**, no por ser el primer texto del
   contenedor. Dentro del marco hay más campos, y como el contenedor es el `body` entero,
   la regla "¿hay algún input de texto?" da falso positivo.

### El código se lee de "Mis comunicados"

`/WebComunicaciones/DefComunicados.faces`, la bandeja del propio portal, en la misma sesión
autenticada. El robot anota cuál era el último aviso, pulsa "aquí" y espera a que aparezca
uno **nuevo**: comparar contra el anterior es lo que evita leer un aviso viejo. La fila de
encabezado también es un `<tr>` y nunca cambia, así que solo cuentan las filas con `td`.

Del cuerpo se extrae el código exigiendo cercanía a la palabra que lo anuncia, cinco
caracteres mínimo y al menos un dígito: en el mismo aviso conviven fechas y números de
formulario, y devolver uno de esos sería peor que no encontrar nada, porque el portal lo
rechaza sin decir por qué. Si no aparece, no se inventa: se le pide al usuario.
