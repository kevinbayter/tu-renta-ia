import { describe, expect, it } from 'vitest';

import { anioEnTextos } from '../../src/dian/anio-de-fila';

/** Made-up form numbers: 13 digits, like DIAN's. */
const FILA_2024 = '1111111111111 2024 / anual Inicial 04/09/2025';
const FILA_2023 = '2222222222222 2023 / anual Inicial 29/08/2024';

describe('año de la fila de declaraciones presentadas', () => {
  it('lee el año de la fila', () => {
    expect(anioEnTextos([FILA_2024])).toBe('2024');
  });

  it('gana la fila más cercana, no la tabla completa', () => {
    // Texts run nearest-ancestor first. The whole table matches both patterns
    // too: if it won, every row would report the same year.
    const tablaCompleta = `No. formulario Año / frecuencia ${FILA_2023} ${FILA_2024}`;
    expect(anioEnTextos([FILA_2024, tablaCompleta])).toBe('2024');
  });

  it('ignora ancestros que no son una fila', () => {
    // A lone cell has the year but no form number.
    expect(anioEnTextos(['2024 / anual', FILA_2024])).toBe('2024');
  });

  it('devuelve null cuando ningún ancestro es una fila', () => {
    expect(anioEnTextos([])).toBeNull();
    expect(anioEnTextos(['Acciones', 'Descargar'])).toBeNull();
  });

  it('exige el formato "año / anual": un año suelto no basta', () => {
    // Avoids mistaking a filing date (04/09/2025) for the tax year.
    expect(anioEnTextos(['1111111111111 Inicial 04/09/2025'])).toBeNull();
  });
});
