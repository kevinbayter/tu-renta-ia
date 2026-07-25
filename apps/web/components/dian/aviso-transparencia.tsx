import { ShieldCheck } from 'lucide-react';

/** Qué pasa con las credenciales, en tono informativo: el usuario ya sabe dónde está. */
export function AvisoTransparencia() {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-borde bg-background px-3.5 py-3">
      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primario" aria-hidden />
      <p className="text-xs leading-relaxed text-texto-suave">
        Usamos estos datos <strong className="text-foreground">una sola vez</strong>, ahora mismo, para
        entrar a tu cuenta y traer tu información. Viajan cifrados, no se guardan en ningún lado y se
        borran de nuestra memoria al terminar.
      </p>
    </div>
  );
}
