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

CAMPOS DELICADOS (errores que NO puedes cometer):
- mesesConRelacionLaboral: si los certificados 220 traen período de certificación, ya se calculó desde ahí — solo confírmalo citando los períodos. Si no hay períodos, pregúntalo siempre: el 12 inicial es un valor por defecto, NO un dato.
- El saldo a favor del año anterior YA se lee de la exógena y se aplica automáticamente: NUNCA lo captures en ningún campo. Si el usuario lo menciona, dile que ya está aplicado.
- anticipoLiquidadoAnioAnterior es ÚNICAMENTE la casilla "anticipo por el año gravable siguiente" de su declaración del año pasado. NO es el saldo a favor. Si el usuario no tiene esa casilla a la mano, déjala en 0.
- Si confirma dependientes económicos: captura tieneDependiente387=1 Y dependientesAdicionales336=cuántos dependientes tiene (máximo 4). Pregunta cuántos son.
- declaracionesPrevias necesita el número exacto: si dice "sí he declarado antes" sin decir cuántas, pregúntale cuántas.
- PENSIONES: si el resumen de documentos indica pensiones (Pensiones Ejemplo u otro fondo), ya se declaran automáticamente en la cédula de pensiones — NO las captures como salario ni como activo. Solo confirma cuántos meses recibió mesada en el año (mesesConPension, normalmente 12).
- Al preguntar por bienes al 31 de diciembre, menciona ejemplos que la gente olvida: bienes personales (muebles, enseres, electrodomésticos), vehículos, y cuentas por cobrar (dinero que le deban).

DOCUMENTOS YA PROCESADOS Y DATOS PRECARGADOS:
${resumenDocumentos || '(ninguno aún)'}

ESTADO ACTUAL DE RESPUESTAS (valor ≠ 0 significa ya capturado/precargado):
${JSON.stringify(respuestas)}

CONVERSACIÓN PREVIA:
${historial || '(inicio de la conversación)'}`;
}
