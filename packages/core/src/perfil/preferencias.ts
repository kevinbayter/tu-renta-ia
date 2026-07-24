/**
 * Preferencias del usuario (widgets visibles del panel y correos de vencimiento).
 * normalizar garantiza la forma completa aunque lo guardado esté vacío o viejo.
 */

export interface PreferenciasUsuario {
  widgets: {
    asistente: boolean;
    vencimientos: boolean;
    actividad: boolean;
    recomendaciones: boolean;
  };
  emailsVencimiento: boolean;
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasUsuario = {
  widgets: { asistente: true, vencimientos: true, actividad: true, recomendaciones: true },
  emailsVencimiento: true,
};

export function normalizarPreferencias(crudo: unknown): PreferenciasUsuario {
  const c = (typeof crudo === 'object' && crudo !== null ? crudo : {}) as {
    widgets?: Partial<PreferenciasUsuario['widgets']>;
    emailsVencimiento?: boolean;
  };
  return {
    widgets: {
      asistente: c.widgets?.asistente ?? true,
      vencimientos: c.widgets?.vencimientos ?? true,
      actividad: c.widgets?.actividad ?? true,
      recomendaciones: c.widgets?.recomendaciones ?? true,
    },
    emailsVencimiento: c.emailsVencimiento ?? true,
  };
}
