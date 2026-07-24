/** Círculo con iniciales (foto opcional llegará en la etapa de Configuración). */
export function Avatar({ nombre, tamano = 'md' }: { nombre: string; tamano?: 'sm' | 'md' | 'lg' }) {
  const clases = { sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' }[tamano];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-primario-suave font-bold text-primario ${clases}`}
    >
      {iniciales(nombre)}
    </span>
  );
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const primera = partes[0]?.[0] ?? '?';
  const segunda = partes[1]?.[0] ?? '';
  return `${primera}${segunda}`.toUpperCase();
}
