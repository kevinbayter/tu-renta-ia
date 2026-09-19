import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositorio = {
  guardarDeclaracion: vi.fn(() => Promise.resolve({ id: 'declaracion-1' })),
  registrarActividad: vi.fn(() => Promise.resolve()),
  guardarPersona: vi.fn(() => Promise.resolve({ id: 'persona-1' })),
  asegurarPersona: vi.fn(() => Promise.resolve({ id: 'persona-1' })),
};

vi.mock('@/server/composicion', () => ({ obtenerRepositorio: () => repositorio }));
vi.mock('@/server/sesion', () => ({
  leerSesion: () => Promise.resolve({ usuarioId: 'usuario-1', email: 'contador@correo.co' }),
}));

const { POST } = await import('@/app/api/declaraciones/route');

const TITULAR = { nombres: 'Ana', apellidos: 'Pérez', identificacion: '1000000001' };

function guardar(esPropia: boolean): Promise<Response> {
  const cuerpo = { anioGravable: 2025, titular: { ...TITULAR, esPropia }, estado: {} };
  return POST(new Request('https://turenta.tax/api/declaraciones', { method: 'POST', body: JSON.stringify(cuerpo) }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('guardar la declaración de un tercero', () => {
  it('asegura la persona sin tocar su email ni su teléfono', async () => {
    const respuesta = await guardar(false);
    expect(respuesta.status).toBe(200);
    expect(repositorio.asegurarPersona).toHaveBeenCalledWith('usuario-1', TITULAR);
    expect(repositorio.guardarPersona).not.toHaveBeenCalled();
  });

  it('no registra persona cuando la declaración es propia', async () => {
    await guardar(true);
    expect(repositorio.asegurarPersona).not.toHaveBeenCalled();
  });
});
