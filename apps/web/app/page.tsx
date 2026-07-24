import { BandaEjemplo, CierreCta, PiePagina, PreguntasFrecuentes } from '@/components/landing/cierre';
import { Hero } from '@/components/landing/hero';
import { ComoFunciona, LoQueRecibes, PorQueConfiar } from '@/components/landing/secciones';

export default function PaginaInicio() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <main className="flex-1">
        <ComoFunciona />
        <PorQueConfiar />
        <LoQueRecibes />
        <BandaEjemplo />
        <PreguntasFrecuentes />
        <CierreCta />
      </main>
      <PiePagina />
    </div>
  );
}
