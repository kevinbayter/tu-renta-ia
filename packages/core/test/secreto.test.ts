import { inspect } from 'node:util';

import { describe, expect, it } from 'vitest';

import { detalleSeguro, esClaveSecreta, redactar, redactarValores } from '../src/dian/redaccion';
import { MARCA_REDACTADO, Secreto } from '../src/dian/secreto';

const CLAVE = 'sup3r-s3cr3ta';

describe('Secreto: la contraseña no se puede imprimir por accidente', () => {
  it('interpolarlo en un texto NO revela el valor', () => {
    const secreto = new Secreto(CLAVE);
    expect(`clave=${String(secreto)}`).toBe(`clave=${MARCA_REDACTADO}`);
    expect(`${secreto.toString()}`).not.toContain(CLAVE);
  });

  it('serializarlo a JSON NO revela el valor', () => {
    const cuerpo = JSON.stringify({ usuario: 'ana', contrasena: new Secreto(CLAVE) });
    expect(cuerpo).not.toContain(CLAVE);
    expect(cuerpo).toContain(MARCA_REDACTADO);
  });

  it('console.log / util.inspect NO revelan el valor', () => {
    // The real case: someone debugging prints the credentials object.
    const impreso = inspect({ credenciales: { contrasena: new Secreto(CLAVE) } }, { depth: 5 });
    expect(impreso).not.toContain(CLAVE);
    expect(impreso).toContain(MARCA_REDACTADO);
  });

  it('revelar() sí entrega el valor: es el único camino', () => {
    expect(new Secreto(CLAVE).revelar()).toBe(CLAVE);
  });

  it('olvidar() vacía el valor tras la operación', () => {
    const secreto = new Secreto(CLAVE);
    secreto.olvidar();
    expect(secreto.revelar()).toBe('');
    expect(secreto.longitud).toBe(0);
  });

  it('redactarEn limpia el secreto de un texto sin exponérselo a quien lo pide', () => {
    const secreto = new Secreto(CLAVE);
    expect(secreto.redactarEn(`falló con ${CLAVE} dentro`)).toBe(`falló con ${MARCA_REDACTADO} dentro`);
  });

  it('un secreto muy corto no se redacta por valor: destrozaría el texto', () => {
    // Redacting a single letter would mangle every message.
    expect(new Secreto('ab').redactarEn('palabra')).toBe('palabra');
  });
});

describe('redacción de lo que sale a logs y respuestas', () => {
  it('detecta las claves sensibles por nombre', () => {
    expect(esClaveSecreta('contrasena')).toBe(true);
    expect(esClaveSecreta('Password')).toBe(true);
    expect(esClaveSecreta('authorization')).toBe(true);
    expect(esClaveSecreta('nombre')).toBe(false);
  });

  it('redacta objetos anidados por nombre de clave y por valor', () => {
    const limpio = redactar({ datos: { contrasena: CLAVE, eco: `usé ${CLAVE}` } }, [CLAVE]) as {
      datos: { contrasena: string; eco: string };
    };
    expect(limpio.datos.contrasena).toBe(MARCA_REDACTADO);
    expect(limpio.datos.eco).not.toContain(CLAVE);
  });

  it('descarta el volcado de página de Playwright, no solo lo filtra', () => {
    // Playwright puts the reason on line 1 and the portal DOM below it.
    const mensaje = `Timeout 45000ms exceeded.\nCall log:\n  - <html>NOMBRE APELLIDO 1.234.567 ${CLAVE}</html>`;
    const detalle = detalleSeguro('TimeoutError', mensaje, [CLAVE]);
    expect(detalle).toBe('TimeoutError: Timeout 45000ms exceeded.');
    expect(detalle).not.toContain('NOMBRE APELLIDO');
    expect(detalle).not.toContain(CLAVE);
  });

  it('un Error se redacta a algo publicable', () => {
    const limpio = redactar(new Error(`falló con ${CLAVE}`), [CLAVE]) as { mensaje: string };
    expect(limpio.mensaje).not.toContain(CLAVE);
  });

  it('redactarValores ignora secretos demasiado cortos', () => {
    expect(redactarValores('hola', ['a'])).toBe('hola');
  });

  it('redactar() NUNCA destripa un Secreto, esté donde esté', () => {
    const secreto = new Secreto(CLAVE);
    [
      redactar(secreto),
      redactar({ datos: secreto }),
      redactar({ credenciales: secreto }),
      redactar([secreto]),
      redactar({ nivel1: { nivel2: { payload: secreto } } }),
    ].forEach((limpio) => {
      expect(JSON.stringify(limpio)).not.toContain(CLAVE);
    });
  });

  it('el valor no se ve ni con Object.keys ni con el spread', () => {
    const secreto = new Secreto(CLAVE);
    expect(Object.keys(secreto)).toEqual([]);
    expect(JSON.stringify({ ...secreto })).not.toContain(CLAVE);
  });

  it('detalleSeguro redacta ANTES de truncar: no sobrevive un prefijo', () => {
    const mensaje = 'x'.repeat(190) + CLAVE;
    const detalle = detalleSeguro('Error', mensaje, [CLAVE]);
    expect(detalle).not.toContain(CLAVE.slice(0, 6));
  });
});
