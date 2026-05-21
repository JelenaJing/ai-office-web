# Production Readiness Checklist

This document tracks the items needed before exposing AI Office Web to public/multi-user traffic.

## Implemented (MVP)

- [x] Express server with CORS
- [x] Auth proxy to AccountCenter (POST /api/auth/login)
- [x] JWT verification middleware (`authMiddleware.ts`)
- [x] User file upload/download/delete with ownership check
- [x] Artifact creation and download with ownership check
- [x] Default workspace auto-init per user
- [x] Chinese filename normalization (latin1→utf8 repair)
- [x] Global rate limiting (200 req / 15 min per IP)
- [x] Auth-specific rate limiting (10 req / 15 min per IP)
- [x] Upload rate limiting (20 req / 15 min per IP)
- [x] Skill-run rate limiting (30 req / 15 min per IP)
- [x] JSON body size limit (2 MB)
- [x] Request timeout middleware (30 s default, 90 s for skills)
- [x] Multer file size limit (50 MB per upload)

## Next Phase

- [ ] PostgreSQL + Prisma (see `db-schema.md`) — replace JSON file storage
- [ ] MinIO object storage (see `object-storage.md`) — replace local disk
- [ ] Redis + BullMQ job queue (see `skill-jobs.md`) — async skill execution
- [ ] AI invocation cache (see `ai-cache.md`) — dedup identical prompts

## Security Hardening

- [ ] Helmet.js (`helmet()`) for HTTP security headers
- [ ] Replace dev fallback `web-demo-user` with mandatory auth enforcement
- [ ] HTTPS / TLS termination (nginx or cloud LB in front)
- [ ] Secrets rotation policy for AccountCenter + AI API keys

## Observability

- [ ] Structured JSON logging (`pino` or `winston`)
- [ ] Request ID header propagation (`X-Request-ID`)
- [ ] Prometheus metrics endpoint (`/metrics`)
- [ ] Audit log table (see `db-schema.md` → `AuditEvent`)
- [ ] Error alerting (Sentry or equivalent)

## Scalability

- [ ] Stateless HTTP server (no in-process state → move to Redis/Postgres)
- [ ] Horizontal scaling behind nginx upstream
- [ ] Separate worker process for AI jobs
- [ ] CDN for static frontend assets

## Registration / User Management

- [ ] Self-registration with email verification (or stay invite-only first)
- [ ] Admin dashboard for user management and quota adjustment
- [ ] Password reset flow
