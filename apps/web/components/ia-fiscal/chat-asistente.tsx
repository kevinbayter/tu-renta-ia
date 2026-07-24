'use client';

import { SendHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Mensaje {
  rol: 'user' | 'assistant';
  contenido: string;
}

/** Chat del Asistente Fiscal: responde con el contexto real del usuario (server-side). */
export function ChatAsistente({ preguntaInicial }: { preguntaInicial?: string }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const inicialEnviada = useRef(false);

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || pensando) {
      return;
    }
    const conversacion: Mensaje[] = [...mensajes, { rol: 'user', contenido: limpio }];
    setMensajes(conversacion);
    setTexto('');
    setPensando(true);
    const respuesta = await pedirRespuesta(conversacion);
    setMensajes([...conversacion, { rol: 'assistant', contenido: respuesta }]);
    setPensando(false);
  };

  useEffect(() => {
    if (preguntaInicial && !inicialEnviada.current) {
      inicialEnviada.current = true;
      void enviar(preguntaInicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con la pregunta del enlace
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length, pensando]);

  return (
    <section className="flex h-[520px] flex-col rounded-3xl border border-borde bg-card p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Sparkles size={17} className="text-primario" aria-hidden /> Asistente Fiscal IA
        <span className="rounded-md bg-primario-suave px-1.5 py-0.5 text-[10px] font-bold text-primario">Beta</span>
      </h2>
      <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-background p-3">
        {mensajes.length === 0 && (
          <p className="p-3 text-sm text-texto-suave">
            Pregúntame lo que quieras sobre tu declaración de renta. Conozco tus declaraciones guardadas y
            respondo con orientación general — el cálculo exacto siempre lo hace el motor.
          </p>
        )}
        {mensajes.map((m, i) => (
          <Burbuja key={i} mensaje={m} />
        ))}
        {pensando && <Burbuja mensaje={{ rol: 'assistant', contenido: '…' }} />}
        <div ref={finRef} />
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="h-11 flex-1 rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
        />
        <button
          type="submit"
          disabled={pensando || !texto.trim()}
          aria-label="Enviar"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primario text-white transition hover:bg-primario-oscuro disabled:opacity-40"
        >
          <SendHorizontal size={17} aria-hidden />
        </button>
      </form>
      <p className="mt-2 text-[11px] text-texto-suave">
        Responde con tu contexto real; los cálculos exactos siempre los hace el motor determinista.
      </p>
    </section>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const propio = mensaje.rol === 'user';
  return (
    <div className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          propio ? 'bg-primario text-white' : 'border border-borde bg-card'
        }`}
      >
        {mensaje.contenido}
      </p>
    </div>
  );
}

async function pedirRespuesta(mensajes: Mensaje[]): Promise<string> {
  const respuesta = await fetch('/api/asistente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensajes }),
  }).catch(() => null);
  if (!respuesta?.ok) {
    return 'No pude responder en este momento. Intenta de nuevo en un minuto.';
  }
  const cuerpo = (await respuesta.json()) as { respuesta?: string };
  return cuerpo.respuesta ?? 'No pude responder en este momento.';
}
