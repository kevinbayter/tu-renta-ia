import { construirPerfilFiscal } from '@turenta/core';
import { liquidarDeclaracion } from '@turenta/motor-fiscal';
import { NextResponse } from 'next/server';

import type { ExogenaParseada, InsumosPerfil, RespuestasEntrevista } from '@turenta/core';

interface EntradaSimulador {
  ingresosLaborales?: number;
  aportesSaludPension?: number;
  retenciones?: number;
  dependientes?: number;
  medicinaPrepagada?: number;
  interesesVivienda?: number;
}

/** Estimación rápida con el MOTOR determinista (la IA no participa). */
export async function POST(request: Request): Promise<NextResponse> {
  const entrada = (await request.json()) as EntradaSimulador;
  const ingresos = enteroPositivo(entrada.ingresosLaborales);
  if (ingresos === 0) {
    return NextResponse.json({ error: 'Indica tus ingresos laborales del año' }, { status: 400 });
  }
  const resultado = liquidarDeclaracion(construirPerfilFiscal(insumosDe(entrada, ingresos)));
  return NextResponse.json({
    estimacion: {
      rentaLiquidaGravable: resultado.cedulaGeneral.rentaLiquidaGravable,
      impuestoNeto: resultado.liquidacion.impuestoNetoRenta,
      retenciones: enteroPositivo(entrada.retenciones),
      saldoAFavor: resultado.liquidacion.totalSaldoAFavor,
      saldoAPagar: resultado.liquidacion.saldoAPagar,
    },
  });
}

const EXOGENA_VACIA: ExogenaParseada = {
  anioGravable: 2025,
  topes: { ingresos: 0, patrimonio: 0, consumoTarjetas: 0, movimientos: 0, compras: 0 },
  filas: [],
};

function insumosDe(entrada: EntradaSimulador, ingresos: number): InsumosPerfil {
  const aportes = enteroPositivo(entrada.aportesSaludPension);
  return {
    anioGravable: 2025,
    exogena: EXOGENA_VACIA,
    certificados220: [
      {
        tipoDocumento: 'certificado_220',
        nitRetenedor: '',
        razonSocial: 'Simulación',
        anioGravable: 2025,
        periodoInicio: '',
        periodoFin: '',
        pagosSalarios: ingresos,
        pagosPrestaciones: 0,
        otrosPagos: 0,
        cesantiasPagadas: 0,
        cesantiasConsignadas: 0,
        totalIngresosBrutos: ingresos,
        aportesSalud: Math.round(aportes / 2),
        aportesPension: aportes - Math.round(aportes / 2),
        ingresoPromedioSeisMeses: 0,
        retencionFuente: enteroPositivo(entrada.retenciones),
      },
    ],
    certificadosBancarios: [],
    respuestas: respuestasDe(entrada),
  };
}

function respuestasDe(entrada: EntradaSimulador): RespuestasEntrevista {
  const dependientes = Math.min(enteroPositivo(entrada.dependientes), 4);
  return {
    mesesConRelacionLaboral: 12,
    tieneDependiente387: dependientes > 0,
    dependientesAdicionales336: dependientes,
    pagosMedicinaPrepagadaConfirmados: enteroPositivo(entrada.medicinaPrepagada),
    interesesVivienda: enteroPositivo(entrada.interesesVivienda),
    interesesIcetex: 0,
    gmfTotalPagado: 0,
    rendimientosAdicionalesConComponente: 0,
    rendimientosSinComponente: 0,
    activosManuales: [],
    deudas: 0,
    declaracionesPrevias: 0,
    impuestoNetoAnioAnterior: 0,
    anticipoLiquidadoAnioAnterior: 0,
  };
}

function enteroPositivo(valor: unknown): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    return 0;
  }
  return Math.trunc(numero);
}
