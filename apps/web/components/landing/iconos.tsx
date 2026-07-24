export function LogoMarca({ claro = false }: { claro?: boolean }) {
  const color = claro ? '#22c55e' : 'var(--primario)';
  return (
    <span className="flex items-center gap-2 font-bold">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path
          d="M4 15c5 0 8-3 9-11 3 6 2 12-3 15-3 2-6 1-6-4z"
          fill={color}
          opacity="0.9"
        />
        <path d="M6 20c3-6 8-9 13-9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={claro ? 'text-white' : ''}>
        TuRenta <span style={{ color }}>AI</span>
      </span>
    </span>
  );
}

export function IconoCheck({ tenue = false }: { tenue?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="9" fill={tenue ? 'rgba(34,197,94,0.15)' : 'var(--primario-suave)'} />
      <path
        d="M6 10.5l2.5 2.5L14 7.5"
        stroke={tenue ? '#22c55e' : 'var(--primario)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TRAZOS: Record<string, string> = {
  diana: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10zm0 4a1 1 0 100 2 1 1 0 000-2z',
  cerebro: 'M9 4a3 3 0 00-3 3 3 3 0 00-1 5 3 3 0 001 5 3 3 0 003 3 2 2 0 004 0V4a2 2 0 00-4 0zm6 0a2 2 0 014 0 3 3 0 011 5 3 3 0 01-1 5 3 3 0 01-3 3 2 2 0 01-2-2',
  candado: 'M7 10V8a5 5 0 0110 0v2m-11 0h12v9H6z',
  documento: 'M7 3h7l4 4v14H7zm7 0v4h4M9.5 13.5l1.5 1.5 3-3.5',
};

export function IconoCircular({ tipo }: { tipo: keyof typeof TRAZOS }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-borde bg-card">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={TRAZOS[tipo]}
          stroke="var(--primario)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight">{children}</h2>
      <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-primario" />
    </div>
  );
}
