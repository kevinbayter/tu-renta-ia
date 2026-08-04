import { redirect } from 'next/navigation';

import { WizardDeclaracion } from '@/components/wizard/wizard-declaracion';
import { leerSesion } from '@/server/sesion';

/** El wizard exige sesión: documentos y entrevista corren sobre APIs que responden 401 sin ella. */
export default async function PaginaDeclaracion() {
  const sesion = await leerSesion();
  if (!sesion) {
    redirect('/ingresar?siguiente=/declaracion');
  }
  return <WizardDeclaracion />;
}
