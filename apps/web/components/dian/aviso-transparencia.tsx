import { Info } from 'lucide-react';

/**
 * Pedir credenciales de un sistema estatal en formulario propio es, en la forma,
 * idéntico al phishing. La diferencia la hace decirlo de frente: este aviso
 * declara que NO es el portal de la DIAN y recuerda la alternativa manual.
 */
export function AvisoTransparencia() {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-alerta/30 bg-alerta-suave px-3.5 py-3">
      <Info size={15} className="mt-0.5 shrink-0 text-alerta" aria-hidden />
      <p className="text-xs leading-relaxed">
        <strong>Este formulario es de TuRenta AI, no de la DIAN.</strong> Estás en{' '}
        <span className="font-mono">turenta.tax</span>. Verifica siempre la dirección antes de escribir tus
        datos en cualquier sitio. Si prefieres no compartirlos,{' '}
        <a
          href="https://muisca.dian.gov.co"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primario underline"
        >
          entra directo al portal oficial
        </a>{' '}
        y sube el archivo tú mismo.
      </p>
    </div>
  );
}
