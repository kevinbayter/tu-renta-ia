'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PaginaIngresar() {
  const [fase, setFase] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <h1 className="text-3xl font-bold">Ingresa a tu cuenta</h1>
      <p className="mt-2 text-sm text-texto-suave">
        Sin contraseñas: te enviamos un código de 6 dígitos a tu correo para guardar tu avance en la nube.
      </p>
      {fase === 'email' ? (
        <FormularioEmail email={email} setEmail={setEmail} alEnviar={() => setFase('codigo')} />
      ) : (
        <FormularioCodigo email={email} alVolver={() => setFase('email')} />
      )}
    </main>
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

function FormularioCodigo({ email, alVolver }: { email: string; alVolver: () => void }) {
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
    router.push('/declaracion');
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
