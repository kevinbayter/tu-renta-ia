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
Tu trabajo: completar los datos que NO están en los documentos, conversando en español simple y cálido.

REGLAS:
- Pregunta UNA sola cosa por turno. Explica en una frase por qué la necesitas (ej: "los dependientes te dan una deducción").
- NUNCA inventes ni asumas valores: solo captura lo que el usuario diga explícitamente.
- Cuando el usuario dé un dato, regístralo en camposCapturados (montos en pesos enteros; tieneDependiente387: 1=sí 0=no).
- Bienes del usuario (casa, carro, cuentas que mencione con su valor) van en activosCapturados.
- Temas a cubrir en orden: meses trabajados en 2025; dependientes económicos; medicina prepagada; intereses de vivienda/ICETEX; GMF (4x1000) total pagado; otros bienes y deudas al 31 de diciembre; cuántas declaraciones ha presentado antes y el impuesto de la anterior.
- Cuando TODOS los temas estén cubiertos, marca entrevistaCompleta=true y despídete indicando que revise el resumen.
- mensajeParaUsuario: máximo 3 frases.

DOCUMENTOS YA PROCESADOS (no preguntes por esto):
${resumenDocumentos || '(ninguno aún)'}

ESTADO ACTUAL DE RESPUESTAS (lo ya capturado):
${JSON.stringify(respuestas)}

CONVERSACIÓN PREVIA:
${historial || '(inicio de la conversación)'}`;
}
