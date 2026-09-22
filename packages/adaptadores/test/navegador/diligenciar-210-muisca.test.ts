import { afterEach, describe, expect, it } from 'vitest';

import { ConexionMuisca } from '../../src/dian/conexion-muisca';

import { DATOS_210 as DATOS, ESPERA_TEST_MS, contexto, credenciales } from './ayudas-muisca';
import { levantarMuiscaFalso } from './servidor-fixtures';

import type { MuiscaFalso, ModoServidor } from './servidor-fixtures';

/** Diligenciar el 210 y dejarlo como borrador, sin firmar. */

let servidor: MuiscaFalso | null = null;

async function conectar(modo: ModoServidor = 'normal', esperaMs = ESPERA_TEST_MS) {
  servidor = await levantarMuiscaFalso(modo);
  return new ConexionMuisca({ urlBase: servidor.urlBase, esperaMs });
}

afterEach(async () => {
  await servidor?.cerrar();
  servidor = null;
});

describe('diligenciar el 210 como borrador (research/09)', () => {
  it('digita solo las casillas de entrada, pisa la sugerida, verifica las calculadas y guarda', async () => {
    const conexion = await conectar();
    const resultado = await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ exito: true, guardado: true, numeroFormulario: '4444444444444', diferencias: [] });
    const guardado = servidor?.borradorGuardado();
    expect(guardado?.['58']).toBe(String(DATOS.casillas['58']));
    expect(guardado?.['74']).toBe('0');
    expect(guardado?.['286']).toBe('1');
    expect(guardado?.['24']).toBe('0020');
  });

  it('NUNCA pulsa "Firmar y presentar" de la sugerida', async () => {
    const conexion = await conectar();
    await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(servidor?.visitas).not.toContain('/firmar-sugerida');
  });

  it('llega hasta la pantalla de firma y se detiene: firmar es presentar, así que no pulsa "Firmar"', async () => {
    const conexion = await conectar();
    const resultado = await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado.detalle).toContain('aviso=Borrador guardado exitosamente');
    expect(resultado.mapaFirma).toMatchObject({
      pulso: 'Guardar y continuar',
      campos: [],
      botones: expect.arrayContaining(['Ver borrador', 'Firmar']),
      avisos: expect.arrayContaining(['Firmar formulario']),
    });
    expect(servidor?.visitas).not.toContain('/editor/solicitar-codigo');
    expect(servidor?.visitas).not.toContain('/editor/firmar');
  });

  it('con un borrador ya guardado lo retoma con "Editar" del año pedido, nunca "Anular"', async () => {
    const conexion = await conectar('con_borrador');
    const resultado = await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ exito: true, guardado: true, numeroFormulario: '4444444444444' });
    expect(servidor?.visitas).not.toContain('/anular-borrador');
    expect(servidor?.visitas).not.toContain('/editor-equivocado');
  });

  it('cuenta en qué va: sección por sección hasta guardar', async () => {
    const conexion = await conectar();
    const avances: string[] = [];
    await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS, (p) => avances.push(p.mensaje));
    expect(avances).toContain('Diligenciando patrimonio (sección 3)');
    expect(avances).toContain('Diligenciando rentas de capital (sección 4)');
    expect(avances.at(-1)).toBe('Todo cuadra: guardando el borrador en MUISCA');
  });

  it('si no recorrió el formulario completo, NO guarda aunque no haya diferencias', async () => {
    const conexion = await conectar('recorrido_corto');
    const resultado = await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ exito: false, motivoFallo: 'estructura_cambiada' });
    expect(resultado.detalle).toContain('Recorrido incompleto: sin leer 31,91,111');
    expect(servidor?.borradorGuardado()).toBeNull();
  });

  it('si el portal calcula distinto al motor, no guarda y dice qué casilla', async () => {
    const conexion = await conectar('calculo_distinto');
    const resultado = await conexion.diligenciarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado.guardado).toBe(false);
    expect(resultado.diferencias).toEqual([{ casilla: '31', turenta: 150_000_000, portal: 150_001_000 }]);
    expect(servidor?.borradorGuardado()).toBeNull();
  });
});
