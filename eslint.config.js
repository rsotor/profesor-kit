'use strict';

// Linter mínimo del repo del kit. No es una dependencia en tiempo de ejecución de los cursos:
// vive solo aquí, y `preparar-curso.js` borra este fichero (y `node_modules/`) al crear un curso.
module.exports = [
  {
    ignores: ['node_modules/**', 'pruebas-local/**', '.claude/worktrees/**', '.claude/skills/**', '.agents/skills/**', '.codex/skills/**', '.gemini/skills/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        AbortSignal: 'readonly',
        fetch: 'readonly',
        structuredClone: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'eqeqeq': 'error',
      'prefer-const': 'error',
      // 160, no las cadenas ni comentarios largos: el estilo del kit es denso a propósito (ver AGENTS.md/CONTRIBUTING.md).
      // ignorePattern cubre los `assert.match(...)` de los tests: son regex literales, no cadenas, y partirlos
      // a mitad de patrón empeora la lectura en vez de mejorarla.
      'max-len': ['error', {
        code: 160, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true, ignoreUrls: true,
        ignorePattern: '^\\s*assert\\.(match|doesNotMatch)\\(',
      }],
    },
  },
];
