import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { estadoDeLosDialogos } from '../../src/dian/diagnostico-firma';

import type { Browser, Page } from 'playwright';

/**
 * El diagnóstico corre DENTRO del navegador. Una función serializada que
 * referencie algo del módulo revienta allí con un ReferenceError, y como el
 * adaptador la llama entre `catch`, el fallo se ve como "sin diagnóstico":
 * justo cuando más falta hace. Solo una página real lo descubre.
 */
describe('diagnóstico de la ventana de firma', () => {
  let navegador: Browser | null = null;
  let pagina: Page | null = null;

  beforeAll(async () => {
    const { chromium } = await import('playwright');
    navegador = await chromium.launch({ headless: true });
    pagina = await navegador.newPage();
  });

  afterAll(async () => {
    await navegador?.close();
  });

  const PANTALLA = `
    <div role="dialog" style="position:fixed;inset:0">
      <button disabled>Firmar</button>
      <button>Desautorizar</button>
    </div>
    <div role="dialog" style="position:fixed;inset:0;z-index:9">
      <button>Autorizar</button>
    </div>`;

  it('dice de cada botón si está activo o inerte, y qué capa le tapa el clic', async () => {
    await pagina?.setContent(PANTALLA);
    const estado = await pagina?.evaluate(estadoDeLosDialogos, ['Autorizar', 'Firmar', 'Desautorizar']);
    // El primer diálogo queda debajo del segundo: sus botones están tapados.
    expect(estado).toContain('Firmar=inerte/tapado:');
    expect(estado).toContain('Desautorizar=activo/tapado:');
    expect(estado).toContain('Autorizar=ausente');
    // El de encima recibe sus propios clics.
    expect(estado).toContain('Autorizar=activo,');
  });

  it('avisa cuando hay un campo de contraseña, que es la señal de que llegó al final', async () => {
    await pagina?.setContent('<div role="dialog"><input type="password" /><button>Firmar</button></div>');
    const estado = await pagina?.evaluate(estadoDeLosDialogos, ['Firmar']);
    expect(estado).toContain(',clave');
  });
});
