'use client';

import { FileText, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { DeclaracionResumen } from '@turenta/core';

interface ResultadoBusqueda {
  clave: string;
  etiqueta: string;
  detalle: string;
  ruta: string;
}

const SECCIONES: ResultadoBusqueda[] = [
  { clave: 'panel', etiqueta: 'Dashboard', detalle: 'Resumen de tus declaraciones', ruta: '/panel' },
  { clave: 'declaraciones', etiqueta: 'Mis declaraciones', detalle: 'Historial y nuevas declaraciones', ruta: '/declaraciones' },
  { clave: 'nueva', etiqueta: 'Nueva declaración', detalle: 'Empezar una declaración', ruta: '/declaraciones' },
  { clave: 'calendario', etiqueta: 'Calendario tributario', detalle: 'Vencimientos oficiales DIAN', ruta: '/calendario' },
  { clave: 'facturacion', etiqueta: 'Facturación', detalle: 'Historial de pagos', ruta: '/facturacion' },
  { clave: 'plan', etiqueta: 'Plan y suscripción', detalle: 'Tu plan actual', ruta: '/plan' },
  { clave: 'configuracion', etiqueta: 'Configuración', detalle: 'Perfil y preferencias', ruta: '/configuracion' },
  { clave: 'ayuda', etiqueta: 'Centro de ayuda', detalle: 'Preguntas frecuentes y contacto', ruta: '/ayuda' },
];

export function PaletaBusqueda({ alCerrar }: { alCerrar: () => void }) {
  const router = useRouter();
  const [consulta, setConsulta] = useState('');
  const [declaraciones, setDeclaraciones] = useState<DeclaracionResumen[]>([]);

  useEffect(() => {
    void cargarDeclaraciones().then(setDeclaraciones);
  }, []);

  const resultados = filtrar(consulta, declaraciones);
  const abrir = (ruta: string) => {
    alCerrar();
    router.push(ruta);
  };
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-4 pt-24" role="dialog" aria-modal>
      <button type="button" aria-label="Cerrar búsqueda" onClick={alCerrar} className="absolute inset-0 cursor-default" />
      <div className="relative w-full max-w-lg rounded-2xl border border-borde bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-borde px-4">
          <Search size={16} className="text-texto-suave" aria-hidden />
          <input
            autoFocus
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => manejarTeclas(e.key, resultados, abrir, alCerrar)}
            placeholder="Buscar secciones, declaraciones, acciones…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <ListaResultados resultados={resultados} alAbrir={abrir} />
      </div>
    </div>
  );
}

function ListaResultados({
  resultados,
  alAbrir,
}: {
  resultados: ResultadoBusqueda[];
  alAbrir: (ruta: string) => void;
}) {
  if (resultados.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-texto-suave">Sin resultados para esa búsqueda.</p>;
  }
  return (
    <ul className="max-h-80 overflow-y-auto p-1.5">
      {resultados.map((r) => (
        <li key={r.clave}>
          <button
            type="button"
            onClick={() => alAbrir(r.ruta)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primario-suave"
          >
            <FileText size={16} className="shrink-0 text-texto-suave" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{r.etiqueta}</span>
              <span className="block truncate text-xs text-texto-suave">{r.detalle}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function manejarTeclas(
  tecla: string,
  resultados: ResultadoBusqueda[],
  abrir: (ruta: string) => void,
  cerrar: () => void,
): void {
  if (tecla === 'Escape') {
    cerrar();
    return;
  }
  const primero = resultados[0];
  if (tecla === 'Enter' && primero) {
    abrir(primero.ruta);
  }
}

function filtrar(consulta: string, declaraciones: DeclaracionResumen[]): ResultadoBusqueda[] {
  const texto = consulta.trim().toLowerCase();
  const deDeclaraciones = declaraciones.map(aResultado);
  const todo = [...SECCIONES, ...deDeclaraciones];
  if (!texto) {
    return todo.slice(0, 8);
  }
  return todo.filter((r) => `${r.etiqueta} ${r.detalle}`.toLowerCase().includes(texto)).slice(0, 8);
}

function aResultado(d: DeclaracionResumen): ResultadoBusqueda {
  return {
    clave: `decl-${d.id}`,
    etiqueta: `Declaración ${String(d.anioGravable)} — ${d.titular.nombres} ${d.titular.apellidos}`,
    detalle: d.titular.esPropia ? 'A nombre propio' : `C.C. ${d.titular.identificacion}`,
    ruta: '/declaraciones',
  };
}

async function cargarDeclaraciones(): Promise<DeclaracionResumen[]> {
  const respuesta = await fetch('/api/declaraciones').catch(() => null);
  if (!respuesta?.ok) {
    return [];
  }
  const cuerpo = (await respuesta.json()) as { declaraciones: DeclaracionResumen[] };
  return cuerpo.declaraciones;
}
