# Informe: Aspectos legales y regulatorios de operar en Colombia una plataforma SaaS tipo referencia para declaración de renta de personas naturales

**Fecha del informe:** 23 de julio de 2026. Informe de investigación con fines informativos, no constituye asesoría legal; validar con abogado tributarista y de protección de datos antes de lanzar.

---

## 1. ¿Es legal preparar declaraciones de renta de terceros sin ser contador público?

**Conclusión: sí, es legal.** La elaboración de una declaración de renta NO es actividad reservada a contadores públicos. La Ley 43 de 1990 regula la profesión de contaduría y reserva al contador las actividades donde se requiere **dar fe pública** (certificaciones, dictámenes, firma con tarjeta profesional). Elaborar o "diligenciar" una declaración es distinto de **firmarla como contador**: la declaración la firma el contribuyente, quien es el declarante ante la DIAN.

- Ley 43 de 1990 (texto oficial): https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1598256 y https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=66148
- El art. 2 de la Ley 43 define como "actividades relacionadas con la ciencia contable" la asesoría tributaria, pero la jurisprudencia y la práctica (referencia opera desde 2018 sin sanción por ejercicio ilegal) confirman que la asesoría/elaboración no exige tarjeta profesional; lo reservado es la **atestación** (dar fe pública, art. 10 Ley 43). Conceptos del CTCP: https://accounter.co/normatividad/conceptos/alcance-responsabilidades-del-contador-concepto-ctcp-291-de-2020 y https://incp.org.co/publicaciones/infoincp-publicaciones/2025/03/ctcp-aclara-la-responsabilidad-de-los-contadores-en-certificaciones-tributarias/

**¿Cuándo la declaración de persona natural requiere firma de contador? (art. 596 num. 6 E.T.)** Solo cuando se cumplen **ambas** condiciones:

1. El contribuyente está **obligado a llevar contabilidad** (comerciantes; asalariados y rentistas no lo están), y
2. Su **patrimonio bruto o ingresos brutos del año superan 100.000 UVT**.

Además, el art. 602 E.T. (IVA) exige firma de contador cuando la declaración arroja **saldo a favor** — análogo aplicable a obligados a llevar contabilidad. Si la firma es obligatoria y falta, la declaración **se tiene por no presentada** (art. 580 E.T.).

- Art. 596 E.T.: https://estatuto.co/596 y https://www.dian.gov.co/impuestos/personas/RentaNaturales/2015/Herramientas/Paginas/Articulo596.aspx
- Análisis: https://www.gerencie.com/firmas-en-la-declaracion-de-renta-de-personas-naturales.html · https://www.gerencie.com/declaraciones-tributarias-que-deben-ser-firmadas-por-contador-publico.html · https://actualicese.com/archivo/declaracion-de-renta-de-persona-natural-que-debe-llevar-firma-del-contador/ · https://siemprealdia.co/colombia/impuestos/firma-del-contador-publico-en-declaraciones-tributarias/ · https://nietolawyers.com/noticias-legales/en-que-casos-necesitas-que-tu-contador-publico-firme-tu-declaracion-de-renta-en-colombia/

**Implicación para el producto:** el segmento objetivo (asalariados, independientes no obligados a llevar contabilidad — la enorme mayoría de declarantes del 210) no requiere contador. Conviene un "gate" en el onboarding que detecte los casos del art. 596-6 (obligado a contabilidad + >100.000 UVT ≈ ~$5.000 millones COP en 2026) y los derive a un contador aliado, como hace referencia con "referencia Pro".

---

## 2. Protección de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013)

- Ley 1581 de 2012: https://www.suin-juriscol.gov.co/viewDocument.asp?id=1684507 y https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981

**Requisitos base para la plataforma (como Responsable del Tratamiento):**

- **Autorización previa, expresa e informada** del titular (art. 9), obtenida en el registro, informando finalidades.
- **Política de Tratamiento de Datos** publicada y **aviso de privacidad** (Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015).
- Deberes de seguridad, confidencialidad, calidad del dato y atención de consultas/reclamos (arts. 17-18); canales para derechos de habeas data.

