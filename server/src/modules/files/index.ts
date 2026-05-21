/**
 * modules/files — User file storage
 *
 * Responsibilities:
 *  - Receive multipart uploads (multer → buffer → storage backend)
 *  - Normalize uploaded filenames (latin1/UTF-8 repair for Chinese)
 *  - Store files per workspace; maintain files.json index
 *  - Serve file downloads with ownership check + Authorization header required
 *  - Delete files (soft delete future; hard delete now)
 *  - Future: delegate storage to MinIO via object-storage module
 *
 * Current implementation: see routes/files.ts
 * Migration target: this module replaces routes/files.ts once MinIO is wired.
 */

export {}
