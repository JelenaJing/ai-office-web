/**
 * modules/jobs — Async skill job queue
 *
 * Responsibilities:
 *  - Enqueue long-running skill runs (docx, ppt, analysis) as background jobs
 *  - Poll / subscribe for job status and return results to clients
 *  - Retry failed jobs; dead-letter after max retries
 *  - Expose GET /api/jobs/:jobId for client polling
 *
 * Technology: Redis + BullMQ (see docs/skill-jobs.md)
 *
 * Current state: skills run synchronously in-request.
 * Migration target: skills enqueue a job and return 202 + jobId immediately.
 */

export {}
