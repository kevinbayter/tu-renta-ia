import { randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  VERSION_CIFRADO,
  cifrarCredencial,
  descifrarCredencial,
  leerClaveMaestra,
} from '../../src/dian/cifrado-credenciales';

const CLAVE = randomBytes(32);
const OTRA_CLAVE = randomBytes(32);
const CONTRASENA = 'clave-de-la-dian-no-real';

describe('cifrado del acceso guardado', () => {
  it('ida y vuelta: se recupera exactamente lo guardado', () => {
    const sobre = cifrarCredencial(CONTRASENA, CLAVE);
    expect(descifrarCredencial(sobre, CLAVE)).toBe(CONTRASENA);
  });

  it('el sobre no contiene la contraseña por ningún lado', () => {
    const sobre = cifrarCredencial(CONTRASENA, CLAVE);
    expect(JSON.stringify(sobre)).not.toContain(CONTRASENA);
    expect(Buffer.from(sobre.contenido, 'base64').toString('utf8')).not.toContain(CONTRASENA);
  });

  it('con otra clave no se abre: robar la base de datos no basta', () => {
    // Es la garantía central del diseño: el sobre vive en la base y la clave
    // en el worker, que no puede llegar a la base.
    const sobre = cifrarCredencial(CONTRASENA, CLAVE);
    expect(descifrarCredencial(sobre, OTRA_CLAVE)).toBeNull();
  });

  it('un sobre manipulado se rechaza en vez de devolver basura', () => {
    const sobre = cifrarCredencial(CONTRASENA, CLAVE);
    const alterado = { ...sobre, contenido: Buffer.from('otra cosa').toString('base64') };
    expect(descifrarCredencial(alterado, CLAVE)).toBeNull();
  });

  it('cambiar el tag de autenticación también se rechaza', () => {
    const sobre = cifrarCredencial(CONTRASENA, CLAVE);
    const alterado = { ...sobre, tag: randomBytes(16).toString('base64') };
    expect(descifrarCredencial(alterado, CLAVE)).toBeNull();
  });

  it('dos cifrados del mismo secreto son distintos: nonce por sobre', () => {
    const uno = cifrarCredencial(CONTRASENA, CLAVE);
    const dos = cifrarCredencial(CONTRASENA, CLAVE);
    expect(uno.nonce).not.toBe(dos.nonce);
    expect(uno.contenido).not.toBe(dos.contenido);
  });

  it('lleva versión, para poder rotar la clave sin perder los sobres viejos', () => {
    expect(cifrarCredencial(CONTRASENA, CLAVE).version).toBe(VERSION_CIFRADO);
  });

  it('sin clave configurada no se inventa una: devuelve null', () => {
    expect(leerClaveMaestra({})).toBeNull();
    expect(leerClaveMaestra({ DIAN_CRED_KEY: 'corta' })).toBeNull();
  });

  it('acepta una clave de 32 bytes en hexadecimal', () => {
    const clave = leerClaveMaestra({ DIAN_CRED_KEY: CLAVE.toString('hex') });
    expect(clave?.length).toBe(32);
  });
});
