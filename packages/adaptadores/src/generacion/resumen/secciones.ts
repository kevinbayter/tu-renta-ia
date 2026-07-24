import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

import {
  ALTO,
  ANCHO,
  COLOR,
  dibujarLogo,
  espacio,
  filaTabla,
  MARGEN,
  nuevaPaginaConMarco,
  pesos,
  rectanguloRedondeado,
  textoCentrado,
  tituloSeccion,
} from './estilo';

import type { Lienzo } from './estilo';

export interface DatosDeclarante {
  nombres: string;
  apellidos: string;
  identificacion: string;
  fechaVencimiento: string;
}

export function paginaPortada(lienzo: Lienzo, declarante: DatosDeclarante, resultado: ResultadoDeclaracion): void {
  lienzo.pagina = lienzo.doc.addPage([ANCHO, ALTO]);
  lienzo.pagina.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: COLOR.navy });
  dibujarLogo(lienzo.pagina, lienzo.fuentes, MARGEN, ALTO - 64, true);
  textoCentrado(lienzo.pagina, 'Resumen de tu declaración de renta', 560, lienzo.fuentes.bold, 24, COLOR.blanco);
  textoCentrado(lienzo.pagina, `Año gravable ${String(resultado.anioGravable)} · Formulario 210`, 534, lienzo.fuentes.normal, 11, COLOR.gris);
  dibujarTarjetaPortada(lienzo, declarante, resultado);
  textoCentrado(lienzo.pagina, `Elaborado el ${fechaHoy()} por TuRenta AI`, 120, lienzo.fuentes.normal, 9, COLOR.gris);
  textoCentrado(lienzo.pagina, 'BORRADOR ILUSTRATIVO — NO VÁLIDO PARA PRESENTAR', 100, lienzo.fuentes.bold, 9, COLOR.verdeClaro);
}

function dibujarTarjetaPortada(lienzo: Lienzo, declarante: DatosDeclarante, resultado: ResultadoDeclaracion): void {
  const x = MARGEN + 40;
  const ancho = ANCHO - 2 * x;
  rectanguloRedondeado(lienzo.pagina, { x, y: 280, ancho, alto: 200, radio: 16, color: COLOR.navySuave });
  const nombre = `${declarante.nombres} ${declarante.apellidos}`.trim();
  textoCentrado(lienzo.pagina, nombre, 438, lienzo.fuentes.bold, 16, COLOR.blanco);
  textoCentrado(lienzo.pagina, `C.C. ${declarante.identificacion}`, 418, lienzo.fuentes.normal, 10, COLOR.gris);
  const esFavor = resultado.liquidacion.totalSaldoAFavor > 0;
  const etiqueta = esFavor ? 'Saldo a favor' : 'Saldo a pagar';
  const cifra = esFavor ? resultado.liquidacion.totalSaldoAFavor : resultado.liquidacion.saldoAPagar;
  textoCentrado(lienzo.pagina, etiqueta, 380, lienzo.fuentes.normal, 11, COLOR.gris);
  textoCentrado(lienzo.pagina, pesos(cifra), 340, lienzo.fuentes.bold, 34, esFavor ? COLOR.verdeClaro : COLOR.ambar);
  textoCentrado(lienzo.pagina, `Fecha límite de presentación: ${declarante.fechaVencimiento}`, 302, lienzo.fuentes.normal, 9, COLOR.gris);
}

export function paginaResultado(lienzo: Lienzo, resultado: ResultadoDeclaracion): void {
  nuevaPaginaConMarco(lienzo, subtituloDe(resultado));
  tituloSeccion(lienzo, '¿Cómo llegamos a tu resultado?');
  filasDesglose(resultado).forEach(([clave, valor, destacar], indice) => {
    filaTabla(lienzo, clave, pesos(valor), { indice, destacar: destacar ?? false });
  });
  espacio(lienzo, 6);
  const l = resultado.liquidacion;
  const esFavor = l.totalSaldoAFavor > 0;
  filaTabla(lienzo, esFavor ? 'TOTAL SALDO A FAVOR' : 'TOTAL SALDO A PAGAR', pesos(esFavor ? l.totalSaldoAFavor : l.saldoAPagar), { indice: 0, destacar: true });
  espacio(lienzo, 18);
  tituloSeccion(lienzo, 'Tu patrimonio al 31 de diciembre');
  const patrimonio: [string, number][] = [
    ['Patrimonio bruto', resultado.patrimonioBruto],
    ['Deudas', -resultado.deudas],
    ['Patrimonio líquido', resultado.patrimonioLiquido],
  ];
  patrimonio.forEach(([clave, valor], indice) => {
    filaTabla(lienzo, clave, pesos(valor), { indice, destacar: clave === 'Patrimonio líquido' });
  });
}

