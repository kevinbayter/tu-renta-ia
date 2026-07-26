import { readFile } from 'node:fs/promises';

// Cargar variables sin dotenv
const env = await readFile('../../.env.local', 'utf8');
env
  .split('\n')
  .filter((l) => l.includes('=') && !l.startsWith('#'))
  .forEach((l) => {
    const i = l.indexOf('=');
    process.env[l.slice(0, i).trim()] = l
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  });

const { extraerTextoPdf } = await import('./src/extraccion/pdf/extraer-texto.ts');
const { crearLlmDesdeEnv } = await import('./src/index.ts');
const { jsonSchemas } = await import('@turenta/shared');

const { texto } = await extraerTextoPdf(new Uint8Array(await readFile(process.argv[2])));
const llm = crearLlmDesdeEnv(process.env);
console.log('caracteres del PDF:', texto.length);

const instruccion = `Documento: formulario 210 DIAN YA PRESENTADO de un año gravable anterior.
Extrae SOLO estas casillas: anioGravable (encabezado "Año"), patrimonioLiquido (31),
impuestoNetoRenta (126), anticipoAnioSiguiente (133), totalSaldoAFavor (137). Si está vacía, 0.`;

for (const esfuerzo of ['high', 'medium', 'low']) {
  const t0 = Date.now();
  try {
    const r = await llm.extraerEstructurado({
      system: instruccion,
      user: texto.slice(0, 30000),
      jsonSchema: jsonSchemas.declaracionAnterior,
      esfuerzo,
    });
    const seg = ((Date.now() - t0) / 1000).toFixed(1);
    const oculto = (v) => String(v).replace(/\d/g, 'X');
    console.log(
      `${esfuerzo.padEnd(7)} -> ${seg}s | año=${r.anioGravable} patrimonio=${oculto(r.patrimonioLiquido)} anticipo=${oculto(r.anticipoAnioSiguiente)}`,
    );
  } catch (e) {
    console.log(`${esfuerzo.padEnd(7)} -> ERROR: ${String(e.message).slice(0, 100)}`);
  }
}
