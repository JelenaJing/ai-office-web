# Legacy scripts removed from main package scripts

These scripts were removed from `package.json` because they only served the old OOXML, canonical document, document-schema, manuscript, or old PPTX/DeckDocument smoke chains. They are retained here as a historical reference only; they are not part of the Web MVP validation surface.

| Script | Legacy area | Former target |
| --- | --- | --- |
| `smoke:ooxml` | OOXML / old Document Engine | `build/run-ooxml-roundtrip-smoke.ts`, `electron/main/services/documentEngineService.ts` |
| `smoke:ooxml-snapshot` | OOXML / old Document Engine | `build/run-ooxml-snapshot-completeness-smoke.ts`, `electron/main/services/generatedOoxmlSnapshot.ts`, `src/engines/documentEngine/**` |
| `smoke:paper-stream` | OOXML / old Document Engine | `build/run-paper-streaming-smoke.ts`, `src/engines/documentEngine/**` |
| `smoke:knowledge-pptx-flow` | old PPTX renderer | `build/run-knowledge-pptx-flow-smoke.ts` |
| `smoke:canonical-document-contract` | Canonical Document | `build/run-canonical-document-contract-smoke.ts` |
| `smoke:canonical-page-spec-contract` | Canonical Document | `build/run-canonical-page-spec-contract-smoke.ts` |
| `smoke:canonical-projection-adapter` | Canonical Document | `build/run-canonical-projection-adapter-smoke.ts` |
| `smoke:canonical-pagination` | Canonical Document | `build/run-canonical-pagination-smoke.ts` |
| `smoke:canonical-selection-bridge` | Canonical Document | `build/run-canonical-selection-bridge-smoke.ts` |
| `smoke:canonical-document-editor` | Canonical Document | `build/run-canonical-document-editor-smoke.ts` |
| `smoke:manuscript-editable-a4` | Canonical Document / old smoke only | `build/run-manuscript-editable-a4-smoke.ts` |
| `smoke:manuscript-sidebar-scroll` | Canonical Document / old smoke only | `build/run-manuscript-sidebar-scroll-smoke.ts` |
| `smoke:citation-fields` | OOXML / old Document Engine | `build/run-citation-field-smoke.ts`, `electron/main/services/documentEngineService.ts` |
| `smoke:document-json` | Canonical Document / document-schema | `build/run-document-json-schema-smoke.ts` |
| `smoke:document-json-edit` | Canonical Document / document-schema | `build/run-document-json-edit-smoke.ts` |
| `smoke:document-schema-patch-runtime` | Canonical Document / document-schema | `build/run-document-schema-patch-runtime-smoke.ts` |
| `smoke:manuscript-tab-factory` | Canonical Document / old smoke only | `build/run-manuscript-tab-factory-smoke.ts` |
| `smoke:manuscript-tab-state` | Canonical Document / old smoke only | `build/run-manuscript-tab-state-smoke.ts` |
| `smoke:manuscript-projection-api` | Canonical Document / old smoke only | `build/run-manuscript-projection-api-smoke.ts` |
| `smoke:document-schema-docx-export` | OOXML / document-schema DOCX | `build/run-document-schema-docx-export-smoke.ts` |
| `smoke:document-schema-docx-template` | OOXML / document-schema DOCX | `build/run-document-schema-docx-template-base-replace-smoke.ts` |
| `smoke:document-schema-docx-import` | OOXML / document-schema DOCX | `build/run-document-schema-docx-import-smoke.ts` |
| `smoke:document-schema-docx-roundtrip` | OOXML / document-schema DOCX | `build/run-document-schema-docx-roundtrip-smoke.ts` |
| `smoke:document-schema-docx-section-shell` | OOXML / document-schema DOCX | `build/run-document-schema-docx-section-shell-roundtrip-smoke.ts` |
| `smoke:document-schema-docx-titlepg` | OOXML / document-schema DOCX | `build/run-document-schema-docx-titlepg-page-number-smoke.ts` |
| `smoke:document-schema-docx-overlay-contract` | OOXML / document-schema DOCX | `build/run-document-schema-docx-overlay-template-contract-smoke.ts` |
| `smoke:manuscript-executor-contract` | Canonical Document / old smoke only | `build/run-manuscript-executor-contract-smoke.ts` |
| `smoke:manuscript-single-frontend` | Canonical Document / old smoke only | `build/run-manuscript-single-frontend-smoke.ts` |
| `smoke:manuscript-selection-anchor` | Canonical Document / old smoke only | `build/run-manuscript-selection-anchor-smoke.ts` |
| `smoke:template-document-rewrite` | old Document Engine / old smoke only | `build/run-template-document-rewrite-commit-smoke.ts` |
| `smoke:word-bibliography` | OOXML / old smoke only | `build/run-word-bibliography-smoke.ts` |
| `smoke:document-preview-ppt-bridge` | old PPTX renderer | `build/run-document-preview-ppt-bridge-smoke.ts`, `electron/main/services/pptxGenerator.ts` |
| `smoke:paper-normalizer` | old smoke only | `build/run-paper-normalizer-smoke.ts` |
| `smoke:paper-export` | old smoke only | `build/run-paper-export-smoke.ts` |
| `smoke:ppt-ui` | old PPTX renderer / DeckDocument | `build/run-ppt-generation-ui-smoke.ts`, `electron/main/services/pptxGenerator.ts` |

Current retained surfaces include the Web/dev/build scripts, `check:server`, `e2e:web`, email smoke scripts, and the current HTML PPT artifact-jobs route/page chain.

