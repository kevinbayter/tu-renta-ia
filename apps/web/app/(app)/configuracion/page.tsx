'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SeccionApariencia } from '@/components/configuracion/seccion-apariencia';
import { SeccionAvatar } from '@/components/configuracion/seccion-avatar';
import { SeccionNotificaciones } from '@/components/configuracion/seccion-notificaciones';
import { DialogoConfirmar } from '@/components/ui/dialogo-confirmar';
import { useSesionCliente } from '@/lib/sesion-cliente';

const CAMPOS = [
  { campo: 'nombres', etiqueta: 'Nombres' },
  { campo: 'apellidos', etiqueta: 'Apellidos' },
  { campo: 'identificacion', etiqueta: 'Número de cédula (sin puntos)' },
] as const;

type DatosPerfil = Record<(typeof CAMPOS)[number]['campo'], string>;

export default function PaginaConfiguracion() {
  const sesion = useSesionCliente();
  if (sesion.fase === 'anonimo') {
    return <AvisoSinSesion />;
  }
  if (sesion.fase === 'cargando') {
    return <main className="flex-1 px-6 py-10 text-sm text-texto-suave">Cargando…</main>;
  }
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Configuración</h1>
      <p className="mt-1 text-sm text-texto-suave">Tu cuenta: {sesion.email}</p>
      <FormularioPerfil inicial={sesion.perfil ?? { nombres: '', apellidos: '', identificacion: '' }} />
      <SeccionAvatar nombre={`${sesion.perfil?.nombres ?? ''} ${sesion.perfil?.apellidos ?? ''}`.trim() || sesion.email} />
      <SeccionNotificaciones />
      <SeccionApariencia />
      <ZonaPeligro />
    </main>
  );
}

/** Solo se monta cuando el perfil ya cargó, así que el estado inicial es el definitivo. */
function FormularioPerfil({ inicial }: { inicial: DatosPerfil }) {
  const [datos, setDatos] = useState<DatosPerfil>(inicial);
  const [aviso, setAviso] = useState<string | null>(null);

  const guardar = async () => {
    const respuesta = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    }).catch(() => null);
    const cuerpo = respuesta ? ((await respuesta.json()) as { error?: string }) : null;
    setAviso(respuesta?.ok ? '✓ Datos guardados' : (cuerpo?.error ?? 'No se pudo guardar'));
    setTimeout(() => setAviso(null), 3500);
  };

  return (
    <section className="mt-6 rounded-3xl border border-borde bg-card p-5">
      <h2 className="font-semibold">Datos personales</h2>
      <p className="mt-0.5 text-xs text-texto-suave">
        Se usan como titular cuando declaras a tu nombre y para calcular tu fecha límite.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {CAMPOS.map(({ campo, etiqueta }) => (
          <label key={campo} className="block">
            <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
            <input
              value={datos[campo]}
              onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
              inputMode={campo === 'identificacion' ? 'numeric' : 'text'}
              className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void guardar()}
          className="rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primario-oscuro"
        >
          Guardar cambios
        </button>
        {aviso && <span className="text-sm text-exito">{aviso}</span>}
      </div>
    </section>
  );
}

function ZonaPeligro() {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const eliminar = async () => {
    await fetch('/api/cuenta', { method: 'DELETE' }).catch(() => null);
    router.push('/');
    router.refresh();
  };
  return (
    <section className="mt-6 rounded-3xl border border-error/30 bg-card p-5">
      <h2 className="font-semibold text-error">Eliminar mi cuenta</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Borra tu cuenta con todas tus declaraciones y datos, de inmediato y para siempre (Ley 1581 de 2012,
        derecho de supresión).
      </p>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="mt-4 rounded-xl border border-error px-4 py-2 text-sm font-semibold text-error transition hover:bg-alerta-suave"
      >
        Eliminar cuenta y todos mis datos
      </button>
      {confirmando && (
        <DialogoConfirmar
          titulo="¿Eliminar tu cuenta completa?"
          descripcion="Se borrarán tu cuenta, tus declaraciones y todos tus datos. Esta acción es irreversible."
          textoConfirmar="Sí, eliminar todo"
          alConfirmar={() => void eliminar()}
          alCancelar={() => setConfirmando(false)}
        />
      )}
    </section>
  );
}

function AvisoSinSesion() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 text-center">
      <p className="text-lg font-semibold">Inicia sesión para ver tu configuración</p>
      <Link href="/ingresar" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primario px-6 font-semibold text-white">
        Ingresar
      </Link>
    </main>
  );
}
