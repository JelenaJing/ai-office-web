# AI Invocation Cache Design (Redis)

## Problem

Identical AI requests (same skill + same prompt) are sent repeatedly, wasting:
- LLM API tokens (cost)
- Latency (1–10 s per request)

A content-addressable cache keyed on `sha256(skillId + normalizedPrompt)` can
serve repeat requests in < 1 ms.

## Cache Layer Architecture

```
Request
  → normalize prompt (trim, lower, deduplicate whitespace)
  → compute cacheKey = sha256(`${skillId}:${normalizedPrompt}`)
  → Redis GET aios:ai-cache:{cacheKey}
      HIT  → return cached artifact reference
      MISS → run AI, save artifact, Redis SET with TTL
```

## Cache Key

```typescript
import { createHash } from 'crypto'

function aiCacheKey(skillId: string, prompt: string): string {
  const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ')
  const hash = createHash('sha256')
    .update(`${skillId}:${normalized}`)
    .digest('hex')
    .slice(0, 32)
  return `aios:ai-cache:${hash}`
}
```

## Cache Value

```typescript
interface AiCacheEntry {
  artifactId: string     // existing artifact id for the cached result
  skillId: string
  promptHash: string
  createdAt: string      // ISO 8601
}
```

Store as JSON string in Redis.

## TTL Strategy

| Skill type | Default TTL | Rationale |
|------------|------------|-----------|
| Formal doc (web.docx.create) | 24 h | Prompts rarely identical; short TTL reduces stale responses |
| PPT generation | 1 h | High compute cost; worth caching short-term |
| Data analysis | No cache | Results depend on uploaded file content, not just prompt |

TTL is configurable per skill via `skills[id].cacheTtlSeconds`.

## Cache Invalidation

- TTL-based expiry (primary)
- Explicit invalidation: `DEL aios:ai-cache:{key}` via admin API
- User delete of artifact does NOT invalidate cache (cached entry points to
  deleted artifact — detected on cache hit; treat as MISS)

## Implementation Plan

1. Add `server/src/lib/aiCache.ts` with `get(key)` / `set(key, value, ttl)` helpers
2. Wrap `runCreateDocxSkill` in `routes/skills.ts` with cache check before invocation
3. On cache hit, load existing artifact metadata and return it directly
4. Wire up Redis client (`ioredis`) in `server/src/lib/redis.ts`

## Environment Variables

```
REDIS_URL=redis://localhost:6379
AI_CACHE_TTL_DOCX=86400       # 24 h in seconds
AI_CACHE_TTL_PPT=3600         # 1 h
AI_CACHE_ENABLED=true         # set false to bypass in dev/debug
```

## Metrics to Track

- Cache hit rate per skill
- Average latency: cache hit vs. miss
- Token savings estimate (`tokens_per_skill × hit_count`)
