#!/usr/bin/env node
/**
 * Full production build, leaving the repo ready to keep developing.
 *
 * Usage:
 *   npm run release                 build + package, end on Electron ABI (dev-ready)
 *   npm run release -- --abi=node   ...end on Node ABI instead (test-ready)
 *   npm run release -- --check      run lint + tsc + tests first
 *   npm run release -- --skip-package   build only, no installer
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const DIST_DIR = join(REPO_ROOT, 'dist')

const args = process.argv.slice(2)
const abiArg = args.find((a) => a.startsWith('--abi='))?.split('=')[1] ?? 'electron'
const runChecks = args.includes('--check')
const skipPackage = args.includes('--skip-package')

if (!['electron', 'node'].includes(abiArg)) {
    fail(`--abi must be 'electron' or 'node', got '${abiArg}'`)
}

/**
 * ELECTRON_RUN_AS_NODE makes electron.exe behave as a bare Node binary. Some
 * tool shells export it, and it breaks electron-rebuild and anything that
 * launches Electron -- with errors that point nowhere near the cause.
 */
function childEnv() {
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE
    return env
}

function fail(message) {
    console.error(`\n  ERROR  ${message}\n`)
    process.exit(1)
}

let stepNumber = 0
function step(label, command) {
    stepNumber += 1
    console.log(`\n[${stepNumber}] ${label}`)
    console.log(`    > ${command}\n`)

    const result = spawnSync(command, {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        shell: true,
        env: childEnv(),
    })

    if (result.error) fail(`${label} could not start: ${result.error.message}`)
    if (result.status !== 0) fail(`${label} failed (exit ${result.status}). Nothing was left half-installed, but the ABI may not have been restored -- rerun, or fix it by hand with 'npm run package:post'.`)
}

/** Installers produced by this run, newest first. */
function recentArtifacts(since) {
    if (!existsSync(DIST_DIR)) return []
    return readdirSync(DIST_DIR)
        .filter((name) => name.endsWith('.exe'))
        .map((name) => ({ name, mtime: statSync(join(DIST_DIR, name)).mtimeMs }))
        .filter((f) => f.mtime >= since)
        .sort((a, b) => b.mtime - a.mtime)
}

const startedAt = Date.now()

console.log('Blisterpod Manager - production build')
console.log(`  package    ${skipPackage ? 'no (--skip-package)' : 'yes'}`)
console.log(`  pre-checks ${runChecks ? 'yes' : 'no (pass --check to enable)'}`)
console.log(`  final ABI  ${abiArg}`)

if (runChecks) {
    step('Lint', 'npm run lint')
    step('Type-check all TS projects', 'npx tsc -b')
    // Vitest runs under plain Node, so the native module has to match first.
    step('Rebuild better-sqlite3 for Node (required by Vitest)', 'npm run rebuild:node')
    step('Unit and integration tests', 'npm test')
    // Note: test:e2e rebuilds for the Electron ABI as part of its own setup,
    // so it has to come after the Node-ABI unit run above, not before.
    step('End to end tests', 'npm run test:e2e')
}

step('Build main, preload and renderer bundles', 'npm run build')

if (!skipPackage) {
    // electron-builder rebuilds native deps itself, but @electron/rebuild skips any
    // module whose build/Release/.forge-meta already names the target ABI -- and a
    // plain `npm rebuild` replaces the binary without updating that marker. Forcing
    // the Electron build here is what keeps a Node-ABI better_sqlite3.node out of
    // the installer.
    step('Rebuild better-sqlite3 for the Electron ABI (packaging input)', 'npm run package:post')
    step('Package installers with electron-builder', 'npx electron-builder')
}

if (abiArg === 'electron') {
    step('Restore better-sqlite3 to the Electron ABI', 'npm run package:post')
} else {
    step('Restore better-sqlite3 to the Node ABI', 'npm run rebuild:node')
}

const artifacts = recentArtifacts(startedAt)
const elapsed = Math.round((Date.now() - startedAt) / 1000)

console.log(`\nDone in ${elapsed}s.`)

if (artifacts.length > 0) {
    console.log('\nInstallers written to dist/:')
    for (const { name } of artifacts) console.log(`  ${name}`)
} else if (!skipPackage) {
    console.log('\nNo new .exe appeared in dist/ -- check the electron-builder output above.')
}

console.log('\nbetter-sqlite3 is now built for the ' + abiArg.toUpperCase() + ' ABI, so:')
if (abiArg === 'electron') {
    console.log('  works now:  npm run dev, npm run test:e2e, the packaged app')
    console.log('  needs swap: npm test  ->  run "npm run rebuild:node" first')
} else {
    console.log('  works now:  npm test')
    console.log('  needs swap: npm run dev  ->  run "npm run package:post" first')
}
