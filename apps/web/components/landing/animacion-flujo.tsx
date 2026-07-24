/**
 * Animación del flujo de declaración (SVG + CSS puros, keyframes en globals.css):
 * exógena → lectura IA → entrevista → motor → borrador 210. Un "dato" viaja por
 * la línea mientras cada estación flota; con prefers-reduced-motion todo queda
 * estático. Colores desde los tokens del tema (claro y oscuro).
 */

const NODOS_X = [70, 245, 430, 615, 790];
const CY = 104;

export function AnimacionFlujo() {
  return (
    <div className="overflow-x-auto" aria-hidden>
      <svg viewBox="0 0 860 190" className="mx-auto h-auto w-full min-w-[680px] max-w-4xl">
        <Conectores />
        <circle r="7" fill="var(--primario)" className="flujo-dato" />
        <Nodo indice={0} etiqueta="Tu exógena">
          <IconoExogena />
        </Nodo>
        <Nodo indice={1} etiqueta="Lectura IA ×2">
          <IconoLecturaIa />
        </Nodo>
        <Nodo indice={2} etiqueta="Entrevista">
          <IconoEntrevista />
        </Nodo>
        <Nodo indice={3} etiqueta="Motor de cálculo">
          <IconoMotor />
        </Nodo>
        <Nodo indice={4} etiqueta="Borrador 210">
          <IconoBorrador />
        </Nodo>
      </svg>
    </div>
  );
}

function Conectores() {
  return (
    <g stroke="var(--primario)" strokeWidth="2" opacity="0.5">
      {NODOS_X.slice(0, -1).map((x, i) => (
        <line key={x} x1={x + 42} y1={CY} x2={(NODOS_X[i + 1] ?? 0) - 42} y2={CY} className="flujo-linea" />
      ))}
    </g>
  );
}

function Nodo({ indice, etiqueta, children }: { indice: number; etiqueta: string; children: React.ReactNode }) {
  const x = NODOS_X[indice] ?? 0;
  return (
    <g>
      <g className="flujo-flotar" style={{ animationDelay: `${String(indice * 0.5)}s` }}>
        {indice === 4 && <circle cx={x} cy={CY} r="34" fill="none" stroke="var(--primario)" strokeWidth="1.5" className="flujo-pulso" />}
        <circle cx={x} cy={CY} r="34" fill="var(--primario-suave)" stroke="var(--primario)" strokeWidth="1.5" opacity="0.95" />
        <g transform={`translate(${String(x)} ${String(CY)})`} stroke="var(--primario)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {children}
        </g>
        <circle cx={x + 26} cy={CY - 26} r="10" fill="var(--primario)" />
        <text x={x + 26} y={CY - 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff" stroke="none">
          {indice + 1}
        </text>
      </g>
      <text x={x} y={CY + 62} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--texto-suave)">
        {etiqueta}
      </text>
    </g>
  );
}

function IconoExogena() {
  return (
    <>
      <rect x="-12" y="-14" width="24" height="28" rx="3" />
      <line x1="-6" y1="-6" x2="6" y2="-6" />
      <line x1="-6" y1="0" x2="6" y2="0" />
      <line x1="-6" y1="6" x2="6" y2="6" />
      <line x1="0" y1="-6" x2="0" y2="6" />
    </>
  );
}

function IconoLecturaIa() {
  return (
    <>
      <rect x="-11" y="-14" width="22" height="28" rx="3" />
      <line x1="-14" y1="0" x2="14" y2="0" stroke="var(--acento)" strokeWidth="2.6" className="flujo-escaneo" />
      <path d="M 13 -13 l 1.6 3.2 3.2 1.6 -3.2 1.6 -1.6 3.2 -1.6 -3.2 -3.2 -1.6 3.2 -1.6 z" fill="var(--primario)" stroke="none" />
    </>
  );
}

function IconoEntrevista() {
  return (
    <>
      <path d="M -14 -12 h 17 a 3 3 0 0 1 3 3 v 7 a 3 3 0 0 1 -3 3 h -9 l -5 5 v -5 h -3 a 3 3 0 0 1 -3 -3 v -7 a 3 3 0 0 1 3 -3 z" transform="translate(1 -2)" />
      <path d="M 4 2 h 9 a 3 3 0 0 1 3 3 v 5 a 3 3 0 0 1 -3 3 h -2 v 4 l -4 -4 h -3 a 3 3 0 0 1 -3 -3 v -5 a 3 3 0 0 1 3 -3 z" fill="var(--primario)" fillOpacity="0.25" />
    </>
  );
}

function IconoMotor() {
  return (
    <>
      <rect x="-12" y="-14" width="24" height="28" rx="4" />
      <rect x="-7" y="-9" width="14" height="6" rx="1.5" fill="var(--primario)" fillOpacity="0.25" />
      <circle cx="-5" cy="3" r="1.4" fill="var(--primario)" stroke="none" />
      <circle cx="0" cy="3" r="1.4" fill="var(--primario)" stroke="none" />
      <circle cx="5" cy="3" r="1.4" fill="var(--primario)" stroke="none" />
      <circle cx="-5" cy="9" r="1.4" fill="var(--primario)" stroke="none" />
      <circle cx="0" cy="9" r="1.4" fill="var(--primario)" stroke="none" />
      <circle cx="5" cy="9" r="1.4" fill="var(--primario)" stroke="none" />
    </>
  );
}

function IconoBorrador() {
  return (
    <>
      <rect x="-11" y="-14" width="22" height="28" rx="3" />
      <path d="M -5 1 l 4 4 7 -8" stroke="var(--acento)" strokeWidth="2.8" />
    </>
  );
}