function filasDesglose(resultado: ResultadoDeclaracion): [string, number, boolean?][] {
  const l = resultado.liquidacion;
  const g = resultado.cedulaGeneral;
  return [
    ['Ingresos por rentas de trabajo', g.trabajo.ingresosBrutos],
    ['Ingresos por rentas de capital', g.capital.ingresosBrutos],
    ['Aportes a salud y pensión (no gravados)', -g.trabajo.incrngo],
    ['Componente inflacionario (no gravado)', -g.capital.incrngoComponenteInflacionario],
    ['Rentas exentas y deducciones aplicadas', -g.totalExentasYDeduccionesConFueraDeLimite],
    ['Renta líquida gravable', g.rentaLiquidaGravable, true],
    ['Impuesto de renta (tabla art. 241 E.T.)', l.impuestoNetoRenta],
    ['Retenciones que ya te practicaron', -l.retenciones],
    ['Saldo a favor de años anteriores', -l.saldoFavorAnterior],
    ['Anticipo para el año siguiente', l.anticipoAnioSiguiente],
  ];
}

export function paginaDepuracion(lienzo: Lienzo, resultado: ResultadoDeclaracion): void {
  nuevaPaginaConMarco(lienzo, subtituloDe(resultado));
  const t = resultado.cedulaGeneral.trabajo;
  tituloSeccion(lienzo, 'Rentas de trabajo');
  const filasTrabajo: [string, number, boolean?, number?][] = [
    ['Ingresos brutos laborales', t.ingresosBrutos],
    ['(-) Aportes obligatorios a salud y pensión', -t.incrngo],
    ['Renta líquida', t.rentaLiquida, true],
    ['(-) Deducción por dependientes (art. 387)', -t.deduccionDependientes, false, 10],
    ['(-) Medicina prepagada', -t.deduccionPrepagada, false, 10],
    ['(-) Intereses de vivienda e ICETEX', -t.deduccionIntereses, false, 10],
    ['(-) Cesantías exentas', -t.cesantiasExentas, false, 10],
    ['(-) Renta exenta del 25%', -t.exenta25, false, 10],
    ['Beneficios aplicados (limitados al 40%)', -t.asignadoLimitado, true],
    ['Renta líquida ordinaria de trabajo', t.rentaLiquidaOrdinaria, true],
  ];
  filasTrabajo.forEach(([clave, valor, destacar, sangria], indice) => {
    filaTabla(lienzo, clave, pesos(valor), { indice, destacar: destacar ?? false, sangria: sangria ?? 0 });
  });
  espacio(lienzo, 16);
  dibujarCapitalYGlobal(lienzo, resultado);
}

function dibujarCapitalYGlobal(lienzo: Lienzo, resultado: ResultadoDeclaracion): void {
  const k = resultado.cedulaGeneral.capital;
  const g = resultado.cedulaGeneral;
  tituloSeccion(lienzo, 'Rentas de capital');
  const filasCapital: [string, number, boolean?][] = [
    ['Rendimientos financieros y de fondos', k.ingresosBrutos],
    ['(-) Componente inflacionario (55,43%)', -k.incrngoComponenteInflacionario],
    ['(-) GMF deducible aplicado', -k.asignadoLimitado],
    ['Renta líquida ordinaria de capital', k.rentaLiquidaOrdinaria, true],
  ];
  filasCapital.forEach(([clave, valor, destacar], indice) => {
    filaTabla(lienzo, clave, pesos(valor), { indice, destacar: destacar ?? false });
  });
  espacio(lienzo, 16);
  tituloSeccion(lienzo, 'Límite global y beneficios adicionales');
  const filasGlobal: [string, number, boolean?][] = [
    ['Límite de exentas y deducciones (40% / 1.340 UVT)', g.limiteGlobal],
    ['Deducción 1% compras con factura electrónica', g.deduccionFacturaElectronica],
    ['Deducción por dependientes (72 UVT, art. 336)', g.deduccionDependientesAdicionales],
    ['Renta líquida gravable cédula general', g.rentaLiquidaGravable, true],
  ];
  filasGlobal.forEach(([clave, valor, destacar], indice) => {
    filaTabla(lienzo, clave, pesos(valor), { indice, destacar: destacar ?? false });
  });
}

const PASOS_GUIA = [
  'Verifica tu RUT: correo y celular actualizados, responsabilidad 05 activa.',
  'Genera o renueva tu firma electrónica: Usuario Registrado > "Generar o gestionar mi firma electrónica".',
  'Entra a "Diligenciar y presentar" y abre el formulario 210 del año gravable.',
  'Transcribe cada casilla usando la página 1 de este documento (formulario oficial diligenciado).',
  'Guarda el borrador en el sistema, fírmalo con tu contraseña de firma electrónica y preséntalo.',
];

export function paginaGuia(lienzo: Lienzo, declarante: DatosDeclarante, resultado: ResultadoDeclaracion): void {
  nuevaPaginaConMarco(lienzo, subtituloDe(resultado));
  tituloSeccion(lienzo, 'Guía para presentar en la DIAN');
  dibujarCajaFecha(lienzo, declarante);
  PASOS_GUIA.forEach((paso, indice) => {
    dibujarPasoGuia(lienzo, indice + 1, paso);
  });
  dibujarPasoGuia(lienzo, 6, pasoFinal(resultado));
  espacio(lienzo, 20);
  tituloSeccion(lienzo, 'Recuerda');
  const notas = [
    'Este documento es un borrador ilustrativo: la declaración oficial la diligencias, firmas y presentas tú.',
    'Todo el proceso en el portal de la DIAN (dian.gov.co) es gratuito.',
    'Guarda el PDF con la marca "Presentado" que genera la DIAN como tu soporte.',
  ];
  notas.forEach((nota, indice) => {
    filaTabla(lienzo, `· ${nota}`, '', { indice });
  });
}

