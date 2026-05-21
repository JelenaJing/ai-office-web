/**
 * modules/audit — Request and action audit log
 *
 * Responsibilities:
 *  - Record user actions: login, skill run, file upload/delete, artifact download
 *  - Persist audit events to Postgres (audit_events table)
 *  - Support compliance queries: "all actions by user X in period Y"
 *
 * See docs/db-schema.md for table design.
 *
 * Current state: no audit logging.
 * Migration target: hook into auth, skills, files, artifacts handlers.
 */

export {}
