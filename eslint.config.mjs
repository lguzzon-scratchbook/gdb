export default [
  {
    languageOptions: {
      ecmaVersion: 11,
      sourceType: 'module',
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        browser: true,
        node: true,
        es6: true
      }
    },
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'prefer-template': 'error'
    }
  }
];
