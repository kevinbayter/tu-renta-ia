import { describe, expect, it, vi } from 'vitest';

import { finDelFlujo } from '../lib/leer-flujo';
import { responderEnFlujo } from '../server/flujo-ndjson';

import type { Avance } from '../lib/leer-flujo';
import type { Emitir } from '../server/flujo-ndjson';

async function robotDeMentira(emitir: Emitir): Promise<unknown> {
  emitir({ progreso: { etapa: 'diligenciando', mensaje: 'Diligenciando patrimonio (sección 4)' } });
  emitir({ progreso: { etapa: 'guardando', mensaje: 'Guardando' } });
  return { ok: true, guardado: true };
}

function coleccionar(): { avances: Avance[]; alAvanzar: (a: Avance) => void } {
  const avances: Avance[] = [];
  return { avances, alAvanzar: (a) => avances.push(a) };
}

const mensajes = (avances: Avance[]) => avances.map((a) => a.mensaje);

describe('avances del robot en vivo (NDJSON)', () => {
  it('el navegador recibe cada avance y el desenlace va al final', async () => {
    const respuesta = responderEnFlujo(robotDeMentira, vi.fn());
    const { avances, alAvanzar } = coleccionar();
    const fin = await finDelFlujo(respuesta, alAvanzar);
    expect(mensajes(avances)).toEqual(['Diligenciando patrimonio (sección 4)', 'Guardando']);
    expect(fin).toEqual({ ok: true, guardado: true });
  });

  it('una línea partida entre dos trozos (y con tildes) se arma completa', async () => {
    const texto = '{"progreso":{"etapa":"x","mensaje":"Sección de liquidación"}}\n{"fin":{"ok":true}}\n';
    const bytes = new TextEncoder().encode(texto);
    const corte = texto.indexOf('ó') + 1;
    const cuerpo = new ReadableStream<Uint8Array>({
      start(control) {
        control.enqueue(bytes.slice(0, corte));
        control.enqueue(bytes.slice(corte));
        control.close();
      },
    });
    const { avances, alAvanzar } = coleccionar();
    const fin = await finDelFlujo(new Response(cuerpo, { headers: { 'content-type': 'application/x-ndjson' } }), alAvanzar);
    expect(avances[0]?.mensaje).toBe('Sección de liquidación');
    expect(fin).toEqual({ ok: true });
  });

  it('si el trabajo revienta, cierra con un fallo y libera la contraseña igual', async () => {
    const alTerminar = vi.fn();
    const respuesta = responderEnFlujo(() => Promise.reject(new Error('portal caído con datos sensibles')), alTerminar);
    const fin = await finDelFlujo(respuesta, vi.fn());
    expect(fin['ok']).toBe(false);
    expect(JSON.stringify(fin)).not.toContain('sensibles');
    expect(alTerminar).toHaveBeenCalledOnce();
  });

  it('un rechazo en JSON plano (antes de arrancar el robot) es el desenlace', async () => {
    const fin = await finDelFlujo(Response.json({ mensaje: 'Debes iniciar sesión' }, { status: 401 }), vi.fn());
    expect(fin).toEqual({ mensaje: 'Debes iniciar sesión', ok: false });
  });
});