function dibujarCajaFecha(lienzo: Lienzo, declarante: DatosDeclarante): void {
  rectanguloRedondeado(lienzo.pagina, { x: MARGEN, y: lienzo.y - 34, ancho: ANCHO - 2 * MARGEN, alto: 40, radio: 10, color: COLOR.verdeSuave });
  lienzo.pagina.drawText('Tu fecha límite para presentar:', { x: MARGEN + 14, y: lienzo.y - 18, size: 10, font: lienzo.fuentes.normal, color: COLOR.tinta });
  const fecha = declarante.fechaVencimiento;
  lienzo.pagina.drawText(fecha, { x: MARGEN + 168, y: lienzo.y - 19, size: 12, font: lienzo.fuentes.bold, color: COLOR.verde });
  const dosDigitos = declarante.identificacion.replace(/\D/g, '').slice(-2);
  lienzo.pagina.drawText(`(cédula terminada en ${dosDigitos})`, { x: MARGEN + 250, y: lienzo.y - 18, size: 9, font: lienzo.fuentes.normal, color: COLOR.gris });
  espacio(lienzo, 56);
}

function dibujarPasoGuia(lienzo: Lienzo, numero: number, texto: string): void {
  rectanguloRedondeado(lienzo.pagina, { x: MARGEN, y: lienzo.y - 6, ancho: 16, alto: 16, radio: 8, color: COLOR.verde });
  const anchoNumero = lienzo.fuentes.bold.widthOfTextAtSize(String(numero), 9);
  lienzo.pagina.drawText(String(numero), { x: MARGEN + 8 - anchoNumero / 2, y: lienzo.y - 2, size: 9, font: lienzo.fuentes.bold, color: COLOR.blanco });
  lienzo.pagina.drawText(texto, { x: MARGEN + 26, y: lienzo.y, size: 9.5, font: lienzo.fuentes.normal, color: COLOR.tinta, maxWidth: ANCHO - 2 * MARGEN - 26, lineHeight: 12 });
  espacio(lienzo, texto.length > 95 ? 34 : 26);
}

function pasoFinal(resultado: ResultadoDeclaracion): string {
  if (resultado.liquidacion.saldoAPagar > 0) {
    return `Genera el recibo 490 y paga ${pesos(resultado.liquidacion.saldoAPagar)} por PSE o en tu banco antes de la fecha límite.`;
  }
  return 'No tienes saldo a pagar. Si quieres tu saldo a favor en efectivo, puedes solicitar la devolución ante la DIAN.';
}

export function paginaCasillas(lienzo: Lienzo, resultado: ResultadoDeclaracion): void {
  nuevaPaginaConMarco(lienzo, subtituloDe(resultado));
  tituloSeccion(lienzo, 'Valores por casilla del formulario 210');
  lienzo.pagina.drawText('Úsalos para transcribir en el portal de la DIAN. Las casillas no listadas van en 0.', {
    x: MARGEN,
    y: lienzo.y,
    size: 9,
    font: lienzo.fuentes.normal,
    color: COLOR.gris,
  });
  espacio(lienzo, 22);
  const entradas = Object.entries(resultado.casillas).sort(([a], [b]) => Number(a) - Number(b));
  const mitad = Math.ceil(entradas.length / 2);
  dibujarColumnaCasillas(lienzo, entradas.slice(0, mitad), MARGEN, lienzo.y);
  dibujarColumnaCasillas(lienzo, entradas.slice(mitad), ANCHO / 2 + 10, lienzo.y);
}

function dibujarColumnaCasillas(lienzo: Lienzo, entradas: [string, number][], x: number, yInicial: number): void {
  const anchoCol = ANCHO / 2 - MARGEN - 10;
  entradas.forEach(([casilla, valor], indice) => {
    const y = yInicial - indice * 15;
    if (indice % 2 === 1) {
      lienzo.pagina.drawRectangle({ x, y: y - 4, width: anchoCol, height: 13, color: COLOR.zebra });
    }
    lienzo.pagina.drawText(`Casilla ${casilla}`, { x: x + 6, y, size: 8.5, font: lienzo.fuentes.normal, color: COLOR.gris });
    const texto = pesos(valor);
    const ancho = lienzo.fuentes.bold.widthOfTextAtSize(texto, 8.5);
    lienzo.pagina.drawText(texto, { x: x + anchoCol - 6 - ancho, y, size: 8.5, font: lienzo.fuentes.bold, color: COLOR.tinta });
  });
}

function subtituloDe(resultado: ResultadoDeclaracion): string {
  return `Borrador declaración de renta · AG ${String(resultado.anioGravable)}`;
}

function fechaHoy(): string {
  return new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}
