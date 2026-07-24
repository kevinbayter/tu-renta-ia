'use client';

import { EncabezadoWizard } from '@/components/wizard/encabezado-wizard';
import { PasoDocumentos } from '@/components/wizard/paso-documentos';
import { PasoEntrevista } from '@/components/wizard/paso-entrevista';
import { PasoExogena } from '@/components/wizard/paso-exogena';
import { PasoResultado } from '@/components/wizard/paso-resultado';
import { PasoRevision } from '@/components/wizard/paso-revision';
import { RailWizard } from '@/components/wizard/rail-wizard';
import { Stepper } from '@/components/wizard/stepper';
import { useDeclaracion } from '@/lib/store';

export default function PaginaDeclaracion() {
  const paso = useDeclaracion((s) => s.paso);
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6">
      <EncabezadoWizard />
      <div className="mt-6">
        <Stepper />
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-[60vh] min-w-0 flex-col">
          {paso === 'exogena' && <PasoExogena />}
          {paso === 'documentos' && <PasoDocumentos />}
          {paso === 'entrevista' && <PasoEntrevista />}
          {paso === 'revision' && <PasoRevision />}
          {paso === 'resultado' && <PasoResultado />}
        </div>
        <RailWizard paso={paso} />
      </div>
    </main>
  );
}
