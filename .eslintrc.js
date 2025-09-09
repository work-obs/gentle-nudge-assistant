module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: [
    '@typescript-eslint'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true,
    es2020: true,
    jest: true
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    
    // General rules
    'no-console': 'off',
    'no-debugger': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    'no-misleading-character-class': 'off'
  },
  ignorePatterns: [
    'dist/',
    'cache/',
    'logs/',
    'node_modules/',
    'webpack.config.js',
    '*.config.js'
  ]
};