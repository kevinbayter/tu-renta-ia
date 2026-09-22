import { afterEach, describe, expect, it } from 'vitest';

import { ConexionMuisca } from '../../src/dian/conexion-muisca';

import { DATOS_210 as DATOS, ESPERA_TEST_MS, contexto, credenciales } from './ayudas-muisca';
import { levantarMuiscaFalso } from './servidor-fixtures';

import type { MuiscaFalso, ModoServidor } from './servidor-fixtures';

/** Firmar y presentar: el tramo donde firmar ES presentar. */

let servidor: MuiscaFalso | null = null;

async function conectar(modo: ModoServidor = 'normal', esperaMs = ESPERA_TEST_MS) {
  servidor = await levantarMuiscaFalso(modo);
  return new ConexionMuisca({ urlBase: servidor.urlBase, esperaMs });
}

afterEach(async () => {
  await servidor?.cerrar();
  servidor = null;
});

describe('firmar y presentar (research/09 §5)', () => {
  it('firma con la contraseña de la cuenta, presenta y trae el acuse', async () => {
    const conexion = await conectar();
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ exito: true, guardado: true, firmada: true, presentada: true });
    // El nombre lo fija el portal en la respuesta, no el enlace que se pulsa.
    expect(resultado.acuse?.nombreArchivo).toBe('acuse.pdf');
    expect(Buffer.from(resultado.acuse?.contenidoBase64 ?? '', 'base64').toString()).toContain('acuse-ficticio');
    expect(servidor?.firmadoCon()).toBe('');
  });

  /**
   * El código llega a "Mis comunicados", la bandeja del propio portal, en la
   * misma sesión: leerlo de ahí le evita al usuario ir a buscarlo al correo.
   */
  it('si el portal pide código, lo solicita, lo lee de los comunicados y firma', async () => {
    const conexion = await conectar('firma_con_codigo');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    expect(servidor?.visitas).toContain('/editor/solicitar-codigo');
    // Firmó con el código del aviso, no con la cédula que va en otro asunto.
    expect(servidor?.firmadoCon()).toBe('ZX99120');
  });

  it('si el aviso con el código nunca llega, NO firma: se lo pide al usuario', async () => {
    const conexion = await conectar('codigo_sin_aviso');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ requiereCodigo: true, firmada: false, presentada: false });
    expect(servidor?.firmadoCon()).toBeNull();
    expect(servidor?.visitas).toContain('/editor/solicitar-codigo');
  });

  it('con el código, firma y presenta', async () => {
    const conexion = await conectar('firma_con_codigo');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), { ...DATOS, codigoFirma: '654321' });
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    expect(servidor?.firmadoCon()).toBe('654321');
  });

  it('si la cuenta no tiene firma electrónica, lo dice tal cual y no culpa al portal', async () => {
    const conexion = await conectar('sin_firma_electronica');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado.motivoFallo).toBe('sin_firma_electronica');
    expect(servidor?.borradorGuardado()).toBeNull();
    expect(servidor?.firmadoCon()).toBeNull();
  });

  it('si el borrador ya está en el portal, lo verifica contra su PDF y firma sin rehacerlo', async () => {
    const conexion = await conectar('en_paso_firma');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    // No volvió a llenar ni a guardar: le bastó el PDF del borrador.
    expect(servidor?.visitas).not.toContain('/editor/guardar');
  });

  /**
   * Lo que pasó en la cuenta real: el firmante ya estaba autorizado (el portal
   * ofrece "Desautorizar", no "Autorizar"), abre varios diálogos a la vez y deja
   * "Firmar" inerte mientras consulta el certificado.
   */
  it('con el firmante ya autorizado, espera a que el portal habilite "Firmar" y firma', async () => {
    const conexion = await conectar('firma_ya_autorizada');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    expect(servidor?.firmadoCon()).not.toBeNull();
  });

  /**
   * Lo que el diagnóstico encontró en la cuenta real: un iframe tapa el diálogo
   * y los botones de la página quedan apagados. Los que responden están dentro.
   */
  it('si la firma vive dentro de un iframe del portal, entra al marco y firma ahí', async () => {
    const conexion = await conectar('firma_en_marco');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    expect(servidor?.firmadoCon()).not.toBeNull();
  });

  /**
   * Lo que pasó en la cuenta real: firmada, pero el paso "Firmar" vuelve a
   * rotular "Ver borrador" al recargar. Firmar otra vez solo abre un diálogo
   * que ya únicamente ofrece "Desautorizar"; la prueba está un paso más allá.
   */
  it('si el portal no delata la firma, avanza un paso y la encuentra antes de refirmar', async () => {
    const conexion = await conectar('firmada_sin_delatar');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    expect(servidor?.firmadoCon()).toBeNull();
  });

  it('si ya quedó firmada en un intento anterior, no la rehace: solo la presenta', async () => {
    const conexion = await conectar('ya_firmada');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado).toMatchObject({ firmada: true, presentada: true });
    expect(resultado.acuse?.nombreArchivo).toBe('acuse.pdf');
    expect(servidor?.firmadoCon()).toBeNull();
    expect(servidor?.borradorGuardado()).toBeNull();
  });

  /**
   * Presentar dos veces no se deshace: la DIAN recibiría una segunda
   * declaración. Si ya está en la lista de presentadas, no se toca el borrador.
   */
  it('si el año ya está presentado en el portal, no vuelve a presentarlo', async () => {
    const conexion = await conectar();
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2024), DATOS);
    expect(resultado).toMatchObject({ presentada: true, firmada: true });
    // Y se trae el PDF: decir "ya presentaste" sin dejar bajarlo es media respuesta.
    expect(resultado.acuse?.nombreArchivo).toBe('3333333333333.pdf');
    expect(servidor?.firmadoCon()).toBeNull();
    expect(servidor?.borradorGuardado()).toBeNull();
    expect(servidor?.visitas).not.toContain('/editor/presentar');
  });

  it('si el portal calcula distinto, no firma ni presenta', async () => {
    const conexion = await conectar('calculo_distinto');
    const resultado = await conexion.presentarDeclaracion(credenciales(), contexto(2025), DATOS);
    expect(resultado.presentada).toBeUndefined();
    expect(resultado.diferencias).toEqual([{ casilla: '31', turenta: 150_000_000, portal: 150_001_000 }]);
    expect(servidor?.firmadoCon()).toBeNull();
    expect(servidor?.borradorGuardado()).toBeNull();
  });
});
