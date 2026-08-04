import { redirect } from 'next/navigation';

import { Caracteristicas, Precios } from '@/components/landing/caracteristicas';
import { CtaFinal, PiePagina, PreguntasFrecuentes } from '@/components/landing/cierre';
import { BandaConfianza, Hero } from '@/components/landing/hero';
import { ComoFunciona, PorQueConfiar } from '@/components/landing/secciones';
import { leerSesion } from '@/server/sesion';

/** La landing es para visitantes: con sesión activa la raíz lleva al panel. */
export default async function PaginaInicio() {
  const sesion = await leerSesion();
  if (sesion) {
    redirect('/panel');
  }
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <main className="flex-1">
        <BandaConfianza />
        <Caracteristicas />
        <ComoFunciona />
        <PorQueConfiar />
        <Precios />
        <PreguntasFrecuentes />
        <CtaFinal />
      </main>
      <PiePagina />
    </div>
  );
}
