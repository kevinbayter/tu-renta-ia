export default {
  'packages/*/{src,test}/**/*.ts': ['eslint --max-warnings 0 --no-warn-ignored'],
  'apps/web/{app,components,server,lib}/**/*.{ts,tsx}': [
    'pnpm --filter web exec eslint --max-warnings 0 --no-warn-ignored',
  ],
  '**/*.{json,md,mjs}': ['prettier --write'],
};
