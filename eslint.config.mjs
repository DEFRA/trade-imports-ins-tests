import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@page-objects', message: 'The page-objects barrel pulls in every domain; import from @page-objects/shared instead.' },
          ],
          patterns: [
            {
              regex: '^@(page-objects|flows|domain)/(?!shared/)',
              message: 'Shared code must not depend on a domain; import from a shared folder only.',
            },
            {
              regex: '^\\.\\./(animals|animals-admin|ins|plants)(/|$)',
              message: 'Shared code must not depend on a domain; import from a shared folder only.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'seeds',
      'test-results',
      'playwright-report',
      'allure-results',
      'allure-report',
      'zap-report',
      '*.mjs',
    ],
  },
);
