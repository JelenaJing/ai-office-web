/**
 * modules/ai-gateway — Upstream AI model integration
 *
 * Responsibilities:
 *  - Abstract over multiple AI providers (OpenAI-compat, MiniMax, Tongyi, etc.)
 *  - Enforce per-user token quotas via quotas module
 *  - Cache identical AI invocations (prompt hash → response) via Redis
 *  - Retry transient errors with exponential backoff
 *  - Emit usage metrics for audit module
 *
 * See docs/ai-cache.md for caching design.
 * See docs/skill-jobs.md for async job design.
 *
 * Current state: skills call AI providers directly (no gateway layer yet).
 * Migration target: all LLM calls go through this module.
 */

export {}
