import { LogoMarca } from './iconos';

const MENU = ['Resumen', 'Documentos', 'Información', 'Resultado', 'Borrador 210', 'Guía DIAN'];
const PASOS = ['Documentos', 'Información', 'Resultado'];
// Cifras REALES del caso validado contra una declaración presentada (no mockeadas):
// 114.409.000 − 53.720.000 = 60.689.000 gravable → impuesto 1.217.000; 2.618.000 − 1.217.000 = 1.401.000 a favor.
const DESGLOSE: [string, string, boolean?][] = [
  ['Ingresos totales', '$114.409.000'],
  ['No gravado, exento y deducciones', '-$53.720.000'],
  ['Impuesto de renta', '$1.217.000'],
  ['Retenciones y saldo a favor previo', '-$2.618.000'],
];

/** Mockup del producto que se muestra en el hero (dashboard "Resumen de tu declaración"). */
export function MockupResumen() {
  return (
    <div className="overflow-hidden rounded-2xl border border-marino-borde bg-card text-foreground shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-borde px-4 py-3">
        <LogoMarca />
        <span className="text-xs font-medium text-texto-suave">Resumen de tu declaración</span>
      </div>
      <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[130px_1fr]">
        <BarraLateral />
        <div className="space-y-4 p-4">
          <TarjetaResultado />
          <TarjetaDesglose />
          <p className="flex items-center gap-1.5 text-[11px] text-texto-suave">
            <span className="text-primario">✓</span> Cálculo validado con normas del Estatuto Tributario vigente y UVT 2025.
          </p>
        </div>
      </div>
    </div>
  );
}

function BarraLateral() {
  return (
    <nav className="space-y-1 border-r border-borde bg-background/60 p-2">
      {MENU.map((item, i) => (
        <span
          key={item}
          className={`block truncate rounded-lg px-2 py-1.5 text-[11px] ${
            i === 0 ? 'bg-primario-suave font-semibold text-primario' : 'text-texto-suave'
          }`}
        >
          {item}
        </span>
      ))}
    </nav>
  );
}

function TarjetaResultado() {
  return (
    <div className="rounded-xl border border-borde p-4">
      <p className="text-xs text-texto-suave">Resultado estimado</p>
      <p className="mt-1 text-3xl font-bold text-primario">$1.401.000</p>
      <p className="text-xs text-texto-suave">Saldo a favor</p>
      <div className="mt-4 flex items-center justify-between">
        {PASOS.map((paso) => (
          <div key={paso} className="flex flex-1 flex-col items-center gap-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primario text-[10px] text-white">✓</span>
            <span className="text-[10px] text-texto-suave">{paso}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TarjetaDesglose() {
  return (
    <div className="rounded-xl border border-borde p-4">
      <p className="text-xs font-semibold">Desglose del resultado</p>
      <dl className="mt-3 space-y-2">
        {DESGLOSE.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between text-[11px]">
            <dt className="text-texto-suave">{etiqueta}</dt>
            <dd className="font-mono">{valor}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-borde pt-2 text-xs font-semibold">
          <dt>Saldo a favor</dt>
          <dd className="font-mono text-primario">$1.401.000</dd>
        </div>
      </dl>
    </div>
  );
}
