import type { NotificacionNueva } from '../puertos/repositorio-port';

/**
 * Reglas deterministas de notificación por vencimiento: se avisa al cruzar
 * cada umbral de días y la clave de idempotencia garantiza un solo aviso por
 * umbral. Los umbrales ≤30 días son críticos (además del aviso, correo).
 */

export interface VencimientoNotificable {
  titular: string;
  identificacion: string;
  anioGravable: number;
  fechaLegible: string;
  dias: number;
}

const UMBRALES_DIAS = [60, 30, 15, 5];
const UMBRAL_CRITICO = 30;

export function notificacionesDeVencimiento(vencimientos: VencimientoNotificable[]): NotificacionNueva[] {
  return vencimientos
    .map((v) => notificacionPara(v))
    .filter((n): n is NotificacionNueva => n !== null);
}

function notificacionPara(v: VencimientoNotificable): NotificacionNueva | null {
  if (v.dias < 0) {
    return {
      tipo: 'vencimiento',
      titulo: `La declaración de ${v.titular} está vencida`,
      cuerpo: `El plazo para la declaración ${String(v.anioGravable)} de ${v.titular} venció el ${v.fechaLegible}. Presentarla cuanto antes reduce la sanción por extemporaneidad.`,
      claveIdempotencia: clave(v, 'vencida'),
      esCritica: true,
    };
  }
  const umbral = UMBRALES_DIAS.filter((u) => v.dias <= u).at(-1);
  if (umbral === undefined) {
    return null;
  }
  return {
    tipo: 'vencimiento',
    titulo: `${String(v.dias)} días para la declaración de ${v.titular}`,
    cuerpo: `La declaración ${String(v.anioGravable)} de ${v.titular} vence el ${v.fechaLegible}. Faltan ${String(v.dias)} días.`,
    claveIdempotencia: clave(v, String(umbral)),
    esCritica: umbral <= UMBRAL_CRITICO,
  };
}

function clave(v: VencimientoNotificable, umbral: string): string {
  return `vencimiento-${v.identificacion}-${String(v.anioGravable)}-${umbral}`;
}
