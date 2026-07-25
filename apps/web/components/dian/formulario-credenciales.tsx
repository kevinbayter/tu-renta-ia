'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

const TIPOS = [
  { valor: 'CC', etiqueta: 'Cédula de ciudadanía' },
  { valor: 'CE', etiqueta: 'Cédula de extranjería' },
  { valor: 'NIT', etiqueta: 'NIT' },
  { valor: 'PA', etiqueta: 'Pasaporte' },
  { valor: 'TI', etiqueta: 'Tarjeta de identidad' },
] as const;

export interface Credenciales {
  tipoDocumento: string;
  numeroDocumento: string;
  contrasena: string;
}

/** Mismos campos que el portal real, con el diseño de la plataforma. */
export function FormularioCredenciales({
  alEnviar,
  alVolver,
}: {
  alEnviar: (credenciales: Credenciales) => void;
  alVolver: () => void;
}) {
  const [datos, setDatos] = useState<Credenciales>({ tipoDocumento: 'CC', numeroDocumento: '', contrasena: '' });
  const [verClave, setVerClave] = useState(false);
  const listo = datos.numeroDocumento.length >= 5 && datos.contrasena.length >= 4;

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        alEnviar(datos);
      }}
    >
      <label className="block">
        <span className="text-xs font-medium text-texto-suave">Tipo de documento</span>
        <select
          value={datos.tipoDocumento}
          onChange={(e) => setDatos({ ...datos, tipoDocumento: e.target.value })}
          className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-texto-suave">Número de documento (sin puntos ni comas)</span>
        <input
          value={datos.numeroDocumento}
          onChange={(e) => setDatos({ ...datos, numeroDocumento: e.target.value.replace(/\D/g, '') })}
          inputMode="numeric"
          autoComplete="off"
          className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
        />
      </label>

      <CampoContrasena
        valor={datos.contrasena}
        visible={verClave}
        alCambiar={(v) => setDatos({ ...datos, contrasena: v })}
        alAlternar={() => setVerClave(!verClave)}
      />

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-texto-suave">
        <Lock size={12} className="mt-0.5 shrink-0 text-primario" aria-hidden />
        Viajan cifradas por HTTPS, se usan solo para esta operación y se borran al terminar. No se escriben
        en disco ni en registros.
      </p>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={alVolver} className="h-11 flex-1 rounded-2xl border border-borde font-semibold">
          Atrás
        </button>
        <button
          type="submit"
          disabled={!listo}
          className="h-11 flex-1 rounded-2xl bg-primario font-semibold text-white transition hover:bg-primario-oscuro disabled:opacity-40"
        >
          Conectar
        </button>
      </div>
    </form>
  );
}

function CampoContrasena({
  valor,
  visible,
  alCambiar,
  alAlternar,
}: {
  valor: string;
  visible: boolean;
  alCambiar: (valor: string) => void;
  alAlternar: () => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-texto-suave">Contraseña de la DIAN</span>
      <span className="relative mt-1 block">
        <input
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-borde bg-background px-3 pr-11 text-sm outline-none focus:border-primario"
        />
        <button
          type="button"
          onClick={alAlternar}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-texto-suave hover:bg-card"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}
