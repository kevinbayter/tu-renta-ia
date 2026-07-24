import { Caracteristicas, Precios } from '@/components/landing/caracteristicas';
import { CtaFinal, PiePagina, PreguntasFrecuentes } from '@/components/landing/cierre';
import { BandaConfianza, Hero } from '@/components/landing/hero';
import { ComoFunciona, PorQueConfiar } from '@/components/landing/secciones';

export default function PaginaInicio() {
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
