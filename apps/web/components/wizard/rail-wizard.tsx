'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';

import type { PasoWizard } from '@/lib/store';

interface TarjetaRail {
  titulo: string;
  items: string[];
  nota?: string;
}

/** Contexto honesto por paso: por qué importa y qué esperar (nada decorativo). */
const RAIL: Record<PasoWizard, TarjetaRail[]> = {
  exogena: [
    {
      titulo: '¿Por qué empezamos con la exógena?',
      items: [
        'Identifica automáticamente los documentos que necesitas (empleadores, bancos, fiducias).',
        'Precarga rendimientos, saldo a favor del año pasado y compras con factura electrónica.',
        'Te dice si estás obligado a declarar según los topes reportados.',
        'Detecta si el archivo es de otra persona antes de que sea un problema.',
      ],
      nota: 'La IA organiza y lee; el impuesto lo calcula siempre un motor auditado.',
    },
    {
      titulo: 'Consejos antes de subir tu archivo',
      items: [
        'Descarga el archivo completo desde el portal de la DIAN.',
        'Verifica que no esté protegido con contraseña.',
        'Debe corresponder al año gravable 2025.',
      ],
    },
  ],
  documentos: [
    {
      titulo: 'Cómo leemos tus documentos',
      items: [
        'Cada PDF se lee DOS veces con IA de forma independiente; si algo no coincide, te lo marcamos.',
        'Si no subes un certificado bancario, tomamos sus saldos y rendimientos de la exógena.',
        'La prepagada y los intereses también se pueden digitar a mano.',
      ],
    },
  ],
  entrevista: [
    {
      titulo: 'Sobre la entrevista',
      items: [
        'Lo que ya está en tus documentos NO se vuelve a preguntar: solo lo confirmas.',
        'Aquí se capturan tus deducciones: dependientes, salud, GMF y tu patrimonio.',
        'Puedes corregir cualquier valor después, en el paso de Revisión.',
      ],
    },
  ],
  revision: [
    {
      titulo: 'Antes de calcular',
      items: [
        'Revisa cada valor: tú eres la verificación final de lo que leyó la IA.',
        'El cálculo lo hace un motor determinista validado contra declaraciones reales — la IA no toca los números.',
        'Los avisos en rojo señalan inconsistencias que cambiarían tu resultado.',
      ],
    },
  ],
  resultado: [
    {
      titulo: 'Tu resultado',
      items: [
        'Descarga el borrador en el formato oficial 210 de la DIAN.',
        'La guía te dice exactamente cómo presentarlo en el portal.',
        'Guarda tu avance para retomarlo desde cualquier lugar.',
      ],
    },
  ],
};

export function RailWizard({ paso }: { paso: PasoWizard }) {
  return (
    <aside className="space-y-4" aria-label="Ayuda del paso">
      {RAIL[paso].map((tarjeta) => (
        <section key={tarjeta.titulo} className="rounded-2xl border border-borde bg-card p-5">
          <h2 className="text-sm font-bold">{tarjeta.titulo}</h2>
          <ul className="mt-3 space-y-2.5">
            {tarjeta.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-texto-suave">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primario" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {tarjeta.nota && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-primario-suave px-3 py-2.5 text-xs leading-relaxed">
              <Sparkles size={13} className="mt-0.5 shrink-0 text-primario" aria-hidden />
              {tarjeta.nota}
            </p>
          )}
        </section>
      ))}
    </aside>
  );
}
