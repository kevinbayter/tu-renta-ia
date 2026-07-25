import type { ExogenaParseada, FilaExogena } from './tipos';

/**
 * Checklist de documentos que el usuario debería subir, derivada de lo que los
 * terceros reportaron en su exógena (así funciona la guía tipo referencia): los
 * empleadores reportan con concepto 2276 (→ 220), las entidades financieras con
 * saldos/rendimientos (→ certificado del banco), los municipios con avalúos
 * (→ recibo de predial), los bancos acreedores con cuentas por pagar
 * (→ certificado de deuda/intereses) y las prepagadas con pagos de salud.
 */

export interface DocumentoEsperado {
  tipo: 'certificado_220' | 'certificado_bancario' | 'medicina_prepagada' | 'otro';
  nit: string;
  nombre: string;
  opcional: boolean;
  motivo: string;
}

const DETALLE_LABORAL = /concepto: 2276/;
const DETALLE_FINANCIERO = /saldo cuentas bancarias|intereses y rendimientos financieros/;
const DETALLE_INVERSION = /saldo inversi|cartera colectiva|rendimientos pagados/;
const DETALLE_MOVIMIENTOS = /movimientos en cuentas/;
const DETALLE_PREDIAL = /aval[uú]o catastral|base del impuesto predial/;
const DETALLE_DEUDA = /cuentas por pagar|saldo de pr[eé]stamos|cr[eé]dito hipotecario/;
const DETALLE_PREPAGADA = /medicina prepagada|planes complementarios/;

export function documentosEsperados(exogena: ExogenaParseada): DocumentoEsperado[] {
  const grupos = new Map<string, FilaExogena[]>();
  const relevantes = exogena.filas.filter((fila) => !esInformanteExcluido(fila, exogena));
  relevantes.forEach((fila) => agruparPorNit(grupos, fila));
  return [...grupos.values()].flatMap(esperadosDelInformante).sort(compararEsperados);
}

/** La DIAN (facturación electrónica) y el propio declarante no emiten certificados. */
function esInformanteExcluido(fila: FilaExogena, exogena: ExogenaParseada): boolean {
  if (fila.nombreInformante.toUpperCase().includes('DIRECCION DE IMPUESTOS')) {
    return true;
  }
  const consultante = exogena.identificacionConsultante ?? '';
  return consultante !== '' && fila.nitInformante === consultante;
}

function agruparPorNit(grupos: Map<string, FilaExogena[]>, fila: FilaExogena): void {
  const filas = grupos.get(fila.nitInformante) ?? [];
  grupos.set(fila.nitInformante, [...filas, fila]);
}

function esperadosDelInformante(filas: FilaExogena[]): DocumentoEsperado[] {
  const primera = filas[0];
  if (!primera) {
    return [];
  }
  const base = { nit: primera.nitInformante, nombre: primera.nombreInformante };
  const candidatos = [
    esperadoPrincipal(filas, base),
    esperadoPredial(filas, base),
    esperadoDeuda(filas, base),
    esperadoPrepagada(filas, base),
  ];
  return candidatos.filter((d): d is DocumentoEsperado => d !== null);
}

type BaseEsperado = Pick<DocumentoEsperado, 'nit' | 'nombre'>;

/** Rol principal del informante: empleador/fondo de pensión o entidad financiera. */
function esperadoPrincipal(filas: FilaExogena[], base: BaseEsperado): DocumentoEsperado | null {
  const detalles = filas.map((f) => f.detalle.toLowerCase());
  if (detalles.some((d) => esDetallePension(d))) {
    return { ...base, tipo: 'certificado_220', opcional: true, motivo: 'si no subes su certificado, tomamos la pensión reportada en la exógena' };
  }
  if (detalles.some((d) => DETALLE_LABORAL.test(d))) {
    return { ...base, tipo: 'certificado_220', opcional: false, motivo: 'te reportó pagos laborales en la exógena' };
  }
  if (detalles.some((d) => DETALLE_FINANCIERO.test(d))) {
    return { ...base, tipo: 'certificado_bancario', opcional: true, motivo: 'si no subes su certificado, tomamos sus saldos y rendimientos de la exógena' };
  }
  if (detalles.some((d) => DETALLE_INVERSION.test(d))) {
    return { ...base, tipo: 'certificado_bancario', opcional: true, motivo: 'sus saldos y rendimientos ya se precargaron desde la exógena' };
  }
  if (detalles.some((d) => DETALLE_MOVIMIENTOS.test(d))) {
    return { ...base, tipo: 'certificado_bancario', opcional: true, motivo: 'reportó movimientos de cuentas — su certificado ayuda a completar el GMF (4×1000)' };
  }
  return null;
}

