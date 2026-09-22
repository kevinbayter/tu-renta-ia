import { describe, expect, it } from 'vitest';

import { formatearHuella } from '../../src/dian/huella-pantalla';

const BASE = { paginas: 1, url: 'https://muisca.dian.gov.co/WebDilIngresoFormRenta210/#/ingreso?x=1', dialogos: 0 };

describe('huella de pantalla para diagnosticar un paso fallido', () => {
  it('resume pestañas, ruta sin parámetros, diálogos y controles visibles', () => {
    const huella = formatearHuella({ ...BASE, dialogos: 1, etiquetas: ['Borradores', 'Presentadas', 'Cerrar'] });
    expect(huella).toBe(
      'pestanas=1 ruta=/WebDilIngresoFormRenta210/#/ingreso dialogos=1 controles=Borradores|Presentadas|Cerrar',
    );
  });

  it('nunca deja dígitos ni nombres de personas en la auditoría', () => {
    const huella = formatearHuella({
      ...BASE,
      etiquetas: ['JUANA PEREZ GOMEZ', 'Formulario 1234567890123', 'Saldo $1.401.000'],
    });
    expect(huella.split('controles=')[1]).not.toMatch(/\d/);
    expect(huella).not.toContain('JUANA');
    expect(huella).toContain('Formulario #############');
  });

  it('no repite controles y se queda en diez', () => {
    const etiquetas = [...Array.from({ length: 30 }, (_, i) => `Opción ${'x'.repeat(i)}`), 'Inicio', 'Inicio'];
    const controles = formatearHuella({ ...BASE, etiquetas }).split('controles=')[1] ?? '';
    expect(controles.split('|')).toHaveLength(10);
  });
});
