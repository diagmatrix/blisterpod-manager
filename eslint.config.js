import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  {
    ignores: [
      'out/**', 'dist/**', 'node_modules/**', '.venv/**', '.opencode/**', '.claude/**',
      'coverage/**', 'test-results/**', 'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'useTheme',
            'buttonVariants',
            'useSidebar',
            'COLOR_ORDER',
            'RARITY_OPTIONS',
            'RARITY_LABELS',
          ],
        },
      ],
    },
  },
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'electron.vite.config.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Test harness and specs: Node built-ins for the main-side helpers, browser
    // globals for the jsdom-side ones, and Vitest's injected globals.
    files: [
      'tests/**/*.{ts,tsx}',
      'e2e/**/*.ts',
      'src/**/*.test.{ts,tsx}',
      'vitest.config.ts',
      'vitest.workspace.ts',
      'playwright.config.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.vitest,
      },
    },
    rules: {
      // The `renderWithProviders` helper exports a wrapper alongside components.
      'react-refresh/only-export-components': 'off',
    },
  },
)
