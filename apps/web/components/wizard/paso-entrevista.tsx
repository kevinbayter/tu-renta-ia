'use client';

import {
  pensionesSinCertificado,
  precargarDesdeExogena,
  rendimientosBancariosSinCertificado,
  saldosBancariosSinCertificado,
} from '@turenta/core';
import { useEffect, useRef, useState } from 'react';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { DocumentoProcesado, RespuestasEntrevista } from '@/lib/tipos';
import type { TurnoEntrevista } from '@turenta/shared';

export function PasoEntrevista() {
  const { mensajes, entrevistaCompleta } = useDeclaracion();
  const irAPaso = useDeclaracion((s) => s.irAPaso);
  const [pensando, setPensando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length, pensando]);

  return (
    <section aria-label="Entrevista" className="flex h-full flex-col">
      <h2 className="text-2xl font-bold">Cuéntanos lo que falta</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Los documentos ya nos dieron tus ingresos. Ahora unas preguntas cortas para encontrar tus deducciones.
      </p>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-borde bg-card p-4">
        {mensajes.length === 0 && <IniciadorEntrevista setPensando={setPensando} />}
        {mensajes.map((m, i) => (
          <Burbuja key={i} rol={m.rol} contenido={m.contenido} />
        ))}
        {pensando && <Burbuja rol="assistant" contenido="…" />}
        <div ref={finRef} />
      </div>
      <EntradaChat pensando={pensando} setPensando={setPensando} />
      <button
        type="button"
        onClick={() => irAPaso('revision')}
        className={`mt-3 h-12 w-full rounded-2xl font-semibold transition ${
          entrevistaCompleta
            ? 'bg-primario text-white hover:bg-primario-oscuro'
            : 'border border-borde bg-card text-texto-suave'
        }`}
      >
        {entrevistaCompleta ? 'Ver mi resumen →' : 'Saltar a revisión (puedes completar datos allá)'}
      </button>
    </section>
  );
}

