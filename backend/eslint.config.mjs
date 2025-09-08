import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  // Base JavaScript and Node.js rules
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: {
      prettier: prettierPlugin,
    },
    extends: [
      js.configs.recommended, // ESLint recommended rules
      eslintConfigPrettier, // Disables ESLint rules that conflict with Prettier
    ],
    languageOptions: {
      globals: {
        ...globals.node, // Node.js globals
      },
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': 'error', // Treat Prettier formatting issues as ESLint errors
    },
  },
  // TypeScript-specific rules
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error'], // Enforce no unused variables
    },
  }
);
