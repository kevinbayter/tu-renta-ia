'use client';

import { useRef, useState } from 'react';

import { Avatar } from '@/components/ui/avatar';

/** Foto de perfil opcional (máx. 200 KB, guardada en la base; iniciales por defecto). */
export function SeccionAvatar({ nombre }: { nombre: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  const subir = async (archivos: FileList | null) => {
    const archivo = archivos?.[0];
    if (!archivo) {
      return;
    }
    const formData = new FormData();
    formData.append('foto', archivo);
    const respuesta = await fetch('/api/avatar', { method: 'POST', body: formData }).catch(() => null);
    const cuerpo = respuesta && !respuesta.ok ? ((await respuesta.json()) as { error?: string }) : null;
    setAviso(respuesta?.ok ? '✓ Foto actualizada' : (cuerpo?.error ?? 'No se pudo subir la foto'));
    setVersion((v) => v + 1);
    setTimeout(() => setAviso(null), 3500);
  };

  const quitar = async () => {
    await fetch('/api/avatar', { method: 'DELETE' }).catch(() => null);
    setVersion((v) => v + 1);
  };

  return (
    <section className="mt-6 rounded-3xl border border-borde bg-card p-5">
      <h2 className="font-semibold">Foto de perfil</h2>
      <p className="mt-0.5 text-xs text-texto-suave">Opcional: si no subes foto, mostramos tus iniciales.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar key={version} nombre={nombre} tamano="lg" fotoUrl={`/api/avatar?v=${String(version)}`} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-primario-suave px-4 py-2 text-sm font-semibold text-primario"
        >
          Subir foto (máx. 200 KB)
        </button>
        <button type="button" onClick={() => void quitar()} className="text-sm text-texto-suave underline">
          Quitar foto
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => void subir(e.target.files)} />
        {aviso && <span className="text-sm text-exito">{aviso}</span>}
      </div>
    </section>
  );
}
