import { jsonSchemaTurnoEntrevista, turnoEntrevistaSchema } from '@turenta/shared';
import { NextResponse } from 'next/server';

import { obtenerLlm } from '@/server/composicion';

import type { RespuestasEntrevista } from '@turenta/core';
import type { TurnoEntrevista } from '@turenta/shared';

export const maxDuration = 120;

interface CuerpoEntrevista {
  mensajes: { rol: 'user' | 'assistant'; contenido: string }[];
  respuestas: RespuestasEntrevista;
  resumenDocumentos: string;
}

/** Un turno de la entrevista: el LLM conversa y captura datos estructurados a la vez. */
export async function POST(request: Request): Promise<NextResponse> {
  const cuerpo = (await request.json()) as CuerpoEntrevista;
  try {
    const turno = await ejecutarTurno(cuerpo);
    return NextResponse.json(turno);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error en la entrevista';
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}

async function ejecutarTurno(cuerpo: CuerpoEntrevista): Promise<TurnoEntrevista> {
  const ultimo = cuerpo.mensajes.at(-1);
  const historial = cuerpo.mensajes
    .slice(0, -1)
    .map((m) => `${m.rol === 'user' ? 'Usuario' : 'Tú'}: ${m.contenido}`)
    .join('\n');
  const bruto = await obtenerLlm().extraerEstructurado({
    system: construirSystem(cuerpo.respuestas, cuerpo.resumenDocumentos, historial),
    user: ultimo?.contenido ?? 'Hola, empecemos.',
    jsonSchema: jsonSchemaTurnoEntrevista as Record<string, unknown>,
    esfuerzo: 'low',
  });
  return turnoEntrevistaSchema.parse(bruto);
}

function construirSystem(respuestas: RespuestasEntrevista, resumenDocumentos: string, historial: string): string {
  return `Eres el entrevistador tributario de TuRenta AI (declaración de renta Colombia, año gravable 2025).
Tu trabajo: completar SOLO los datos que NO están en los documentos, conversando en español simple y cálido.

REGLA DE ORO — NO RE-PREGUNTAR LO YA CONOCIDO:
- Si un dato ya aparece en DOCUMENTOS o ya tiene valor distinto de cero en RESPUESTAS, NUNCA pidas que lo digite.
  En su lugar CONFÍRMALO citando el valor: "Según tu exógena, tus rendimientos de cesantías fueron $382.694 — ¿confirmas o lo ajustamos?".
- Si el usuario confirma, captura el campo con ese mismo valor en camposCapturados y pasa al siguiente tema.
- Si dice que falta algo, pregunta solo por lo adicional y suma.
- Agrupa varias confirmaciones simples en un mismo turno si son del mismo tema.

REGLAS GENERALES:
- Un solo tema por turno. Explica en una frase por qué importa (ej: "los dependientes te dan una deducción").
- NUNCA inventes ni asumas valores: solo captura lo que el usuario confirme o diga explícitamente.
- Montos en pesos enteros; tieneDependiente387: 1=sí 0=no.
- Bienes del usuario (casa, carro, cuentas con su valor) van en activosCapturados. Los saldos listados en la exógena ofréceselos para confirmar en bloque, no lo hagas digitarlos.
- Temas a cubrir (SALTA los que ya estén resueltos por documentos/respuestas): meses trabajados en 2025; dependientes económicos; medicina prepagada (si hay certificado, propón su valor); intereses de vivienda/ICETEX; GMF (4x1000) total del año; otros bienes y deudas al 31 de diciembre; declaraciones presentadas antes y el impuesto neto de la anterior.
- Al final pregunta: "¿Quieres agregar algo más que no esté en tus documentos?" y luego marca entrevistaCompleta=true.
- mensajeParaUsuario: máximo 3 frases.

DOCUMENTOS YA PROCESADOS Y DATOS PRECARGADOS:
${resumenDocumentos || '(ninguno aún)'}

ESTADO ACTUAL DE RESPUESTAS (valor ≠ 0 significa ya capturado/precargado):
${JSON.stringify(respuestas)}

CONVERSACIÓN PREVIA:
${historial || '(inicio de la conversación)'}`;
}
