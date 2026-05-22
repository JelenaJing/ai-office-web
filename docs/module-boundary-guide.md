# Module Boundary Guide

> This guide defines what each feature module may and may not import,
> how the bridge pattern works, and the document→PPT handoff flow.

---

## 1. Directory Roles

| Path | Role | May import |
|------|------|-----------|
| `src/core/contracts/` | Shared type contracts | Nothing in `src/` |
| `src/features/<F>/` | Office capability module | `src/core/`, `src/platform/`, `src/shared/`, `src/components/` |
| `src/bridges/<B>/` | Cross-feature data conversion | `src/core/contracts/` only (no feature internals) |
| `src/app/` | App shell / registry | `src/features/*/manifest.ts`, `src/features/*/index.ts`, `src/core/` |
| `src/pages/` | Route-level pages / workspace shells | `src/features/*/index.ts`, `src/core/` |

---

## 2. Feature Module Rules

### ✅ Allowed

```
src/features/document/ imports:
  ✅ src/core/contracts/*
  ✅ src/platform/*
  ✅ src/shared/*
  ✅ src/components/*          (shared UI only, not other feature components)
  ✅ src/features/document/*   (within same feature — free)
```

### ❌ Not allowed

```
src/features/document/ must NOT import:
  ❌ src/features/ppt/components/*
  ❌ src/features/ppt/services/*
  ❌ src/features/email/components/*
  ❌ any other src/features/<other>/<internal>/*

src/features/ppt/ must NOT import:
  ❌ src/features/document/components/*
  ❌ src/features/document/services/*
```

### 🔓 Cross-feature public API only

A feature may import another feature's **public API** (index.ts / manifest.ts):

```
src/features/aios/ imports:
  ✅ src/features/document/index.ts  (types, not components)
```

But this is discouraged unless strictly necessary. Prefer bridge pattern.

---

## 3. Bridge Pattern

When two features need to communicate (e.g., document → PPT), use a bridge:

```
src/bridges/document-to-ppt/
  types.ts                      — bridge-specific input/output types
  convertDocumentToDeckInput.ts — conversion logic
  index.ts                      — public API
```

**Bridge rules:**
- A bridge may import from `src/core/contracts/` (types only)
- A bridge may NOT import feature components or feature services
- A bridge contains pure transformation logic (no UI, no side effects)
- The calling code (app shell / AIOS workflow) imports from the bridge

---

## 4. Document → PPT Flow

```
User clicks "Generate PPT from document"
  │
  ├─ [document module] exports DocumentOutline via public API
  │    └─ src/features/document/index.ts → DocumentOutline type
  │
  ├─ [bridge] converts outline to DeckGenerationInput
  │    └─ src/bridges/document-to-ppt/convertDocumentToDeckInput.ts
  │
  └─ [ppt module] receives DeckGenerationInput via public service
       └─ src/features/ppt/services/pptWebGeneration.ts → runWebPptxCreate()
```

**Types involved:**

| Type | Location | Direction |
|------|----------|-----------|
| `DocumentOutline` | `src/core/contracts/document.ts` | document → bridge |
| `DeckGenerationInput` | `src/core/contracts/ppt.ts` | bridge → ppt |
| `DocumentArtifact` | `src/core/contracts/document.ts` | document output |
| `DeckDocument` | `src/core/contracts/ppt.ts` | ppt output |

---

## 5. core/contracts Rules

`src/core/contracts/` contains **pure TypeScript types only** — no runtime code.

```
src/core/contracts/artifact.ts   — ArtifactRef, ArtifactRecord
src/core/contracts/document.ts   — DocumentOutline, DocumentArtifact
src/core/contracts/ppt.ts        — DeckGenerationInput, DeckDocument
src/core/contracts/feature.ts    — FeatureManifest (for registry)
src/core/contracts/index.ts      — re-exports all
```

Rules:
- ✅ Feature modules import types from `src/core/contracts/`
- ✅ Bridges import types from `src/core/contracts/`
- ❌ `src/core/contracts/` must not import from `src/features/`
- ❌ `src/core/contracts/` must not import from `src/platform/`

---

## 6. featureRegistry Rules

`src/app/featureRegistry.ts` imports only feature `manifest.ts` files.

```ts
// ✅ Correct
import { documentManifest } from '../features/document/manifest'

// ❌ Wrong
import { EditorPanel } from '../features/document/components/EditorPanel'
```

The manifest files themselves must only import `src/core/contracts/feature.ts`.
Manifests declare lazy page factories (dynamic imports) — they do not execute feature code at import time.

---

## 7. Boundary Enforcement

Run the boundary checker:

```bash
npm run check:boundaries
```

This checks:
1. No cross-feature internal imports between `src/features/*`
2. `src/app/` does not import feature internals (only manifest/index)

The checker allows:
- `src/bridges/*` to import `src/core/contracts/` (types only)
- `src/features/*` to import another feature's `index.ts` or `manifest.ts`
- `src/pages/*` to import feature public APIs

---

## 8. Quick Decision Guide

**"Should I add this import?"**

| Situation | Answer |
|-----------|--------|
| document needs to call ppt skill | Use `src/bridges/document-to-ppt/` bridge |
| ppt needs document types | Add type to `src/core/contracts/document.ts` |
| aios needs email types | Add shared type to `src/core/contracts/` or use email `index.ts` |
| app shell needs to render feature | Import feature `index.ts` (component) via lazy import |
| new cross-feature workflow | Create new bridge in `src/bridges/<name>/` |
