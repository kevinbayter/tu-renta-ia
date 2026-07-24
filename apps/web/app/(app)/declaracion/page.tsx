'use client';

import { BarraSesion } from '@/components/wizard/barra-sesion';
import { PasoDocumentos } from '@/components/wizard/paso-documentos';
import { PasoEntrevista } from '@/components/wizard/paso-entrevista';
import { PasoExogena } from '@/components/wizard/paso-exogena';
import { PasoResultado } from '@/components/wizard/paso-resultado';
import { PasoRevision } from '@/components/wizard/paso-revision';
import { Stepper } from '@/components/wizard/stepper';
import { useDeclaracion } from '@/lib/store';

export default function PaginaDeclaracion() {
  const paso = useDeclaracion((s) => s.paso);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-24 pt-6 sm:px-6">
      <BarraSesion />
      <Stepper />
      <div className="mt-6 flex-1">
        {paso === 'exogena' && <PasoExogena />}
        {paso === 'documentos' && <PasoDocumentos />}
        {paso === 'entrevista' && <PasoEntrevista />}
        {paso === 'revision' && <PasoRevision />}
        {paso === 'resultado' && <PasoResultado />}
      </div>
    </main>
  );
}
