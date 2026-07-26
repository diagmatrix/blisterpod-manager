import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { mockWindowApi } from './window-api'

// jsdom implements neither of these, and the sidebar/mobile hooks and the
// virtualised card grid both reach for them on mount.
beforeEach(() => {
    window.matchMedia ??= ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    // jsdom ships `FileReader` but not `Blob.text()`, which is how the import
    // component reads a picked CSV.
    Blob.prototype.text ??= function (this: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsText(this)
        })
    }

    // Every test starts from a fully stubbed bridge; individual tests override
    // the calls they care about with their own `mockWindowApi({ ... })`.
    mockWindowApi()
})

afterEach(() => {
    cleanup()
})
