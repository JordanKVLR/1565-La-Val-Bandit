import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/dev-dist/**',
      '**/dist-single/**',
      '**/dist-native/**',
      'apps/game/android/**',
      'apps/game/ios/**',
      'apps/desktop/dist/**',
      'apps/game/test-results/**',
      'apps/game/playwright-report/**',
      'apps/game/public/intro/**',
      'docs/trailer/src/malta_geo.js',
      'docs/trailer/build*/**',
      'docs/trailer/footage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The rules engine must stay headless: no DOM, no rendering, no platform code.
    files: ['packages/core/src/**'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['three', 'preact', 'preact/*', '@m1565/game*'] },
      ],
    },
  },
  {
    // The cinematic renderer is plain browser scripts that share globals (no modules), so it
    // can be opened straight from disk and embedded unbundled in the game.
    files: ['docs/trailer/src/**/*.js'],
    languageOptions: { sourceType: 'script' },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
