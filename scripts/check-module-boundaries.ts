#!/usr/bin/env node
/**
 * scripts/check-module-boundaries.ts
 *
 * Checks that feature modules do not directly import each other's internals.
 *
 * Rules:
 *   VIOLATION: src/features/A/**  imports  src/features/B/**  (cross-feature internal import)
 *   ALLOWED:   src/features/A/**  imports  src/core/**         (contracts)
 *   ALLOWED:   src/features/A/**  imports  src/platform/**     (platform API)
 *   ALLOWED:   src/features/A/**  imports  src/shared/**       (shared utilities)
 *   ALLOWED:   src/bridges/**     imports  src/features/**      (bridges may reference features)
 *   ALLOWED:   src/app/**         imports  src/features/[F]/manifest.ts  (registry reads manifests)
 *   VIOLATION: src/app/**         imports  src/features/[F]/components   (app shell must not bypass manifest)
 *
 * Usage:
 *   npx tsx scripts/check-module-boundaries.ts
 *   npm run check:boundaries
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SRC = path.resolve(__dirname, '../src')

interface Violation {
  file: string
  line: number
  importPath: string
  rule: string
}

function walk(dir: string, ext = '.ts'): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...walk(full, ext))
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      results.push(full)
    }
  }
  return results
}

/** Extract all import/export from paths from a file. Returns [{line, importPath}] */
function extractImports(filePath: string): Array<{ line: number; importPath: string }> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const imports: Array<{ line: number; importPath: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Match: import ... from 'path' or import('path') or export ... from 'path'
    const matches = [
      /(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/,
      /import\s*\(\s*['"]([^'"]+)['"]/,
    ]
    for (const re of matches) {
      const m = re.exec(line)
      if (m) imports.push({ line: i + 1, importPath: m[1] })
    }
  }
  return imports
}

/** Resolve a relative import path to an absolute path relative to SRC. */
function resolveToSrcRelative(fromFile: string, importPath: string): string | null {
  if (!importPath.startsWith('.')) return null // external package
  const resolved = path.resolve(path.dirname(fromFile), importPath)
  return path.relative(SRC, resolved).replace(/\\/g, '/')
}

function getFeature(srcRelPath: string): string | null {
  const m = /^features\/([^/]+)\//.exec(srcRelPath)
  return m ? m[1] : null
}

const violations: Violation[] = []

const featureFiles = walk(path.join(SRC, 'features'))
const appFiles = walk(path.join(SRC, 'app'))

// ── Rule 1: cross-feature internal imports ────────────────────────────────────
for (const file of featureFiles) {
  const fileRelative = path.relative(SRC, file).replace(/\\/g, '/')
  const fileFeature = getFeature(fileRelative)
  if (!fileFeature) continue

  for (const { line, importPath } of extractImports(file)) {
    const resolved = resolveToSrcRelative(file, importPath)
    if (!resolved) continue
    const importFeature = getFeature(resolved)
    if (!importFeature) continue
    if (importFeature === fileFeature) continue // same feature — OK

    // Cross-feature internal import — VIOLATION
    // Allow if the import points to the feature's index.ts or manifest.ts (public API)
    const isPublicApi = resolved.endsWith(`features/${importFeature}/index`) ||
      resolved.endsWith(`features/${importFeature}/index.ts`) ||
      resolved.endsWith(`features/${importFeature}/manifest`) ||
      resolved.endsWith(`features/${importFeature}/manifest.ts`) ||
      resolved === `features/${importFeature}` // bare index

    if (isPublicApi) continue // importing public index/manifest is OK

    violations.push({
      file: fileRelative,
      line,
      importPath,
      rule: `Cross-feature internal import: ${fileFeature} → ${importFeature} (only index.ts or manifest.ts allowed)`,
    })
  }
}

// ── Rule 2: app shell must not import feature internals (only manifest/index) ──
for (const file of appFiles) {
  const fileRelative = path.relative(SRC, file).replace(/\\/g, '/')

  for (const { line, importPath } of extractImports(file)) {
    const resolved = resolveToSrcRelative(file, importPath)
    if (!resolved) continue
    const importFeature = getFeature(resolved)
    if (!importFeature) continue

    const isPublicApi = resolved.endsWith(`features/${importFeature}/index`) ||
      resolved.endsWith(`features/${importFeature}/index.ts`) ||
      resolved.endsWith(`features/${importFeature}/manifest`) ||
      resolved.endsWith(`features/${importFeature}/manifest.ts`) ||
      resolved === `features/${importFeature}`

    if (isPublicApi) continue

    violations.push({
      file: fileRelative,
      line,
      importPath,
      rule: `App shell importing feature internals: ${importFeature} (use manifest.ts or index.ts only)`,
    })
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('✅ Module boundary check passed — no violations found.')
  process.exit(0)
} else {
  console.error(`\n❌ Module boundary violations found: ${violations.length}\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`)
    console.error(`    import '${v.importPath}'`)
    console.error(`    Rule: ${v.rule}`)
    console.error()
  }
  process.exit(1)
}
