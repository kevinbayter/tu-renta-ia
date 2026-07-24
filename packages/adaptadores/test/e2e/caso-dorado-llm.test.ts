import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { construirPerfilFiscal } from '@turenta/core';
import type { RespuestasEntrevista } from '@turenta/core';
import { liquidarDeclaracion } from '@turenta/motor-fiscal';

import { ExtractorCertificados } from '../../src/extraccion/certificados/extractor-certificados';
import { parsearExogena } from '../../src/extraccion/exogena/parser-exogena';
import { extraerTextoPdf } from '../../src/extraccion/pdf/extraer-texto';
import { crearLlmDesdeEnv } from '../../src/llm/crear-llm';


/**
 * E2E CON LLM REAL — gate de Fase 2: los documentos reales de /docs pasan por
 * extracción (Kimi K3) + ensamblaje + motor y reproducen el resultado de referencia.
 * Se salta si no hay documentos (CI) o no hay API key.
 */

const DOCS = join(import.meta.dirname, '../../../../docs');
const ARCHIVOS = {
  exogena: join(DOCS, 'reporteExogena2025.xlsx'),
  meli220: join(DOCS, 'certificado-220-empleador-1.pdf'),
  stc220: join(DOCS, 'certificado-220-empleador-2.pdf'),
  // OJO con los nombres: "Retefuente_..." es el certificado de Salud Prepagada (prepagada)
  // y "certificado-de-retencion-en-la-fuente-2025" es el de Nu (bancario).
  nu: join(DOCS, 'certificado-bancario.pdf'),
  prepagada: join(DOCS, 'certificado-prepagada.pdf'),
};

const hayDocs = Object.values(ARCHIVOS).every((ruta) => existsSync(ruta));
const hayLlm = (): boolean => Boolean(process.env['OPENCODE_API_KEY'] ?? process.env['LLM_API_KEY']);

const RESPUESTAS: RespuestasEntrevista = {
  mesesConRelacionLaboral: 11,
  tieneDependiente387: true,
  dependientesAdicionales336: 1,
  pagosMedicinaPrepagadaConfirmados: 3_199_749,
  interesesVivienda: 0,
  interesesIcetex: 0,
  gmfTotalPagado: 34_913,
  rendimientosAdicionalesConComponente: 6_103,
  rendimientosSinComponente: 382_694,
  activosManuales: [
    { descripcion: 'Bienes personales', valor: 24_500_000 },
    { descripcion: 'Ejemplo Dos cuenta', valor: 6_909 },
    { descripcion: 'FIC Ejemplo Dos', valor: 15_205 },
    { descripcion: 'Fondo Uno (Fiduciaria Uno)', valor: 1_467_428 },
    { descripcion: 'Comisionista (Comisionista Ejemplo)', valor: 682_355 },
    { descripcion: 'CxC apartamento', valor: 20_900_000 },
    { descripcion: 'CxC saldo a favor DIAN', valor: 1_401_000 },
  ],
  deudas: 0,
  declaracionesPrevias: 2,
  impuestoNetoAnioAnterior: 0,
  anticipoLiquidadoAnioAnterior: 0,
};

describe.skipIf(!hayDocs)('E2E caso dorado con documentos reales + Kimi K3', () => {
  it('extrae, ensambla y liquida reproduciendo el resultado de referencia', async () => {
    expect(hayLlm(), 'Falta OPENCODE_API_KEY en .env.local').toBe(true);
    const extractor = new ExtractorCertificados(crearLlmDesdeEnv(process.env));

    const exogena = parsearExogena(new Uint8Array(readFileSync(ARCHIVOS.exogena)));
    expect(exogena.anioGravable).toBe(2025);
    expect(exogena.topes.ingresos).toBe(114_456_920);

    // Secuencial: el tier de la suscripción limita la concurrencia del proveedor.
    const andina = await extraerYValidar220(extractor, ARCHIVOS.meli220);
    const stc = await extraerYValidar220(extractor, ARCHIVOS.stc220);
    const nu = await extraerBancario(extractor, ARCHIVOS.nu);
    const prepagada = await extraerPrepagada(extractor, ARCHIVOS.prepagada);

    // Verificación de calidad de extracción contra valores conocidos de los documentos
    expect(andina.totalIngresosBrutos).toBe(95_741_000);
    expect(andina.cesantiasPagadas).toBe(5_535_000);
    expect(andina.cesantiasConsignadas).toBe(6_156_000);
    expect(andina.retencionFuente).toBe(386_000);
    expect(stc.totalIngresosBrutos).toBe(17_493_000);
    expect(stc.aportesSalud).toBe(631_000);
    expect(nu.rendimientos).toBe(786_273);
    expect(nu.saldoCuentas).toBe(20_902_486);
    expect(prepagada.amparos.map((a) => a.valor)).toContain(3_199_749);

    const perfil = construirPerfilFiscal({
      anioGravable: 2025,
      exogena,
      certificados220: [andina, ptc],
      certificadosBancarios: [nu],
      respuestas: RESPUESTAS,
    });
    const resultado = liquidarDeclaracion(perfil);

    expect(resultado.liquidacion.impuestoNetoRenta).toBe(1_217_000);
    expect(resultado.liquidacion.totalSaldoAFavor).toBe(1_401_000);
    expect(resultado.cedulaGeneral.rentaLiquidaGravable).toBe(60_689_000);
    expect(resultado.patrimonioBruto).toBe(69_875_000);
  });
});

async function documentoDe(ruta: string) {
  const { texto, esEscaneado } = await extraerTextoPdf(new Uint8Array(readFileSync(ruta)));
  expect(esEscaneado, `${ruta} debería tener texto embebido`).toBe(false);
  return { texto };
}

async function extraerYValidar220(extractor: ExtractorCertificados, ruta: string) {
  const doc = await documentoDe(ruta);
  const tipo = await extractor.clasificar(doc);
  expect(tipo).toBe('certificado_220');
  const resultado = await extractor.extraer220(doc);
  expect(resultado.pasadasCoinciden, `Discrepancias en ${ruta}: ${resultado.discrepancias.join('; ')}`).toBe(
    true,
  );
  return resultado.datos;
}

async function extraerBancario(extractor: ExtractorCertificados, ruta: string) {
  const doc = await documentoDe(ruta);
  const resultado = await extractor.extraerBancario(doc);
  expect(resultado.pasadasCoinciden).toBe(true);
  return resultado.datos;
}

async function extraerPrepagada(extractor: ExtractorCertificados, ruta: string) {
  const doc = await documentoDe(ruta);
  const resultado = await extractor.extraerPrepagada(doc);
  expect(resultado.pasadasCoinciden).toBe(true);
  return resultado.datos;
}
