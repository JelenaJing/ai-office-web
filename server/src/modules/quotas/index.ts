/**
 * modules/quotas — Per-user resource quotas
 *
 * Responsibilities:
 *  - Enforce storage quota (bytes) per user / workspace
 *  - Enforce AI token usage quota (tokens/day or tokens/month)
 *  - Return 429 + quota error when limits exceeded
 *  - Admin API to adjust quota tiers
 *
 * See docs/db-schema.md for quota tables.
 *
 * Current state: no quotas enforced.
 * Migration target: files module checks storage quota; ai-gateway checks token quota.
 */

export {}
