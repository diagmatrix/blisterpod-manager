import { defineConfig } from 'vitest/config'

// Project definitions live in vitest.workspace.ts (Vitest 2.x); this file carries
// the options that apply across both of them.
export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/**/*.d.ts',
                // Vendored shadcn/ui primitives -- not our logic to cover.
                'src/renderer/src/components/ui/**',
            ],
        },
    },
})