**¿Los datos tributarios/financieros son "sensibles"?** No según el art. 5 (sensibles = origen racial, opinión política, religión, salud, vida sexual, biometría, sindicatos). Los financieros/tributarios son **privados o semiprivados** — no sensibles, pero de tratamiento reforzado; si se tratan datos de historial crediticio aplica la Ley 1266 de 2008. Ojo: si la plataforma usa biometría (verificación de identidad) sí trata datos sensibles. Referencias: https://telecomunicaciones.uexternado.edu.co/los-datos-personales-y-su-regulacion-en-colombia-datos-sensibles-datos-publicos-semiprivado-y-privado-enfoque-ambito-de-aplicacion-y-contenido-2/ · https://www.tusdatos.co/blog/proteccion-de-datos-personales-en-colombia-ley-1581-de-2012-como-proteger-la-informacion

**RNBD:** Decreto 090 de 2018 — solo obligados: sociedades y ESAL con **activos totales > 100.000 UVT** y personas jurídicas públicas. Una SAS pequeña **no está obligada a registrar** mientras no supere ese umbral — pero sí debe cumplir todo lo demás de la Ley 1581.

- https://www.sic.gov.co/registro-nacional-de-bases-de-datos · https://sic.gov.co/preguntas-frecuentes-rnbd · https://e7.legal/obligaciones-en-materia-de-registro-nacional-de-bases-de-datos-rnbd/

**Transferencia internacional de datos (crítico si se usan APIs de IA extranjeras):**

- Art. 26 Ley 1581: prohibida la transferencia a países sin **nivel adecuado de protección**, salvo excepciones — la más práctica: **autorización expresa e inequívoca del titular**.
- **Circular Externa 005 de 2017 SIC** (con ajustes 008/2017 y 002-003/2018): países adecuados incluyen UE/EEE, Reino Unido, **Estados Unidos**, México, Perú, Costa Rica, Serbia, Japón, Corea del Sur, y los declarados adecuados por la Comisión Europea. **China NO está en la lista** — usar Kimi/Moonshot exige autorización expresa del titular y/o cláusulas contractuales; con OpenAI/Anthropic/AWS en EE. UU. el análisis es más simple.
  - Circular 005 de 2017: https://normograma.dian.gov.co/dian/compilacion/docs/circular_superindustria_0005_2017.htm · Lista: https://www.ambitojuridico.com/noticias/general/mercantil-propiedad-intelectual-y-arbitraje/estos-son-los-paises-con-un-nivel · Controversia EE. UU.: https://habeasdatacolombia.uniandes.edu.co/?p=2592
- **Circular Externa 002 de 2025 SIC** (7-oct-2025): adopta **Cláusulas Contractuales Modelo** para transferencias internacionales, incluso hacia países sin nivel adecuado (caso China); refuerza accountability. Firmar DPA con cláusulas modelo con el proveedor de IA.
  - https://www.cerlatam.com/normatividad/sic-circular-externa-002-de-2025-7-oct-2025/ · https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/alcance-de-la-circular-002-de-2025-sobre-transferencias-internacionales-de-datos · https://www.ambitojuridico.com/noticias/comercial/regimen-de-transferencias-internacionales-de-datos-personales-una-guia-rapida
- Distinguir **transferencia** (a otro Responsable) de **transmisión** (a un Encargado): enviar documentos del usuario a una API de IA es una **transmisión a un Encargado en el exterior**; con **contrato de transmisión** (art. 25 Decreto 1377/2013) no se requiere ni autorización del titular ni nivel adecuado del país — vía práctica más usada — pero la autorización de tratamiento debe informar que hay procesamiento en el exterior.

---

## 3. Responsabilidad civil por errores de cálculo — cómo lo maneja referencia

**Marco base:** ante la DIAN, el responsable es **siempre el contribuyente**. Errores → sanción por inexactitud (arts. 647-648 E.T., 100%-200% de la diferencia), sanción por corrección (art. 644) e intereses moratorios (arts. 634-635). Solo cabe acción civil contractual del usuario contra la plataforma.

