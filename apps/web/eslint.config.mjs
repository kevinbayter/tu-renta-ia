import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Reglas estrictas del proyecto adaptadas a React (base: un proyecto interno).
 * Nota: en React el JSX vive dentro de la función del componente (a diferencia
 * de Angular, donde el template es un archivo aparte), por eso el límite de
 * líneas por función es mayor en .tsx (80) manteniendo 25 para lógica pura .ts.
 */
const reglasEstrictas = {
  files: ['**/*.{ts,tsx}'],
  rules: {
    'eol-last': ['error', 'always'],
    'max-lines': ['error', { max: 400, skipBlankLines: false, skipComments: false }],
    'no-tabs': 'error',
    'max-depth': ['error', { max: 1 }],
    // max-depth reinicia dentro de cada función: estas cierran el hueco de un
    // if escondido en un callback anidado.
    'max-nested-callbacks': ['error', { max: 2 }],
    'no-nested-ternary': 'error',
    'no-console': ['error', { allow: ['assert', 'error'] }],
    curly: ['error', 'all'],
    'no-empty': ['error', { allowEmptyCatch: false }],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'IfStatement[alternate.type="IfStatement"]',
        message: 'Sin cadenas else-if. Usa guard clauses, switch o extrae a función.',
      },
    ],
    // Arquitectura: los componentes no tocan adaptadores; eso vive en server/ y API routes.
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@turenta/adaptadores'],
            message: 'Solo server/ y app/api pueden importar adaptadores.',
          },
        ],
      },
    ],
  },
};

const logicaPura = {
  files: ['lib/**/*.ts', 'server/**/*.ts'],
  rules: {
    'max-lines-per-function': ['error', { max: 25, skipBlankLines: true, skipComments: false }],
  },
};

const componentes = {
  files: ['**/*.tsx'],
  rules: {
    'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: false }],
  },
};

const capaServidor = {
  files: ['server/**/*.ts', 'app/api/**/*.ts'],
  rules: {
    'no-restricted-imports': 'off',
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  reglasEstrictas,
  logicaPura,
  componentes,
  capaServidor,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'next.config.ts']),
]);

export default eslintConfig;
