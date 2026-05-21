# Job Queue Design (Redis + BullMQ)

## Problem

AI skill runs (docx generation, future PPT/analysis) are synchronous today.
A slow AI response blocks the HTTP connection and breaks on proxy timeouts (30–90 s).
In production we need:

- Immediate response (`202 Accepted` + `jobId`)
- Client polls `GET /api/jobs/:jobId` for status
- Worker process consumes the queue independently of the HTTP server

## Technology Choice

| Component | Choice | Reason |
|-----------|--------|--------|
| Queue backend | Redis 7 | Low latency, reliable pub/sub, widely supported |
| Job library | BullMQ 5 | Type-safe, retry/delay/priority, dashboard UI |
| Worker host | Separate Node process (`server/src/worker.ts`) | Isolates AI latency from HTTP handlers |

## Queue Design

### Queues

```
aios:skills           — skill run requests (docx, ppt, analysis)
aios:notifications    — push result to client (WebSocket or polling)
```

### Job Payload (`SkillJob`)

```typescript
interface SkillJob {
  jobId: string          // UUID, same as BullMQ job id
  skillId: string        // e.g. 'web.docx.create'
  userId: string
  workspacePath: string
  prompt: string
  params: Record<string, unknown>
  createdAt: string      // ISO 8601
}
```

### Job Result

```typescript
interface SkillJobResult {
  success: boolean
  artifactId?: string
  error?: string
}
```

### Job Lifecycle

```
POST /api/skills/:id/run
  → enqueue SkillJob  → 202 { jobId }

Worker:
  dequeue → run skill → save artifact → update job state

GET /api/jobs/:jobId
  → { status: 'waiting'|'active'|'completed'|'failed', artifact?, error? }
```

### Retry Policy

| Queue | Max attempts | Backoff |
|-------|-------------|---------|
| aios:skills | 3 | exponential 5 s base |

### Dead Letter

Failed jobs after max retries move to `aios:skills:failed`.
Alert + manual replay via admin API.

## Phase Plan

1. **Now (MVP)**: synchronous in-request, 90 s timeout
2. **Phase 2**: add `GET /api/jobs/:jobId` endpoint, BullMQ queue in worker; HTTP handler returns 202
3. **Phase 3**: WebSocket push for job completion (skip polling)

## Environment Variables

```
REDIS_URL=redis://localhost:6379
SKILL_JOB_CONCURRENCY=4      # worker threads per process
SKILL_JOB_MAX_ATTEMPTS=3
```
