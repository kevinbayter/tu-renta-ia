import type {
  DocumentoFuente,
  ExtractorDocumentosPort,
  LlmPort,
  ResultadoExtraccion,
} from '@turenta/core';
import {
  certificado220Schema,
  certificadoBancarioSchema,
  certificadoPrepagadaSchema,
  clasificacionDocumentoSchema,
  declaracionAnteriorSchema,
  jsonSchemas,
} from '@turenta/shared';
import type {
  Certificado220Extraido,
  CertificadoBancarioExtraido,
  CertificadoPrepagadaExtraido,
  ClasificacionDocumento,
  DeclaracionAnteriorExtraida,
} from '@turenta/shared';

import type { ZodType } from 'zod';

const SYSTEM_BASE = `Eres un extractor de datos de documentos tributarios colombianos.
Reglas estrictas:
- Montos SIEMPRE como enteros en pesos COP, sin puntos, comas ni decimales ("15.770.000" → 15770000; "3.199.749" → 3199749).
- En Colombia el punto separa miles y la coma separa decimales; los centavos se descartan ("786.273,39" → 786273).
- Si un campo no aparece en el documento, usa 0 (números) o "" (textos).
- NO inventes valores. Responde SOLO el JSON pedido.`;

const PROMPT_VERIFICACION = 'Extrae de nuevo con máximo cuidado: verifica cada dígito de cada monto contra el documento antes de responder.';

/** Extractor con doble pasada: dos extracciones independientes; los montos deben coincidir. */
export class ExtractorCertificados implements ExtractorDocumentosPort {
  constructor(private readonly llm: LlmPort) {}

  async clasificar(doc: DocumentoFuente): Promise<ClasificacionDocumento['tipo']> {
    const guia = `Clasifica el documento en UNO de estos tipos:
- certificado_220: "Certificado de Ingresos y Retenciones por Rentas de Trabajo y de Pensiones" (formulario 220 DIAN) emitido por UN empleador a UN trabajador; tiene pagos por salarios, aportes y retención.
- certificado_bancario: certificado tributario emitido por un banco/entidad financiera con saldos, rendimientos, GMF y/o retenciones de UNA entidad.
- medicina_prepagada: certificado de pagos de medicina prepagada o seguro de salud.
- declaracion_anterior: un formulario 210 YA PRESENTADO (declaración de renta de un año gravable anterior), con casillas numeradas del 28 al 141 y sellos o número de autoadhesivo de la DIAN.
- exogena: reporte "Consulta de información reportada por terceros" de la DIAN — tabla con MÚLTIPLES empresas informantes distintas y sus reportes.
- otro: cualquier otro documento.`;
    const bruto = await this.llm.extraerEstructurado({
      system: `${SYSTEM_BASE}\n${guia}`,
      user: recortar(doc.texto),
      ...(doc.imagenesBase64 ? { imagenesBase64: doc.imagenesBase64 } : {}),
      jsonSchema: jsonSchemas.clasificacion,
      esfuerzo: 'low',
    });
    return clasificacionDocumentoSchema.parse(bruto).tipo;
  }

  extraer220(doc: DocumentoFuente): Promise<ResultadoExtraccion<Certificado220Extraido>> {
    const instruccion = `Documento: certificado de ingresos y retenciones (formulario 220 DIAN).
OJO con el layout: el texto extraído del PDF puede traer las etiquetas y los valores en bloques
separados; empareja cada valor con su casilla por el ORDEN del formulario (casillas 36 a 60).
El encabezado trae el "Período de la certificación: DE ... A ..." — extrae ambas fechas como
periodoInicio y periodoFin en formato YYYY-MM-DD ("" si no aparecen); indican los meses trabajados.
Campos → casilla: pagos por salarios (36); pagos por prestaciones sociales (42); otros pagos (46);
auxilio de cesantía e intereses EFECTIVAMENTE PAGADOS al empleado (47); pensiones de jubilación,
vejez o invalidez (48, común en certificados de Pensiones Ejemplo/fondos — 0 si no aplica); auxilio de
cesantía CONSIGNADO al fondo de cesantías (49); total de ingresos brutos (52 = suma de 36 a 51);
aportes obligatorios salud (53); aportes obligatorios pensión y solidaridad (54);
ingreso laboral promedio últimos seis meses (59); retención en la fuente (60).
Verifica que la suma de los pagos coincida con el total de ingresos brutos.`;
    return this.extraerConDoblePasada(doc, instruccion, certificado220Schema, jsonSchemas.certificado220);
  }

