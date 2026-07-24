/**
 * Mapa de coordenadas del formulario 210 AG2025 (plantilla oficial DIAN, Letter 612×792).
 * Derivado de un 210 real presentado en MUISCA (extracción pdfjs) con offset −1pt
 * hacia la plantilla oficial (verificado con anclas de texto compartidas).
 * Convención: los montos se dibujan alineados a la DERECHA en `xDerecha`, baseline `y`.
 */

/** Offset PDF real de MUISCA → plantilla oficial DIAN. */
const DX = -1;
const DY = -1;

export interface PosicionCasilla {
  xDerecha: number;
  y: number;
}

function pos(xDerecha: number, y: number): PosicionCasilla {
  return { xDerecha: xDerecha + DX, y: y + DY };
}

/** Filas de la tabla de cédula general: casillas por fila [trabajo, trabajoNR, capital, noLaboral]. */
const COLUMNAS = { t: 230.0, tnr: 350.0, k: 470.0, nl: 589.9 };

const FILAS_CEDULA: [number, (number | null)[]][] = [
  [569.5, [32, 43, 58, 74]],
  [557.5, [null, null, null, 75]],
  [545.5, [33, 44, 59, 76]],
  [533.5, [null, 45, 60, 77]],
  [521.5, [34, 46, 61, 78]],
  [509.5, [null, null, 62, 79]],
  [497.5, [35, 47, 63, 80]],
  [485.5, [36, 48, 64, 81]],
  [473.5, [37, 49, 65, 82]],
  [461.5, [38, 50, 66, 83]],
  [449.5, [39, 51, 67, 84]],
  [437.5, [40, 52, 68, 85]],
  [425.5, [41, 53, 69, 86]],
  [413.5, [null, 54, 70, 87]],
  [401.5, [null, 55, 71, 88]],
  [389.5, [null, 56, 72, 89]],
  [377.5, [42, 57, 73, 90]],
];

function casillasCedulaGeneral(): Record<string, PosicionCasilla> {
  const mapa: Record<string, PosicionCasilla> = {};
  const anchos = [COLUMNAS.t, COLUMNAS.tnr, COLUMNAS.k, COLUMNAS.nl];
  for (const [y, casillas] of FILAS_CEDULA) {
    casillas.forEach((casilla, indice) => {
      if (casilla !== null) {
        mapa[String(casilla)] = pos(anchos[indice] as number, y);
      }
    });
  }
  return mapa;
}

/** Columna central (pensiones, dividendos, GO: 99–115) y liquidación privada (derecha). */
function casillasCentroYDerecha(): Record<string, PosicionCasilla> {
  const mapa: Record<string, PosicionCasilla> = {};
  const centro = [99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
  centro.forEach((casilla, i) => {
    mapa[String(casilla)] = pos(311.0, 341.5 - i * 12);
  });
  const derecha = [116, 117, 118, 119, 120, 121, 123, 125, 126, 127, 128, 129, 130, 131, 132, 133];
  derecha.forEach((casilla, i) => {
    mapa[String(casilla)] = pos(590.0, 341.5 - i * 12);
  });
  mapa['122'] = pos(460.0, 269.5);
  mapa['124'] = pos(460.0, 257.5);
  return mapa;
}

/** Mapa completo casilla → posición (montos). */
export const CASILLAS_210: Record<string, PosicionCasilla> = {
  '28': pos(590.0, 605.5),
  '29': pos(252.0, 593.5),
  '30': pos(411.0, 593.5),
  '31': pos(590.0, 593.5),
  ...casillasCedulaGeneral(),
  '91': pos(170.0, 365.5),
  '92': pos(308.0, 365.5),
  '93': pos(446.0, 365.5),
  '94': pos(589.9, 365.5),
  '95': pos(170.0, 353.5),
  '96': pos(308.0, 353.5),
  '97': pos(446.0, 353.5),
  '98': pos(589.9, 353.5),
  ...casillasCentroYDerecha(),
  '134': pos(167.0, 137.5),
  '135': pos(309.0, 137.5),
  '136': pos(451.0, 137.5),
  '137': pos(590.0, 137.5),
  '138': pos(131.0, 125.5),
  '139': pos(291.0, 125.5),
  '140': pos(451.0, 125.5),
  '141': pos(589.9, 125.5),
  '980': pos(582.9, 60.5),
};

/** Encabezado: posiciones de dígitos y textos (alineación IZQUIERDA). */
export const ENCABEZADO_210 = {
  anio: { y: 722.5 + DY, xs: [67.9, 78.6, 89.4, 100.1].map((x) => x + DX) },
  nit: { y: 615.5 + DY, xInicio: 86.7 + DX, paso: 10.92, digitos: 10 },
  dv: { x: 199.5 + DX, y: 615.5 + DY },
  primerApellido: { x: 213 + DX, y: 617.5 + DY },
  segundoApellido: { x: 295 + DX, y: 617.5 + DY },
  primerNombre: { x: 377 + DX, y: 617.5 + DY },
  otrosNombres: { x: 467 + DX, y: 617.5 + DY },
  codDireccionSeccional: { y: 615.5 + DY, xs: [550.5 + DX, 578.5 + DX] },
  actividadEconomica: { y: 603.5 + DY, xInicio: 69.8 + DX, paso: 12.5, digitos: 4 },
} as const;

export const FUENTE_VALORES = 8;
