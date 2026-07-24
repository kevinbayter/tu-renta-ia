import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { RESPUESTAS_INICIALES } from './tipos';

import type { DocumentoProcesado, MensajeChat, RespuestasEntrevista, ResultadoDeclaracion } from './tipos';

export type PasoWizard = 'documentos' | 'entrevista' | 'revision' | 'resultado';

interface EstadoDeclaracion {
  paso: PasoWizard;
  documentos: DocumentoProcesado[];
  respuestas: RespuestasEntrevista;
  mensajes: MensajeChat[];
  entrevistaCompleta: boolean;
  resultado: ResultadoDeclaracion | null;

  irAPaso: (paso: PasoWizard) => void;
  agregarDocumento: (doc: DocumentoProcesado) => void;
  eliminarDocumento: (id: string) => void;
  actualizarRespuestas: (parcial: Partial<RespuestasEntrevista>) => void;
  agregarActivoManual: (descripcion: string, valor: number) => void;
  eliminarActivoManual: (indice: number) => void;
  agregarMensaje: (mensaje: MensajeChat) => void;
  marcarEntrevistaCompleta: () => void;
  guardarResultado: (resultado: ResultadoDeclaracion) => void;
  reiniciar: () => void;
}

const ESTADO_INICIAL = {
  paso: 'documentos' as PasoWizard,
  documentos: [] as DocumentoProcesado[],
  respuestas: RESPUESTAS_INICIALES,
  mensajes: [] as MensajeChat[],
  entrevistaCompleta: false,
  resultado: null,
};

export const useDeclaracion = create<EstadoDeclaracion>()(
  persist(
    (set) => ({
      ...ESTADO_INICIAL,
      irAPaso: (paso) => set({ paso }),
      agregarDocumento: (doc) => set((s) => ({ documentos: [...s.documentos, doc] })),
      eliminarDocumento: (id) => set((s) => ({ documentos: s.documentos.filter((d) => d.id !== id) })),
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
      agregarMensaje: (mensaje) => set((s) => ({ mensajes: [...s.mensajes, mensaje] })),
      marcarEntrevistaCompleta: () => set({ entrevistaCompleta: true }),
      guardarResultado: (resultado) => set({ resultado }),
      reiniciar: () => set(ESTADO_INICIAL),
    }),
    { name: 'turenta-declaracion-ag2025' },
  ),
);
