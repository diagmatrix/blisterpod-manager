import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineWorkspace } from 'vitest/config'

// The `@` alias is target-specific in electron.vite.config.ts (src for main,
// src/renderer/src for renderer). The two projects below must mirror that split,
// otherwise imports silently resolve to the wrong file.
export default defineWorkspace([
    {
        test: {
            name: 'main',
            environment: 'node',
            include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
            globals: true,
            restoreMocks: true,
            clearMocks: true,
        },
        resolve: {
            alias: {
                // Order matters: the more specific specifier has to come first.
                'electron-log/main.js': resolve(__dirname, 'tests/main/electron-log-stub.ts'),
                electron: resolve(__dirname, 'tests/main/electron-stub.ts'),
                '@': resolve(__dirname, 'src'),
            },
        },
    },
    {
        plugins: [react()],
        test: {
            name: 'renderer',
            environment: 'jsdom',
            include: ['src/renderer/**/*.test.{ts,tsx}'],
            setupFiles: [resolve(__dirname, 'tests/renderer/jsdom-setup.ts')],
            globals: true,
            restoreMocks: true,
            clearMocks: true,
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src/renderer/src'),
            },
        },
    },
])
