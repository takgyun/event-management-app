const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'dist/**/*',
      '.git/**/*',
      'coverage/**/*',
      'out/**/*',
      'build/**/*',
      '.vscode/**/*',
      '.idea/**/*',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@next/next/no-html-link-for-pages': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['eslint.config.js', 'tailwind.config.ts', 'next.config.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
