import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { RESPUESTAS_INICIALES } from './tipos';

import type { Declarante, DocumentoProcesado, MensajeChat, RespuestasEntrevista, ResultadoDeclaracion } from './tipos';

export type PasoWizard = 'documentos' | 'entrevista' | 'revision' | 'resultado';

interface EstadoDeclaracion {
  paso: PasoWizard;
  documentos: DocumentoProcesado[];
  respuestas: RespuestasEntrevista;
  mensajes: MensajeChat[];
  entrevistaCompleta: boolean;
  resultado: ResultadoDeclaracion | null;
  declarante: Declarante;

  irAPaso: (paso: PasoWizard) => void;
  actualizarDeclarante: (parcial: Partial<Declarante>) => void;
  agregarDocumento: (doc: DocumentoProcesado) => void;
  eliminarDocumento: (id: string) => void;
  actualizarRespuestas: (parcial: Partial<RespuestasEntrevista>) => void;
  agregarActivoManual: (descripcion: string, valor: number) => void;
  eliminarActivoManual: (indice: number) => void;
  agregarMensaje: (mensaje: MensajeChat) => void;
  marcarEntrevistaCompleta: () => void;
  guardarResultado: (resultado: ResultadoDeclaracion) => void;
  hidratar: (estado: Partial<EstadoDeclaracion>) => void;
  reiniciar: () => void;
}

const ESTADO_INICIAL = {
  paso: 'documentos' as PasoWizard,
  documentos: [] as DocumentoProcesado[],
  respuestas: RESPUESTAS_INICIALES,
  mensajes: [] as MensajeChat[],
  entrevistaCompleta: false,
  resultado: null,
  declarante: { nombres: '', apellidos: '', identificacion: '' } as Declarante,
};

type SetEstado = (
  parcial: Partial<EstadoDeclaracion> | ((s: EstadoDeclaracion) => Partial<EstadoDeclaracion>),
) => void;

function accionesGenerales(set: SetEstado): Partial<EstadoDeclaracion> {
  return {
    irAPaso: (paso) => set({ paso }),
    actualizarDeclarante: (parcial) => set((s) => ({ declarante: { ...s.declarante, ...parcial } })),
    agregarDocumento: (doc) => set((s) => ({ documentos: [...s.documentos, doc] })),
    eliminarDocumento: (id) => set((s) => ({ documentos: s.documentos.filter((d) => d.id !== id) })),
    agregarMensaje: (mensaje) => set((s) => ({ mensajes: [...s.mensajes, mensaje] })),
    marcarEntrevistaCompleta: () => set({ entrevistaCompleta: true }),
    guardarResultado: (resultado) => set({ resultado }),
    hidratar: (estado) => set(estado),
    reiniciar: () => set(ESTADO_INICIAL),
  };
}

function accionesRespuestas(set: SetEstado): Partial<EstadoDeclaracion> {
  return {
    actualizarRespuestas: (parcial) => set((s) => ({ respuestas: { ...s.respuestas, ...parcial } })),
    agregarActivoManual: (descripcion, valor) =>
      set((s) => ({
        respuestas: {
          ...s.respuestas,
          activosManuales: [...s.respuestas.activosManuales, { descripcion, valor }],
        },
      })),
    eliminarActivoManual: (indice) =>
      set((s) => ({
        respuestas: {
          ...s.respuestas,
          activosManuales: s.respuestas.activosManuales.filter((_, i) => i !== indice),
        },
      })),
  };
}

export const useDeclaracion = create<EstadoDeclaracion>()(
  persist(
    (set) => ({
      ...ESTADO_INICIAL,
      ...accionesGenerales(set),
      ...accionesRespuestas(set),
    }) as EstadoDeclaracion,
    { name: 'turenta-declaracion-ag2025' },
  ),
);
