import { fileURLToPath } from 'node:url';
import path from 'node:path';
import tsParser from '@typescript-eslint/parser';
import finalPluginImport from 'eslint-plugin-final';

const dir = path.dirname(fileURLToPath(import.meta.url));
const finalPlugin = finalPluginImport.default ?? finalPluginImport;

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: dir
      }
    },
    plugins: {
      final: finalPlugin
    },
    rules: {
      ...finalPlugin.configs.recommended.rules
    }
  }
];
