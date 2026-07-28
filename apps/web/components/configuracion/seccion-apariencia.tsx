'use client';

import { useEffect, useState } from 'react';

type Tema = 'light' | 'dark' | 'auto';

const OPCIONES: { valor: Tema; etiqueta: string; icono: string }[] = [
  { valor: 'light', etiqueta: 'Claro', icono: '☀️' },
  { valor: 'dark', etiqueta: 'Oscuro', icono: '🌙' },
  { valor: 'auto', etiqueta: 'Auto', icono: '🖥️' },
];

/** Lee el tema guardado; el valor por defecto es claro. */
function leerTema(): Tema {
  const guardado = typeof window === 'undefined' ? null : window.localStorage.getItem('tema');
  return guardado === 'dark' || guardado === 'auto' ? guardado : 'light';
}

function claseBoton(activo: boolean): string {
  const base = 'flex flex-col items-center gap-1 rounded-2xl border px-3 py-4 text-sm font-medium transition';
  const activa = 'border-primario bg-primario-suave text-primario';
  const inactiva = 'border-borde bg-background text-texto-suave hover:border-primario';
  return `${base} ${activo ? activa : inactiva}`;
}

/** Selector de tema (claro / oscuro / auto). Persiste en localStorage y aplica el
 *  atributo data-theme que consume globals.css. Este componente solo se monta en
 *  cliente (la página de ajustes es autenticada), así que no hay desajuste de SSR. */
export function SeccionApariencia() {
  const [tema, setTema] = useState<Tema>(leerTema);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    window.localStorage.setItem('tema', tema);
  }, [tema]);

  return (
    <section className="mt-6 rounded-3xl border border-borde bg-card p-5">
      <h2 className="font-semibold">Apariencia</h2>
      <p className="mt-0.5 text-xs text-texto-suave">
        Elige el tema de la interfaz. «Auto» sigue la configuración de tu sistema.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setTema(opcion.valor)}
            aria-pressed={tema === opcion.valor}
            className={claseBoton(tema === opcion.valor)}
          >
            <span className="text-xl" aria-hidden="true">
              {opcion.icono}
            </span>
            {opcion.etiqueta}
          </button>
        ))}
      </div>
    </section>
  );
}
