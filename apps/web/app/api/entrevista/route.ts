import { jsonSchemaTurnoEntrevista, turnoEntrevistaSchema } from '@turenta/shared';
import { NextResponse } from 'next/server';

import { obtenerLlm } from '@/server/composicion';
import { permitir } from '@/server/rate-limit';
import { leerSesion } from '@/server/sesion';

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
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  // Each turn calls the model: without a per-user cap an authenticated account
  // could still be scripted to burn tokens.
  if (!permitir(`entrevista:${sesion.usuarioId}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Vas muy rápido, espera un momento.' }, { status: 429 });
  }
  const cuerpo = (await request.json().catch(() => null)) as CuerpoEntrevista | null;
  if (!cuerpo) {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 });
  }
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
- INGRESOS NO LABORALES (arriendos/mandato): si el resumen los indica, YA vienen precargados y DEDUPLICADOS (el mismo ingreso suele aparecer dos veces en exógena: inmobiliaria + pagador). Confirma el valor en ingresosNoLaborales — NUNCA lo dupliques — y pregunta por costos con soporte (predial del inmueble arrendado, administración) para costosNoLaborales.
- DONACIONES (donacionesEsal): pregunta si donó a alguna fundación o entidad sin ánimo de lucro Y tiene el certificado de la donación. Solo captura el valor si confirma que tiene el certificado — sin él la DIAN rechaza el descuento.
- PATRIMONIO DEL AÑO ANTERIOR (patrimonioLiquidoAnterior): si YA viene precargado desde su declaración anterior (verás "DECLARACIÓN ANTERIOR YA LEÍDA" en los documentos), NO lo preguntes — ya está resuelto. Solo si NO está: menciónale de forma tranquila que si tiene a mano el PDF de su declaración del año pasado puede subirlo y tomamos los datos de ahí (es opcional); si no la tiene, pregúntale el patrimonio líquido (casilla 31) SIN alarmarlo — explica que sirve para que su declaración cuadre con la anterior, nunca hables de sanciones ni requerimientos. Si su patrimonio creció mucho más que sus ingresos, pregunta por herencias, préstamos recibidos, gananciales o valorizaciones y captúralos en justificacionesPatrimoniales.
- Al preguntar por bienes al 31 de diciembre, menciona ejemplos que la gente olvida: bienes personales (muebles, enseres, electrodomésticos), vehículos, y cuentas por cobrar (dinero que le deban).

EVENTOS DEL AÑO (obligatorio, ANTES de cerrar la entrevista):
- Pregunta UNA sola vez, agrupado y en lenguaje simple, si durante el año gravable el usuario:
  1. Vendió casa, apartamento, carro u otro activo (eventoVentaActivos).
  2. Recibió herencia, legado o donación (eventoHerenciaODonacion).
  3. Ganó premios de lotería, rifas o apuestas, incluidas apps como BetPlay (eventoPremiosOApuestas).
  4. Tiene o vendió criptomonedas (eventoCripto).
  5. Tiene cuentas o bienes fuera de Colombia: Wise, Payoneer, PayPal, brokers, inmuebles (eventoActivosExterior).
  6. Recibió ingresos desde el exterior: freelance, salarios en divisas, YouTube/plataformas extranjeras (eventoIngresosExterior).
  7. Recibió dividendos de empresas (eventoDividendos).
- Captura cada uno como 1 (sí) o 0 (no) según lo que responda. No pidas montos ni detalles: solo el sí/no.
- Si alguno es SÍ, dile con total franqueza: "TuRenta todavía no liquida ese caso; tu declaración quedará marcada como incompleta y no podrás descargar el borrador — para ese punto necesitas un contador". NUNCA minimices esto ni sugieras omitirlo.
- Ingresos por trabajos en plataformas NACIONALES (Rappi, ventas por internet en Colombia) sí los cubrimos: captúralos en ingresosNoLaborales con sus costos en costosNoLaborales.

DOCUMENTOS YA PROCESADOS Y DATOS PRECARGADOS:
${resumenDocumentos || '(ninguno aún)'}

ESTADO ACTUAL DE RESPUESTAS (valor ≠ 0 significa ya capturado/precargado):
${JSON.stringify(respuestas)}

CONVERSACIÓN PREVIA:
${historial || '(inicio de la conversación)'}`;
}
