module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base', 'plugin:prettier/recommended'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'no-extra-semi': 0,
    'prettier/prettier': [
      'warn',
      { semi: false, singleQuote: true, trailingComma: 'es5' },
    ],
  },
};
