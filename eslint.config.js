import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import stylistic from '@stylistic/eslint-plugin'

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
        // 4 spaces is the majority style. `ui/` is excluded because those components are
        // emitted by the shadcn CLI at 2 spaces and get overwritten by `npx shadcn add`.
        files: ['**/*.{ts,tsx,js,mjs}'],
        ignores: ['src/renderer/src/components/ui/**'],
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/no-trailing-spaces': 'error',
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
