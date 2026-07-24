// Reglas estrictas del proyecto (adaptadas de un proyecto interno).
// Cubre packages/*. apps/web tiene su propia config (Next) que extiende estas reglas base.
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

const reglasBase = {
  // Archivos
  'eol-last': ['error', 'always'],
  'max-lines': ['error', { max: 400, skipBlankLines: false, skipComments: false }],
  'no-tabs': 'error',

  // Imports
  'import/no-duplicates': 'error',
  'import/no-namespace': 'error',
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
      pathGroups: [{ pattern: '@turenta/**', group: 'internal', position: 'after' }],
      pathGroupsExcludedImportTypes: ['builtin'],
      warnOnUnassignedImports: true,
    },
  ],

  // Estilo
  'comma-spacing': ['error', { before: false, after: true }],
  'semi-spacing': ['error', { before: false, after: true }],
  'no-empty': ['error', { allowEmptyCatch: false }],
  curly: ['error', 'all'],
  'brace-style': ['error', '1tbs', { allowSingleLine: true }],
  'no-lone-blocks': 'error',

  // Anidamiento (CRÍTICO): sin estructuras de control anidadas — guard clauses
  'max-depth': ['error', { max: 1 }],

  // Funciones
  'max-lines-per-function': ['error', { max: 25, skipBlankLines: true, skipComments: false }],

  // Strings y complejidad
  'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
  'sonarjs/cognitive-complexity': ['error', 10],

  // Logging
  'no-console': ['error', { allow: ['assert'] }],

  // TypeScript
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'error',

  // Sintaxis restringida
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ImportDeclaration:not([importKind="type"]) > ImportNamespaceSpecifier',
      message: 'Sin namespace imports. Usa imports nombrados explícitos.',
    },
    {
      selector: 'IfStatement[alternate.type="IfStatement"]',
      message: 'Sin cadenas else-if. Usa guard clauses, switch o extrae a función.',
    },
    {
      selector: 'CatchClause > BlockStatement[body.length=0]',
      message: 'Catch vacío prohibido.',
    },
  ],
};

// Arquitectura hexagonal: dependencias solo hacia adentro.
const capaMotorFiscal = {
  files: ['packages/motor-fiscal/src/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@turenta/*',
              'zod',
              'ai',
              'next',
              'next/*',
              'react',
              '@prisma/*',
              'exceljs',
              'pdf-parse',
            ],
            message: 'motor-fiscal es dominio PURO: cero dependencias externas.',
          },
        ],
      },
    ],
  },
};

const capaCore = {
  files: ['packages/core/src/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@turenta/adaptadores',
              'next',
              'next/*',
              'react',
              '@prisma/*',
              'ai',
              'exceljs',
              'pdf-parse',
            ],
            message: 'core (aplicación) no puede importar adaptadores ni frameworks.',
          },
        ],
      },
    ],
  },
};

// Adaptadores que interactúan con librerías externas poco tipadas (patrón un proyecto interno).
const capaInfraestructura = {
  files: ['packages/adaptadores/src/**/*.ts'],
  rules: {
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
  },
};

const archivosTest = {
  files: ['packages/**/test/**/*.ts', 'packages/**/*.test.ts'],
  rules: {
    'max-lines-per-function': 'off',
    'max-lines': 'off',
    'max-depth': 'off',
    'no-console': 'off',
    'sonarjs/no-duplicate-string': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.next/',
      '**/.turbo/',
      '**/coverage/',
      'apps/**',
      'scripts/**',
      '**/*.config.{js,mjs,cjs,ts}',
      'eslint.config.mjs',
    ],
  },
  {
    files: ['packages/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin, sonarjs },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: reglasBase,
  },
  capaMotorFiscal,
  capaCore,
  capaInfraestructura,
  archivosTest,
);
