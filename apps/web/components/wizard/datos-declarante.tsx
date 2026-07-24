'use client';

import { useDeclaracion } from '@/lib/store';

const CAMPOS = [
  { campo: 'nombres', etiqueta: 'Nombres', placeholder: 'Como aparecen en tu cédula' },
  { campo: 'apellidos', etiqueta: 'Apellidos', placeholder: 'Como aparecen en tu cédula' },
  { campo: 'identificacion', etiqueta: 'Número de cédula (sin puntos)', placeholder: 'Ej: 1234567890' },
] as const;

export function DatosDeclarante() {
  const declarante = useDeclaracion((s) => s.declarante);
  const actualizarDeclarante = useDeclaracion((s) => s.actualizarDeclarante);
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
