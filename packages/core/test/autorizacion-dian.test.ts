import { describe, expect, it } from 'vitest';

import {
  autorizacionVigente,
  crearAutorizacion,
  MINUTOS_VIGENCIA_AUTORIZACION,
  permiteAlcance,
  serializarAutorizacion,
  textoAutorizacion,
  VERSION_TEXTO_AUTORIZACION,
} from '../src/dian/autorizacion';

const AHORA = new Date('2026-08-15T10:00:00Z');

function autorizacionDe(alcances: Parameters<typeof crearAutorizacion>[0]['alcances']) {
  return crearAutorizacion(
    {
      titularIdentificacion: '1234567890',
      operadorUsuarioId: 'usuario-1',
      alcances,
      textoAceptado: 'texto',
    },
    AHORA,
  );
}

describe('autorización para operar en la DIAN', () => {
  it('vence sola: no quedan permisos abiertos', () => {
    const auth = autorizacionDe(['leer_exogena']);
    expect(auth.expiraEn.getTime() - auth.otorgadaEn.getTime()).toBe(MINUTOS_VIGENCIA_AUTORIZACION * 60_000);
    expect(autorizacionVigente(auth, AHORA)).toBe(true);
    const despues = new Date(AHORA.getTime() + (MINUTOS_VIGENCIA_AUTORIZACION + 1) * 60_000);
    expect(autorizacionVigente(auth, despues)).toBe(false);
  });

  it('solo habilita los alcances enumerados: nunca se asume uno mayor', () => {
    const auth = autorizacionDe(['leer_exogena']);
    expect(permiteAlcance(auth, 'leer_exogena', AHORA)).toBe(true);
    expect(permiteAlcance(auth, 'presentar_declaracion', AHORA)).toBe(false);
    expect(permiteAlcance(auth, 'leer_declaraciones', AHORA)).toBe(false);
  });

  it('una autorización vencida no habilita ni siquiera su propio alcance', () => {
    const auth = autorizacionDe(['leer_exogena']);
    const tarde = new Date(AHORA.getTime() + 60 * 60_000);
    expect(permiteAlcance(auth, 'leer_exogena', tarde)).toBe(false);
  });

  it('el texto legal dice lo esencial: no almacenamos y es revocable', () => {
    const plano = serializarAutorizacion(textoAutorizacion('1234567890', ['leer_exogena']));
    expect(plano).toContain('1234567890');
    expect(plano).toContain('NO serán almacenadas');
    expect(plano).toContain('revocable');
  });

  /**
   * Un muro de texto no se lee, y lo que no se lee no informa. El límite no es
   * estético: es la diferencia entre consentimiento informado y una firma a
   * ciegas.
   */
  it('cabe en una pantalla: ninguna lista se desborda', () => {
    const texto = textoAutorizacion('1234567890', ['presentar_declaracion', 'recordar_acceso']);
    expect(texto.haremos.length + texto.noHaremos.length + texto.declaraciones.length).toBeLessThanOrEqual(6);
    [...texto.haremos, ...texto.noHaremos, ...texto.declaraciones].forEach((linea) => {
      expect(linea.length).toBeLessThanOrEqual(120);
    });
  });

  it('solo enumera los alcances pedidos: no ofrece presentar si no se pidió', () => {
    const texto = textoAutorizacion('1234567890', ['leer_exogena']);
    expect(texto.haremos.join(' ')).toContain('exógena');
    expect(texto.haremos.join(' ')).not.toContain('presentar');
  });

  it('el texto es estructurado para que la pantalla muestre lo mismo que se hashea', () => {
    // Si la UI tuviera su propia redacción, guardaríamos el hash de algo que el
    // usuario nunca vio y la evidencia no probaría nada.
    const texto = textoAutorizacion('1234567890', ['leer_exogena', 'leer_declaraciones']);
    const plano = serializarAutorizacion(texto);
    [...texto.haremos, ...texto.noHaremos, ...texto.declaraciones].forEach((linea) => {
      expect(plano).toContain(linea);
    });
    expect(plano).toContain(texto.encabezado);
  });

  it('la serialización es determinista: el mismo consentimiento da el mismo hash', () => {
    const uno = serializarAutorizacion(textoAutorizacion('1234567890', ['leer_exogena']));
    const dos = serializarAutorizacion(textoAutorizacion('1234567890', ['leer_exogena']));
    expect(uno).toBe(dos);
  });

  it('lleva versión: cambiar la redacción no invalida las evidencias viejas', () => {
    const texto = textoAutorizacion('1234567890', ['leer_exogena']);
    expect(texto.version).toBe(VERSION_TEXTO_AUTORIZACION);
    expect(serializarAutorizacion(texto)).toContain(VERSION_TEXTO_AUTORIZACION);
  });

  it('distingue titular de operador (base del futuro B2B con contadores)', () => {
    const auth = crearAutorizacion(
      {
        titularIdentificacion: '99999999',
        operadorUsuarioId: 'contador-7',
        alcances: ['leer_exogena'],
        textoAceptado: 'texto',
      },
      AHORA,
    );
    expect(auth.titularIdentificacion).not.toBe(auth.operadorUsuarioId);
  });

  it('en nombre de otra persona nunca declara ser el titular y deja constancia de su autorización', () => {
    const texto = textoAutorizacion('23456789', ['leer_exogena', 'leer_declaraciones'], true);
    const plano = serializarAutorizacion(texto);
    expect(texto.declaraciones.join(' ')).not.toContain('Soy el titular');
    expect(plano).toContain('No soy el titular');
    expect(plano).toContain('en_nombre_de_otro: si');
    expect(texto.haremos.join(' ')).toContain('su información exógena');
  });

  it('las dos variantes producen textos distintos: la huella distingue quién firmó', () => {
    const propia = serializarAutorizacion(textoAutorizacion('23456789', ['leer_exogena']));
    const deOtro = serializarAutorizacion(textoAutorizacion('23456789', ['leer_exogena'], true));
    expect(propia).not.toBe(deOtro);
    expect(propia).toContain('en_nombre_de_otro: no');
  });
});


describe('autorizar la presentación', () => {
  it('dice que firma con la firma electrónica y presenta, y advierte que es irreversible', () => {
    const texto = textoAutorizacion('1234567890', ['presentar_declaracion']);
    expect(texto.haremos.join(' ')).toContain('presentar tu declaración ante la DIAN');
    expect(texto.declaraciones.join(' ')).toContain('declaración de corrección');
  });

  it('diligenciar sin presentar no arrastra la advertencia de irreversibilidad', () => {
    const texto = textoAutorizacion('1234567890', ['diligenciar_declaracion']);
    expect(texto.declaraciones.join(' ')).not.toContain('declaración de corrección');
    expect(texto.haremos.join(' ')).toContain('sin firmarla ni presentarla');
  });
});
