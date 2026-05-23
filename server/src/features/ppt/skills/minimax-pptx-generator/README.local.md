# Vendored MiniMax PPTX Generator Skill Spec

This directory vendors the upstream MiniMax-AI `pptx-generator` skill specification for offline use inside `ai-office-web`.

## Source

- Upstream repository: <https://github.com/MiniMax-AI/skills>
- Skill path: <https://github.com/MiniMax-AI/skills/tree/main/skills/pptx-generator>

## Vendored Files

- `SKILL.md`
- `references/*.md`

These vendored upstream documents are kept verbatim so the local runner can read the official skill contract even in offline environments.

## Local Notes

- This directory is used only as a local skill-spec/input bundle.
- Runtime implementation lives in:
  - `server/src/features/ppt/services/minimaxPptxGeneratorRunner.ts`
  - `server/src/features/ppt/skills/createMinimaxPptxGeneratorSkill.ts`
- Do not edit upstream vendored docs unless intentionally re-vendoring from the MiniMax source repository.
