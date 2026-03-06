import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist/**',
      '.agent/**',
      '.agent-backup-**',
      'code/**',
      'docs/**',
      'scripts/**',
      'tests/**',
      'public/app/**',
      'node_modules/**',
      'hube-crm-react/**',
      '**/*.rules.test.js',
      '**/*.old.jsx',
      '**/*.old.js'
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
]
