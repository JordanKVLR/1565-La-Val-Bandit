import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Selectors for user-facing text written straight into JSX: text children, string children
 * (`{'Text'}`, `{ok ? 'Yes' : 'No'}`, template literals) and the attributes people read. A string
 * counts as text when it has a Latin letter, so glyphs (×, ▲, ◆, ·, ☰, Ⓐ) and numbers pass.
 * Strings passed to a call, such as `t('common.menu')`, are never matched.
 */
function hardCodedUiText() {
  const word = '/[A-Za-z]/';
  const attrs =
    'aria-label|aria-description|aria-valuetext|aria-roledescription|title|placeholder|alt|label';
  const message = 'Hard-coded UI text: put it in apps/game/src/i18n/en.ts and use t() (ADR 0012).';
  const attr = `JSXAttribute[name.name=/^(${attrs})$/]`;
  const holders = [
    `${attr} > Literal`,
    `${attr} > JSXExpressionContainer > Literal`,
    `${attr} > JSXExpressionContainer > ConditionalExpression > Literal.consequent`,
    `${attr} > JSXExpressionContainer > ConditionalExpression > Literal.alternate`,
    `${attr} > JSXExpressionContainer > LogicalExpression > Literal.right`,
    'JSXElement > JSXExpressionContainer > Literal',
    'JSXFragment > JSXExpressionContainer > Literal',
    'JSXElement > JSXExpressionContainer > ConditionalExpression > Literal.consequent',
    'JSXElement > JSXExpressionContainer > ConditionalExpression > Literal.alternate',
    'JSXElement > JSXExpressionContainer > LogicalExpression > Literal.right',
  ].map((s) => ({ selector: `${s}[value=${word}]`, message }));
  const templates = [
    `${attr} > JSXExpressionContainer > TemplateLiteral`,
    'JSXElement > JSXExpressionContainer > TemplateLiteral',
    'JSXFragment > JSXExpressionContainer > TemplateLiteral',
  ].map((s) => ({ selector: `${s} > TemplateElement[value.raw=${word}]`, message }));
  return [{ selector: `JSXText[value=${word}]`, message }, ...holders, ...templates];
}

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
    // UI strings go through the string table (ADR 0012, docs/I18N.md): no words written straight
    // into JSX text or into the attributes people read. Glyphs and numbers are fine.
    files: ['apps/game/src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...hardCodedUiText()],
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
