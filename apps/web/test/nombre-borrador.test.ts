import { describe, expect, it } from 'vitest';

import { nombreArchivoBorrador } from '@/lib/nombre-borrador';

describe('nombre del archivo del borrador', () => {
  it('incluye el titular y el año gravable de la declaración', () => {
    expect(nombreArchivoBorrador({ nombres: 'Juana', apellidos: 'Perez' }, 2025)).toBe(
      'Borrador-210-AG2025-Juana-Perez.pdf',
    );
    expect(nombreArchivoBorrador({ nombres: 'Juana', apellidos: 'Perez' }, 2024)).toBe(
      'Borrador-210-AG2024-Juana-Perez.pdf',
    );
  });

  it('quita tildes y caracteres que estorban al guardar', () => {
    expect(nombreArchivoBorrador({ nombres: 'José Andrés', apellidos: 'Muñoz Peña' }, 2025)).toBe(
      'Borrador-210-AG2025-Jose-Andres-Munoz-Pena.pdf',
    );
    expect(nombreArchivoBorrador({ nombres: 'Ana/María', apellidos: 'Gómez  Díaz' }, 2025)).toBe(
      'Borrador-210-AG2025-Ana-Maria-Gomez-Diaz.pdf',
    );
  });

  it('sin titular deja solo formulario y año', () => {
    expect(nombreArchivoBorrador({ nombres: '', apellidos: '' }, 2025)).toBe('Borrador-210-AG2025.pdf');
  });
});
