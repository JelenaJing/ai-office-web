/**
 * modules/auth — Authentication & identity management
 *
 * Responsibilities:
 *  - Validate AccountCenter JWT tokens (or issue local tokens in self-hosted mode)
 *  - Expose resolveUserId(req) helper consumed by other modules
 *  - Rate-limit login/register endpoints
 *  - Future: local user table backed by Prisma + bcrypt
 *
 * Current implementation: see routes/auth.ts (AC proxy)
 * Migration target: this module replaces routes/auth.ts once Prisma is wired.
 */

export {}