/** Municipio que reporta avalúos: pedir el recibo del predial de cada inmueble. */
function esperadoPredial(filas: FilaExogena[], base: BaseEsperado): DocumentoEsperado | null {
  const dePredial = filas.filter((f) => DETALLE_PREDIAL.test(f.detalle.toLowerCase()));
  if (dePredial.length === 0) {
    return null;
  }
  const inmuebles = contarInmuebles(dePredial);
  return {
    ...base,
    nombre: `Predial ${base.nombre}`,
    tipo: 'otro',
    opcional: true,
    motivo: `tu exógena reporta ${String(inmuebles)} inmueble(s) en ${base.nombre}: el recibo del predial soporta su valor patrimonial y es costo deducible si el inmueble está arrendado`,
  };
}

/** Inmuebles distintos según la matrícula inmobiliaria de la información adicional. */
function contarInmuebles(filas: FilaExogena[]): number {
  const matriculas = new Set(
    filas.map((f) => /matricula:\s*([\w-]+)/i.exec(f.infoAdicional)?.[1] ?? f.detalle),
  );
  return matriculas.size;
}

/** Acreedor que reporta deudas: el certificado soporta el pasivo y sus intereses. */
function esperadoDeuda(filas: FilaExogena[], base: BaseEsperado): DocumentoEsperado | null {
  if (!filas.some((f) => DETALLE_DEUDA.test(f.detalle.toLowerCase()))) {
    return null;
  }
  const esIcetex = base.nombre.toUpperCase().includes('ICETEX');
  const motivo = esIcetex
    ? 'reportó tu crédito ICETEX: el certificado de intereses pagados te da una deducción'
    : 'te reportó una deuda: su certificado soporta el pasivo y, si es crédito de vivienda, los intereses son deducibles';
  return { ...base, nombre: `Deuda ${base.nombre}`, tipo: 'otro', opcional: true, motivo };
}

/** Entidad de medicina prepagada: su certificado da la deducción del art. 387. */
function esperadoPrepagada(filas: FilaExogena[], base: BaseEsperado): DocumentoEsperado | null {
  const dePrepagada = filas.some(
    (f) => DETALLE_PREPAGADA.test(f.detalle.toLowerCase()) && !f.detalle.toLowerCase().includes('aporte'),
  );
  if (!dePrepagada) {
    return null;
  }
  return {
    ...base,
    tipo: 'medicina_prepagada',
    opcional: true,
    motivo: 'reportó pagos de medicina prepagada: su certificado te da la deducción (o digita el valor manualmente)',
  };
}

/** Mesadas pensionales (excluye "aporte A fondos de pensiones" del empleador y retenciones). */
function esDetallePension(detalle: string): boolean {
  return (
    detalle.includes('pension') &&
    detalle.includes('2276') &&
    !detalle.includes('aporte') &&
    !detalle.includes('retenci')
  );
}

/** Obligatorios primero; dentro de cada grupo, 220 antes que bancarios y sugerencias al final. */
function compararEsperados(a: DocumentoEsperado, b: DocumentoEsperado): number {
  if (a.opcional !== b.opcional) {
    return Number(a.opcional) - Number(b.opcional);
  }
  return a.tipo.localeCompare(b.tipo);
}
