export default {
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module'
  },
  rules: {
    // 'no-tabs': ['error', { allowIndentationTabs: true }],
    // 'arrow-body-style': ['error', 'as-needed'],
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'prefer-template': 'error'
    // 'template-curly-spacing': ['error', 'always'],
    // 'arrow-parens': ['error', 'as-needed'],
    // 'no-return-assign': ['error', 'always'],
    // 'no-use-before-define': ['error', { functions: true, classes: true }],
    // camelcase: 'off'
  }
}
