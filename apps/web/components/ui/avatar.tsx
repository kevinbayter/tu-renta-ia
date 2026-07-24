'use client';

import { useState } from 'react';

const TAMANOS = { sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' };

/** Círculo con iniciales; si se pasa una URL de foto, la intenta y cae a iniciales si falla. */
export function Avatar({
  nombre,
  tamano = 'md',
  fotoUrl,
}: {
  nombre: string;
  tamano?: keyof typeof TAMANOS;
  fotoUrl?: string;
}) {
  const [fotoFallo, setFotoFallo] = useState(false);
  const clases = TAMANOS[tamano];
  if (fotoUrl && !fotoFallo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- la foto viene de nuestra propia API con bytes en BD
      <img
        src={fotoUrl}
        alt=""
        aria-hidden
        onError={() => setFotoFallo(true)}
        className={`shrink-0 rounded-full object-cover ${clases}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-primario-suave font-bold text-primario ${clases}`}
    >
      {iniciales(nombre)}
    </span>
  );
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const primera = partes[0]?.[0] ?? '?';
  const segunda = partes[1]?.[0] ?? '';
  return `${primera}${segunda}`.toUpperCase();
}
