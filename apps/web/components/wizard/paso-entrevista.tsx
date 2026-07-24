'use client';

import { useEffect, useRef, useState } from 'react';

import { useDeclaracion } from '@/lib/store';
import { formatearPesos } from '@/lib/tipos';

import type { RespuestasEntrevista } from '@/lib/tipos';
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
  return documentos
    .map((d) => {
      if (d.tipo === 'certificado_220') {
        return `220 de NIT ${d.datos.nitRetenedor}: ingresos ${formatearPesos(d.datos.totalIngresosBrutos)}`;
      }
      if (d.tipo === 'certificado_bancario') {
        return `Bancario ${d.datos.entidad}: rendimientos ${formatearPesos(d.datos.rendimientos)}`;
      }
      if (d.tipo === 'medicina_prepagada') {
        return `Prepagada ${d.datos.entidad}: ${d.datos.amparos.length} amparo(s)`;
      }
      if (d.tipo === 'exogena') {
        return `Exógena AG${d.exogena.anioGravable} con ${d.exogena.filas.length} reportes`;
      }
      return null;
    })
    .filter(Boolean)
    .join(' | ');
}
