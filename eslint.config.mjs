// @ts-check

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';

const tseslintConfigs = {
  recommended: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: {
        '@typescript-eslint': tseslint
      },
      rules: {
        ...tseslint.configs.recommended.rules,
      }
    }
  ]
};

export default [
  {
    // Define global ignores so ESLint doesn't spend time on node_modules or other directories
    ignores: ['**/node_modules/**', '**/dist/**', '**/.git/**', 'backup/**']
  },
  js.configs.recommended,
  ...tseslintConfigs.recommended,
  {
    // Configure TypeScript-specific parsing
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        // Node.js globals
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      },
    },
    // Define our specific rules
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error'
    },
    // Apply these rules to TypeScript files
    files: ['**/*.ts']
  }
];