**Modelo referencia (IC TECNOLOGÍA S.A.S.)** — de sus T&C (PDF vigente 01-ago-2025: https://cdn.prod.website-files.com/5c4ba48132b5c622a3e9c186/68914971db718cf17b6ea4f1_TyC%20Ptd%20Tributi%2001%20Agos%202025.pdf, desde https://www.plataforma de referencia):

- **Obligaciones de medio, no de resultado**.
- **Garantía de exactitud, acotada**: 36 meses desde el pago; si "debido a un error de cálculo atribuible exclusivamente al software... se generen sanciones o intereses por parte de la DIAN, IC TECNOLOGÍA S.A.S. asumirá el valor de dichas sanciones o intereses, previa verificación y confirmación del error por parte de IC TECNOLOGÍA S.A.S.".
- **Definición estrecha de "error de cálculo"**: "un desacuerdo matemático entre los resultados del software y la normativa tributaria vigente"; **excluye** "las diferencias que surjan de la interpretación de la normativa tributaria o de la falta de información por parte del usuario".
- **Condiciones**: información completa y veraz del usuario, notificar requerimientos DIAN en máximo 5 días hábiles, colaborar. "La única garantía... y no existe ninguna otra garantía expresa ni implícita".
- **Deslinde total por información del usuario**.
- En marketing la venden como garantía "sin límites" (entrevista CEO: https://www.larepublica.co/internet-economy/referencia-es-la-firma-que-ofrece-garantia-sobre-la-elaboracion-de-la-declaracion-de-renta-3029955), pero contractualmente está limitada a error matemático del software.

**Recomendación replicable:** (i) contribuyente responsable ante la DIAN; (ii) garantía voluntaria acotada a error de software con verificación propia; (iii) exclusión de interpretación normativa e información del usuario; (iv) póliza de responsabilidad civil profesional/E&O tecnológico. Con IA generativa en el pipeline, la garantía debe cubrir alucinaciones de cálculo igual que bugs → pasar el cálculo por un motor determinístico auditable.

---

## 4. ¿Aplica la regulación de "proveedores tecnológicos" DIAN?

**No.** La figura del "proveedor tecnológico" (Resolución DIAN 000165 de 2023; patrimonio >20.000 UVT, ISO 27001, habilitación con visita) es **exclusiva de facturación electrónica**. Un software que elabora borradores del 210 **no requiere habilitación, registro ni autorización de la DIAN**. No existe regulación específica del "software de preparación de declaraciones" en Colombia.

- https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/proveedores-tecnologicos/ · https://www.dian.gov.co/impuestos/factura-electronica/Documents/Preguntas-y-respuestas-Proveedores-Tecnologicos-FE.pdf

---

## 5. Uso de credenciales del usuario en el portal DIAN (MUISCA)

**Cómo lo hace referencia (T&C ago-2025):**

- **Consulta gratuita de exógena**: "El usuario autoriza a referencia a ingresar a su cuenta del portal de la DIAN utilizando las credenciales que él mismo proporciona, única y exclusivamente para consultar su información exógena", con compromiso de **no conservación** de credenciales. Servicio **excluido de la garantía**.
- **Presentación digital**: el usuario otorga "de manera previa, expresa e irrevocable... un mandato" para firmar la declaración a su nombre usando las credenciales proporcionadas, con el único fin de la presentación. El usuario sigue siendo responsable de la custodia de sus credenciales.
- Ruta manual documentada en paralelo: https://www.plataforma de referencia

**Análisis de riesgo:**

- **Penal (Ley 1273 de 2009, art. 269A — acceso abusivo):** sanciona el acceso "sin autorización o por fuera de lo acordado". Con **mandato expreso del titular**, el acceso en su nombre no es "sin autorización" — posición práctica del mercado. Texto: http://www.secretariasenado.gov.co/senado/basedoc/ley_1273_2009.html
- **Riesgo residual real:** (i) los términos del portal DIAN presuponen uso personal — la DIAN podría objetar el acceso automatizado y bloquearlo (captchas, detección); (ii) riesgo de seguridad al manipular contraseñas MUISCA; (iii) responsabilidad si la automatización falla al presentar. No existe API pública ni OAuth de la DIAN para terceros.
- **Recomendación MVP:** empezar con **el usuario descarga su exógena y certificados y los sube**. Si luego se ofrece "conexión DIAN": mandato expreso y revocable, uso efímero de credenciales (nunca persistirlas), cifrado en tránsito y memoria, logs de auditoría, cláusula de no conservación.

---

## 6. Regulación de IA en Colombia (2025-2026)

**No hay ley de IA vigente.** Marco actual:

- **CONPES 4144 (feb-2025)** — Política Nacional de IA a 2030; no crea obligaciones directas para privados: https://www.dnp.gov.co/publicaciones/Planeacion/Paginas/conpes-4144-hoja-de-ruta-colombia-inteligencia-artificial-retos-actuales-transformacion-futura.aspx
- **Proyectos de ley en trámite:** PL 442/2025 (MinCiencias), inspirado en el AI Act europeo: clasificación por riesgo, prohibiciones, autoridad de supervisión, transparencia, explicabilidad, supervisión humana. También PL 043/2025-S / 324/2025-C. Aún no son ley. https://www.garrigues.com/es_ES/noticia/mapa-regulatorio-inteligencia-artificial-colombia · https://regulations.ai/regulations/colombia-summary
- **Exigible HOY: Circular Externa 002 de 2024 SIC** ("Tratamiento de Datos Personales en Sistemas de IA"): idoneidad, necesidad, proporcionalidad; **estudio de impacto de privacidad previo** documentado cuando el tratamiento con IA implique alto riesgo (datos financieros/tributarios masivos califican). PDF: https://sedeelectronica.sic.gov.co/sites/default/files/normativa/Circular%20Externa%20No.%20002%20del%2021%20de%20agosto%20de%202024.pdf · Análisis: https://www.deloitte.com/latam/es/services/legal/perspectives/lineamientos-para-tratamiento-datos-en-sistemas-ia.html
- Lineamientos SIC sobre IA en servicios al consumidor (Ley 1480 de 2011): https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/lineamientos-sobre-uso-de-inteligencia-artificial-en-servicios-al-consumidor

**"Asesoría tributaria" vs. "herramienta de autopreparación":** no hay definición legal, pero el posicionamiento importa: una **herramienta de autopreparación** (el software calcula con datos que el usuario confirma; el usuario decide y presenta) minimiza riesgos y encaja con el modelo de responsabilidad. Recomendado: describir el servicio como herramienta de autopreparación asistida, revelar el uso de IA, aviso de que no sustituye asesoría profesional, derivar casos complejos a contadores aliados.

---

## 7. Estructura societaria e impuestos de la startup

- **Vehículo: S.A.S.** (Ley 1258 de 2008) — lo que usa referencia (IC TECNOLOGÍA S.A.S.). Guía: https://gestionlegalcolombia.com/crear-empresa-de-software/
- **IVA:** servicio gravado a la **tarifa general 19%** (no aplica la exclusión del art. 476-21 para "computación en la nube" — criterios estrictos DIAN; un SaaS B2C de preparación de renta difícilmente encaja). Análisis: https://phylo.co/blog/iva-para-saas-en-colombia-lo-que-nadie-te-explica/ — Mientras la SAS no supere topes de responsable de IVA puede operar como no responsable; al facturar B2C masivo debe cobrar 19%.
- **Facturación electrónica de los cobros:** obligatoria como facturador electrónico (Res. 000165 de 2023) — con software habilitado o el servicio gratuito DIAN; no requiere ser "proveedor tecnológico": https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/requerimientos-para-ser-facturador-electronico/
- Otros: renta corporativa 35%, ICA municipal, retenciones. Exportación de servicios exenta de IVA (art. 481 E.T.).

---

## 8. Checklist replicable de T&C (modelo referencia)

1. **Obligaciones de medio, no de resultado**.
2. **El contribuyente es el declarante**; presentación opcional bajo mandato expreso con sus credenciales; la responsabilidad del contenido sigue siendo del contribuyente.
3. **Garantía acotada**: solo "error de cálculo" matemático del software; cubre sanciones e intereses previa verificación propia; 36 meses; condiciones de conducta del usuario; única garantía.
4. **Deslinde por información del usuario**.
5. **Credenciales**: custodia del usuario; uso puntual sin almacenamiento.
6. **Datos personales**: política Ley 1581/2012, finalidades claras, transmisión internacional informada, procedimiento habeas data.
7. **Capa profesional separada** (intermediación con contadores aliados; indemnidad por errores del aliado).
8. **Sin responsabilidad por actos de la DIAN** ni disponibilidad continua.

---

## Conclusiones operativas para "tu-renta-ai"

1. **Viable legalmente sin contadores en nómina** para el segmento no obligado a llevar contabilidad; gate del art. 596-6 E.T. y red de contadores aliados para el resto.
2. **Prioridad regulatoria #1: Ley 1581** — autorización robusta, política de tratamiento, contrato de transmisión/cláusulas modelo (Circular SIC 002 de 2025) con el proveedor de IA; **evitar proveedores en China o cubrirlos con autorización expresa + cláusulas modelo**; EE. UU. es la ruta simple. Estudio de impacto de privacidad (Circular SIC 002 de 2024) antes de producción.
3. **Replicar la arquitectura contractual de referencia**: medio no resultado + garantía estrecha verificable + contribuyente siempre declarante.
4. **MVP sin credenciales DIAN** (usuario sube exógena/certificados); la "conexión DIAN" con mandato es defendible pero es el punto de mayor riesgo técnico-legal.
5. **Sin barreras de entrada regulatorias DIAN** para el software; SAS + facturación electrónica de cobros + IVA 19% en el precio.