function Burbuja({ rol, contenido }: { rol: 'user' | 'assistant'; contenido: string }) {
  const esUsuario = rol === 'user';
  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
          esUsuario ? 'bg-primario text-white' : 'bg-primario-suave text-foreground'
        }`}
      >
        {contenido}
      </p>
    </div>
  );
}

function IniciadorEntrevista({ setPensando }: { setPensando: (v: boolean) => void }) {
  const disparado = useRef(false);
  useEffect(() => {
    if (disparado.current) {
      return;
    }
    disparado.current = true;
    void enviarTurno('Hola, empecemos.', setPensando, true);
  }, [setPensando]);
  return <p className="text-sm text-texto-suave">Iniciando entrevista…</p>;
}

function EntradaChat({ pensando, setPensando }: { pensando: boolean; setPensando: (v: boolean) => void }) {
  const [texto, setTexto] = useState('');
  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio || pensando) {
      return;
    }
    setTexto('');
    void enviarTurno(limpio, setPensando, false);
  };
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && enviar()}
        placeholder="Escribe tu respuesta…"
        aria-label="Tu respuesta"
        className="h-12 flex-1 rounded-2xl border border-borde bg-card px-4 text-sm outline-none focus:border-primario"
      />
      <button
        type="button"
        onClick={enviar}
        disabled={pensando}
        className="h-12 rounded-2xl bg-primario px-5 font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        Enviar
      </button>
    </div>
  );
}

async function enviarTurno(texto: string, setPensando: (v: boolean) => void, esInicio: boolean): Promise<void> {
  const estado = useDeclaracion.getState();
  if (!esInicio) {
    estado.agregarMensaje({ rol: 'user', contenido: texto });
  }
  setPensando(true);
  try {
    const turno = await pedirTurno(texto);
    aplicarTurno(turno);
  } catch {
    useDeclaracion.getState().agregarMensaje({
      rol: 'assistant',
      contenido: 'Ups, tuve un problema de conexión. ¿Me repites tu última respuesta?',
    });
  }
  setPensando(false);
}

async function pedirTurno(texto: string): Promise<TurnoEntrevista> {
  const estado = useDeclaracion.getState();
  const respuesta = await fetch('/api/entrevista', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mensajes: [...estado.mensajes.map((m) => ({ rol: m.rol, contenido: m.contenido })), { rol: 'user', contenido: texto }],
      respuestas: estado.respuestas,
      resumenDocumentos: resumirDocumentos(),
    }),
  });
  if (!respuesta.ok) {
    throw new Error('turno fallido');
  }
  return (await respuesta.json()) as TurnoEntrevista;
}

function aplicarTurno(turno: TurnoEntrevista): void {
  const estado = useDeclaracion.getState();
  estado.agregarMensaje({ rol: 'assistant', contenido: turno.mensajeParaUsuario });
  const parcial: Partial<RespuestasEntrevista> = {};
  for (const captura of turno.camposCapturados) {
    asignarCampo(parcial, captura.campo, captura.valor);
  }
  if (Object.keys(parcial).length > 0) {
    estado.actualizarRespuestas(parcial);
  }
  for (const activo of turno.activosCapturados) {
    estado.agregarActivoManual(activo.descripcion, activo.valor);
  }
  if (turno.entrevistaCompleta) {
    estado.marcarEntrevistaCompleta();
  }
}

function asignarCampo(parcial: Partial<RespuestasEntrevista>, campo: string, valor: number): void {
  if (campo === 'tieneDependiente387') {
    parcial.tieneDependiente387 = valor === 1;
    return;
  }
  (parcial as Record<string, number>)[campo] = valor;
}

function resumirDocumentos(): string {
  const documentos = useDeclaracion.getState().documentos;
  const resumenes = documentos.map((d) => resumirDocumento(d)).filter(Boolean);
  const extras = [resumirBancosSinCertificado(documentos), resumirPensiones(documentos)];
  return [...resumenes, ...extras.filter(Boolean)].join('\n');
}

/** Pensiones detectadas en la exógena: ya van a la cédula de pensiones; la IA solo confirma meses. */
function resumirPensiones(documentos: DocumentoProcesado[]): string | null {
  const exogena = documentos.find((d) => d.tipo === 'exogena');
  if (exogena?.tipo !== 'exogena') {
    return null;
  }
  const conPension = documentos
    .filter((d): d is Extract<DocumentoProcesado, { tipo: 'certificado_220' }> => d.tipo === 'certificado_220')
    .filter((d) => (d.datos.pagosPension ?? 0) > 0)
    .map((d) => d.datos.razonSocial);
  const pensiones = pensionesSinCertificado(exogena.exogena, conPension);
  if (pensiones.ingresosBrutos === 0) {
    return null;
  }
  return `PENSIONES REPORTADAS EN EXÓGENA (${pensiones.entidades.join(', ')}): ${formatearPesos(pensiones.ingresosBrutos)} — YA se declaran en la cédula de pensiones con su exención de ley; NO las captures como salario ni activo. Solo confirma cuántos meses recibió mesada (mesesConPension).`;
}

/** Sin certificado bancario, los valores salen de la exógena: el motor ya los cuenta. */
function resumirBancosSinCertificado(documentos: DocumentoProcesado[]): string | null {
  const exogena = documentos.find((d) => d.tipo === 'exogena');
  if (exogena?.tipo !== 'exogena') {
    return null;
  }
  const entidades = documentos
    .filter((d): d is Extract<DocumentoProcesado, { tipo: 'certificado_bancario' }> => d.tipo === 'certificado_bancario')
    .map((d) => d.datos.entidad);
  const saldos = saldosBancariosSinCertificado(exogena.exogena, entidades);
  const rendimientos = rendimientosBancariosSinCertificado(exogena.exogena, entidades);
  if (saldos.length === 0 && rendimientos === 0) {
    return null;
  }
  const listaSaldos = saldos.map((s) => `${s.descripcion}: ${formatearPesos(s.valor)}`).join('; ');
  return `BANCOS SIN CERTIFICADO — valores tomados automáticamente de la exógena y YA CONTADOS (solo informa al usuario, NO los captures como activos ni rendimientos): saldos [${listaSaldos || 'ninguno'}], rendimientos ${formatearPesos(rendimientos)}.`;
}

function resumirDocumento(d: DocumentoProcesado): string | null {
  if (d.tipo === 'certificado_220') {
    const periodo = d.datos.periodoInicio && d.datos.periodoFin ? ` período ${d.datos.periodoInicio} a ${d.datos.periodoFin},` : '';
    return `Certificado 220 de NIT ${d.datos.nitRetenedor}:${periodo} ingresos brutos ${formatearPesos(d.datos.totalIngresosBrutos)}, aportes salud+pensión ${formatearPesos(d.datos.aportesSalud + d.datos.aportesPension)}, retención ${formatearPesos(d.datos.retencionFuente)}.`;
  }
  if (d.tipo === 'certificado_bancario') {
    return `Certificado bancario ${d.datos.entidad}: saldo 31-dic ${formatearPesos(d.datos.saldoCuentas)} (ya contado como activo), rendimientos ${formatearPesos(d.datos.rendimientos)}, GMF ${formatearPesos(d.datos.gmf)} (parcial: confirma el GMF TOTAL del año con el usuario), retención ${formatearPesos(d.datos.retencionFuente)}.`;
  }
  if (d.tipo === 'medicina_prepagada') {
    const amparos = d.datos.amparos.map((a) => `${formatearPesos(a.valor)} (${a.vigenciaInicio}→${a.vigenciaFin})`).join(', ');
    return `Certificado medicina prepagada ${d.datos.entidad}: ${amparos}. Propón el valor que corresponde al año gravable y pide confirmación.`;
  }
  if (d.tipo === 'declaracion_anterior') {
    return `DECLARACIÓN ANTERIOR YA LEÍDA (año ${String(d.datos.anioGravable)}): patrimonio líquido ${formatearPesos(d.datos.patrimonioLiquido)}, impuesto neto ${formatearPesos(d.datos.impuestoNetoRenta)}, anticipo ${formatearPesos(d.datos.anticipoAnioSiguiente)}. NO preguntes estos datos: ya están capturados.`;
  }
  if (d.tipo === 'exogena') {
    return precargarDesdeExogena(d.exogena).resumen;
  }
  return null;
}
