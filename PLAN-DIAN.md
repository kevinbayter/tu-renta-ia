# Plan de desarrollo — Conexión con la DIAN

> Basado en [`research/07-automatizacion-dian-analisis-2026.md`](research/07-automatizacion-dian-analisis-2026.md).
> **Modelo elegido: B — sesión efímera asistida** (el mismo que opera referencia en su plan
> self-service). Las credenciales del usuario **nunca se almacenan**: viven en memoria
> durante la operación y se destruyen al terminar.

## 1. Principios innegociables

1. **Cero persistencia de credenciales.** Ni en base de datos, ni en disco, ni en logs, ni
   en el estado del wizard. Solo memoria del proceso, con borrado explícito al cerrar.
2. **El usuario conduce.** Cada operación arranca por una acción suya, ve el progreso en
   vivo y —para presentar— confirma dos veces. Nunca operamos "en background".
3. **Autorización explícita y con evidencia.** Antes de cada conexión, un consentimiento
   específico (qué haremos, con qué alcance, por cuánto tiempo), registrado con fecha, hora,
   IP y hash del texto aceptado. Revocable siempre.
4. **La vía manual nunca desaparece.** Subir el archivo y transcribir el 210 con nuestra
   guía siguen disponibles: si el RPA falla, el servicio no se cae.
5. **Lectura antes que escritura.** No se toca la firma electrónica hasta que la conexión de
   solo lectura esté probada en producción con usuarios reales.

## 2. Arquitectura

```
apps/web  →  core (puerto ConexionDianPort)  →  adaptadores/dian (Playwright)
                                                      ↓
                                            proceso worker aislado
                                            (sin acceso a la BD)
```

- **Puerto en `core`**: `ConexionDianPort` con `descargarExogena`, `descargarDeclaracion`,
  `presentarDeclaracion`. El dominio no sabe que existe un navegador.
- **Adaptador en `adaptadores/dian`**: Playwright encapsulado. Es el único que ve las
  credenciales.
- **Worker aislado**: proceso separado sin credenciales de BD ni acceso a otros datos. Si
  algo se compromete ahí, no arrastra la plataforma.
- **Transporte**: las credenciales viajan de la UI al worker por HTTPS y una sesión de un
  solo uso identificada por token efímero; se limpian con `finally` garantizado.

## 3. Fases

### Fase 1 — Conexión de solo lectura: exógena

**Alcance**: "Conectar mi cuenta DIAN" en el paso 1 del wizard. El usuario ingresa documento
y contraseña, ve el progreso paso a paso, y la exógena entra al flujo actual como si la
hubiera subido a mano.

- Adaptador Playwright: login, aceptar condiciones, seleccionar año, descargar Excel.
- Pantalla de consentimiento previo con registro de evidencia.
- Manejo honesto de errores: credenciales inválidas, portal caído, cambio de estructura,
  captcha → mensaje claro + "descárgala manualmente" con la guía de siempre.
- Nunca se guarda el archivo original (coherente con la decisión de privacidad ya tomada:
  solo datos extraídos).

**Criterio de salida**: 20 conexiones reales exitosas y fallback probado.

### Fase 2 — Descargar declaraciones anteriores

**Alcance**: botón "Traer mi última declaración". Alimenta lo que ya construimos: patrimonio
líquido anterior, impuesto neto y anticipo (comparación patrimonial del art. 236).

- Misma infraestructura de Fase 1, distinta ruta del portal.
- El PDF pasa por el extractor `declaracion_anterior` que ya existe.

### Fase 3 — Presentar el 210 con un clic

**Solo si Fases 1-2 llevan al menos una temporada estables.**

**Requisitos previos (bloqueantes)**:

- [ ] Concepto de abogado tributarista sobre el modelo y los textos de autorización
- [ ] Póliza de responsabilidad civil profesional
- [ ] Revisión de las condiciones de uso del portal MUISCA (leerlas dentro del portal)

**Alcance**: diligenciar las casillas, firmar con la contraseña del usuario, obtener acuse y
recibo 490.

- Doble confirmación: resumen de lo que se va a presentar + "esto es definitivo".
- Vista previa idéntica a lo que quedará radicado.
- Descarga inmediata del acuse con sello DIAN y del 490.
- Registro de auditoría inmutable de la operación.

## 4. Seguridad (transversal)

| Medida                  | Detalle                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| Credenciales en memoria | Variables locales del worker, `finally` que las sobrescribe               |
| Sin logs                | Filtro que impide imprimir campos marcados como secretos                  |
| Aislamiento             | Worker en contenedor propio, sin `DATABASE_URL` ni secretos de la app     |
| Sesión de un uso        | Token efímero (minutos), invalidado tras la operación                     |
| Rate limiting           | Por usuario y global, para no parecer un ataque de credenciales al MUISCA |
| Auditoría               | Qué se hizo, cuándo y con qué autorización — sin la credencial            |
| Salida de red           | IP estable y reputada (ver riesgo de CGNAT en el informe)                 |

## 5. Textos legales a redactar

1. **Consentimiento de conexión** (por sesión): qué haremos, con qué alcance, cuánto dura,
   que no guardamos la contraseña, cómo revocar.
2. **Consentimiento de presentación** (Fase 3): que el usuario es el declarante y firmante,
   que la responsabilidad de lo declarado es suya, que revisó el borrador.
3. **Actualización de Términos y Privacidad**: sección de conexión con la DIAN.

Todos deben ser revisados por abogado antes de Fase 3.

## 6. Lo que NO haremos

- ❌ Guardar credenciales para "reconectar automáticamente"
- ❌ Operar sin que el usuario esté presente
- ❌ Constituirnos en mandatarios (evita la responsabilidad solidaria del art. 572-1)
- ❌ Generar la firma electrónica del usuario en su nombre
- ❌ Prometer que la conexión siempre funcionará (el MUISCA cambia sin aviso)

## 7. Riesgos asumidos conscientemente

| Riesgo                                               | Mitigación                                               | Residual       |
| ---------------------------------------------------- | -------------------------------------------------------- | -------------- |
| Zona gris del art. 269A ("por fuera de lo acordado") | Autorización expresa + evidencia + precedente de mercado | Bajo pero real |
| MUISCA cambia y rompe el RPA                         | Fallback manual siempre visible + monitoreo              | Medio          |
| Bloqueo de IP por parte de la DIAN                   | Rate limiting + IP dedicada                              | Medio          |
| Filtración de credenciales                           | No se almacenan: no hay qué filtrar                      | Muy bajo       |

## 8. Orden sugerido

Fase 1 → probar una temporada → Fase 2 → validación legal → Fase 3.

**Nota de infraestructura**: antes de Fase 1 conviene mover la app a un VPS con IP fija y
reputada. El servidor doméstico tras CGNAT funciona para la beta, pero no es el origen
adecuado para conectarse a la DIAN a nombre de terceros.
