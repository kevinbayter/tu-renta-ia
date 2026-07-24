'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PaginaIngresar() {
  const [fase, setFase] = useState<'email' | 'codigo' | 'perfil'>('email');
  const [email, setEmail] = useState('');
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <h1 className="text-3xl font-bold">{fase === 'perfil' ? 'Completa tu perfil' : 'Ingresa a tu cuenta'}</h1>
      <p className="mt-2 text-sm text-texto-suave">
        {fase === 'perfil'
          ? 'Con tus datos preparamos tus declaraciones a nombre propio sin volver a pedírtelos.'
          : 'Sin contraseñas: te enviamos un código de 6 dígitos a tu correo para guardar tu avance en la nube.'}
      </p>
      {fase === 'email' && (
        <FormularioEmail email={email} setEmail={setEmail} alEnviar={() => setFase('codigo')} />
      )}
      {fase === 'codigo' && (
        <FormularioCodigo email={email} alVolver={() => setFase('email')} alFaltarPerfil={() => setFase('perfil')} />
      )}
      {fase === 'perfil' && <FormularioPerfil />}
    </main>
  );
}

function FormularioPerfil() {
  const router = useRouter();
  const [datos, setDatos] = useState({ nombres: '', apellidos: '', identificacion: '' });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const guardar = async () => {
    setCargando(true);
    setError(null);
    const respuesta = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    }).catch(() => null);
    setCargando(false);
    if (!respuesta?.ok) {
      setError('Revisa los datos: nombres, apellidos y una cédula válida.');
      return;
    }
    router.push('/declaraciones');
  };

  return (
    <div className="mt-6 space-y-3">
      <CampoPerfil etiqueta="Nombre(s)" valor={datos.nombres} alCambiar={(v) => setDatos({ ...datos, nombres: v })} />
      <CampoPerfil etiqueta="Apellidos" valor={datos.apellidos} alCambiar={(v) => setDatos({ ...datos, apellidos: v })} />
      <CampoPerfil
        etiqueta="Cédula (sin puntos)"
        valor={datos.identificacion}
        alCambiar={(v) => setDatos({ ...datos, identificacion: v.replace(/\D/g, '') })}
        numerico
      />
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <button
        type="button"
        onClick={() => void guardar()}
        disabled={cargando}
        className="h-12 w-full rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {cargando ? 'Guardando…' : 'Guardar y continuar'}
      </button>
    </div>
  );
}

function CampoPerfil({
  etiqueta,
  valor,
  alCambiar,
  numerico,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  numerico?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
      <input
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        inputMode={numerico ? 'numeric' : 'text'}
        className="mt-1 h-12 w-full rounded-2xl border border-borde bg-card px-4 outline-none focus:border-primario"
      />
    </label>
  );
}

function FormularioEmail({
  email,
  setEmail,
  alEnviar,
}: {
  email: string;
  setEmail: (v: string) => void;
  alEnviar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    setCargando(true);
    setError(null);
    const respuesta = await fetch('/api/auth/solicitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setCargando(false);
    if (!respuesta?.ok) {
      setError('No pudimos enviar el código. Revisa el correo e intenta de nuevo.');
      return;
    }
    alEnviar();
  };

  return (
    <div className="mt-6">
      <label className="block">
        <span className="text-xs font-medium text-texto-suave">Tu correo</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void enviar()}
          placeholder="tu@correo.com"
          autoFocus
          className="mt-1 h-12 w-full rounded-2xl border border-borde bg-card px-4 outline-none focus:border-primario"
        />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
      <button
        type="button"
        onClick={() => void enviar()}
        disabled={cargando || !email.includes('@')}
        className="mt-4 h-12 w-full rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {cargando ? 'Enviando…' : 'Enviarme el código'}
      </button>
    </div>
  );
}

function FormularioCodigo({
  email,
  alVolver,
  alFaltarPerfil,
}: {
  email: string;
  alVolver: () => void;
  alFaltarPerfil: () => void;
}) {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const verificar = async () => {
    setCargando(true);
    setError(null);
    const respuesta = await fetch('/api/auth/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo }),
    }).catch(() => null);
    setCargando(false);
    if (!respuesta?.ok) {
      setError('Código inválido o vencido. Pide uno nuevo si pasaron más de 10 minutos.');
      return;
    }
    const cuerpo = (await respuesta.json()) as { perfilCompleto?: boolean };
    if (!cuerpo.perfilCompleto) {
      alFaltarPerfil();
      return;
    }
    router.push('/declaraciones');
  };

  return (
    <div className="mt-6">
      <p className="text-sm">
        Enviamos un código a <strong>{email}</strong>{' '}
        <button type="button" onClick={alVolver} className="text-primario underline">
          cambiar
        </button>
      </p>
      <input
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={(e) => e.key === 'Enter' && void verificar()}
        inputMode="numeric"
        placeholder="······"
        autoFocus
        aria-label="Código de 6 dígitos"
        className="mt-3 h-14 w-full rounded-2xl border border-borde bg-card text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-primario"
      />
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
      <button
        type="button"
        onClick={() => void verificar()}
        disabled={cargando || codigo.length !== 6}
        className="mt-4 h-12 w-full rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
      >
        {cargando ? 'Verificando…' : 'Ingresar'}
      </button>
    </div>
  );
}