  extraerBancario(doc: DocumentoFuente): Promise<ResultadoExtraccion<CertificadoBancarioExtraido>> {
    const instruccion = `Documento: certificado tributario de entidad financiera.
Campos: entidad; año gravable; saldo de cuentas a 31 de diciembre; rendimientos financieros totales del año;
GMF (4x1000) pagado; retención en la fuente practicada; componente inflacionario informado (0 si no aparece).`;
    return this.extraerConDoblePasada(
      doc,
      instruccion,
      certificadoBancarioSchema,
      jsonSchemas.certificadoBancario,
    );
  }

  extraerPrepagada(doc: DocumentoFuente): Promise<ResultadoExtraccion<CertificadoPrepagadaExtraido>> {
    const instruccion = `Documento: certificado de medicina prepagada o seguro de salud.
Extrae cada amparo/contrato como un elemento del arreglo con su valor pagado y vigencias (formato YYYY-MM-DD).`;
    return this.extraerConDoblePasada(
      doc,
      instruccion,
      certificadoPrepagadaSchema,
      jsonSchemas.certificadoPrepagada,
    );
  }

  extraerDeclaracionAnterior(doc: DocumentoFuente): Promise<ResultadoExtraccion<DeclaracionAnteriorExtraida>> {
    const instruccion = `Documento: formulario 210 DIAN YA PRESENTADO de un año gravable anterior.
Extrae SOLO estas casillas por su número (el valor a la derecha de cada número de casilla):
- anioGravable: el año gravable de ESTA declaración (encabezado, "Año" — NO el año de presentación).
- patrimonioLiquido: casilla 31 "Total patrimonio líquido".
- impuestoNetoRenta: casilla 126 "Impuesto neto de renta".
- anticipoAnioSiguiente: casilla 133 "Anticipo renta para el año gravable siguiente".
- totalSaldoAFavor: casilla 137 "Total saldo a favor".
Si una casilla está vacía o en cero, usa 0. NO confundas casillas contiguas: guíate por el número impreso.`;
    return this.extraerConDoblePasada(doc, instruccion, declaracionAnteriorSchema, jsonSchemas.declaracionAnterior);
  }

  private async extraerConDoblePasada<T>(
    doc: DocumentoFuente,
    instruccion: string,
    schema: ZodType<T>,
    jsonSchema: unknown,
  ): Promise<ResultadoExtraccion<T>> {
    const pasada1 = await this.unaPasada(doc, instruccion, schema, jsonSchema);
    const pasada2 = await this.unaPasada(doc, `${instruccion}\n${PROMPT_VERIFICACION}`, schema, jsonSchema);
    const discrepancias = compararMontos(pasada1, pasada2);
    return { datos: pasada1, pasadasCoinciden: discrepancias.length === 0, discrepancias };
  }

  private async unaPasada<T>(
    doc: DocumentoFuente,
    instruccion: string,
    schema: ZodType<T>,
    jsonSchema: unknown,
  ): Promise<T> {
    const bruto = await this.llm.extraerEstructurado({
      system: `${SYSTEM_BASE}\n${instruccion}`,
      user: recortar(doc.texto),
      ...(doc.imagenesBase64 ? { imagenesBase64: doc.imagenesBase64 } : {}),
      jsonSchema: jsonSchema as Record<string, unknown>,
      // Montos que alimentan una declaración legal: razonamiento alto siempre.
      esfuerzo: 'high',
    });
    return schema.parse(bruto);
  }
}

const MAXIMO_CARACTERES = 30_000;

function recortar(texto: string): string {
  return texto.length > MAXIMO_CARACTERES ? texto.slice(0, MAXIMO_CARACTERES) : texto;
}

function compararMontos(a: unknown, b: unknown): string[] {
  const numerosA = aplanarNumeros(a, '');
  const numerosB = aplanarNumeros(b, '');
  return [...numerosA.entries()]
    .filter(([ruta, valor]) => numerosB.get(ruta) !== valor)
    .map(([ruta, valor]) => `${ruta}: pasada1=${String(valor)} pasada2=${String(numerosB.get(ruta))}`);
}

function aplanarNumeros(objeto: unknown, prefijo: string): Map<string, number> {
  const resultado = new Map<string, number>();
  if (typeof objeto === 'number') {
    resultado.set(prefijo, objeto);
    return resultado;
  }
  if (typeof objeto !== 'object' || objeto === null) {
    return resultado;
  }
  for (const [clave, valor] of Object.entries(objeto)) {
    aplanarNumeros(valor, `${prefijo}.${clave}`).forEach((v, k) => resultado.set(k, v));
  }
  return resultado;
}
