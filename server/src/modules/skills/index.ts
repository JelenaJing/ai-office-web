/**
 * modules/skills — AI skill registry and execution
 *
 * Responsibilities:
 *  - Register named skills (e.g. web.docx.create)
 *  - Validate skill inputs before execution
 *  - Route skill runs to the appropriate handler (local or AI Gateway)
 *  - Return artifact references on success
 *  - Future: persist skill invocations for audit + quota tracking
 *
 * Current implementation: see routes/skills.ts + skills/docx/createDocxSkill.ts
 * Migration target: this module replaces routes/skills.ts once job queue is wired.
 */

export {}
