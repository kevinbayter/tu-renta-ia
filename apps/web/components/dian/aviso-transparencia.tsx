import { ShieldCheck } from 'lucide-react';

/** Qué pasa con las credenciales, en tono informativo: el usuario ya sabe dónde está. */
export function AvisoTransparencia({ deOtro }: { deOtro: string | null }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-borde bg-background px-3.5 py-3">
      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primario" aria-hidden />
      <p className="text-xs leading-relaxed text-texto-suave">
        {deOtro !== null && <strong className="mb-1 block text-foreground">Escribe la contraseña de la DIAN de {deOtro}, no la tuya.</strong>}
        Usamos estos datos <strong className="text-foreground">una sola vez</strong>, ahora mismo, para
        entrar a la cuenta y traer la información. Viajan cifrados y se borran de nuestra memoria al
        terminar; solo quedan guardados, cifrados, si marcaste recordar el acceso.
      </p>
    </div>
  );
}
