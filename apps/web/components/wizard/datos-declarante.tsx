'use client';

import { useDeclaracion } from '@/lib/store';

function TitularDefinido() {
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-borde bg-primario-suave p-4">
      <div>
        <p className="text-xs font-medium text-texto-suave">
          {esPropia ? 'Declaración a tu nombre' : 'Declaración de otra persona'}
        </p>
        <p className="font-semibold">
          {declarante.nombres} {declarante.apellidos}{' '}
          <span className="font-mono text-sm text-texto-suave">· C.C. {declarante.identificacion}</span>
        </p>
      </div>
      <a href="/declaraciones" className="shrink-0 text-xs font-semibold text-primario underline">
        Cambiar
      </a>
    </div>
  );
}

const CAMPOS = [
  { campo: 'nombres', etiqueta: 'Nombres', placeholder: 'Como aparecen en tu cédula' },
  { campo: 'apellidos', etiqueta: 'Apellidos', placeholder: 'Como aparecen en tu cédula' },
  { campo: 'identificacion', etiqueta: 'Número de cédula (sin puntos)', placeholder: 'Ej: 1234567890' },
] as const;

export function DatosDeclarante() {
  const declarante = useDeclaracion((s) => s.declarante);
  const esPropia = useDeclaracion((s) => s.esPropia);
  const actualizarDeclarante = useDeclaracion((s) => s.actualizarDeclarante);
  if (esPropia !== null && declarante.identificacion) {
    return <TitularDefinido />;
  }
  return (
    <div className="mt-4 rounded-2xl border border-borde bg-card p-4">
      <p className="font-semibold">Tus datos como declarante</p>
      <p className="text-xs text-texto-suave">
        Con tu cédula calculamos tu fecha límite de presentación y armamos tu borrador.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {CAMPOS.map(({ campo, etiqueta, placeholder }) => (
          <label key={campo} className="block">
            <span className="text-xs font-medium text-texto-suave">{etiqueta}</span>
            <input
              value={declarante[campo]}
              onChange={(e) => actualizarDeclarante({ [campo]: e.target.value })}
              placeholder={placeholder}
              inputMode={campo === 'identificacion' ? 'numeric' : 'text'}
              className="mt-1 h-11 w-full rounded-xl border border-borde bg-background px-3 text-sm outline-none focus:border-primario"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
