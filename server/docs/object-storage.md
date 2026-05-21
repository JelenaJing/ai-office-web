# Object Storage Design (MinIO)

## Problem

Current state: uploaded files and artifact outputs are written to `server/data/` on local disk.
Issues for production:
- Not scalable across multiple server instances
- No signed URL / CDN delivery
- No lifecycle rules (auto-delete expired artifacts)

## Technology Choice

| Option | Choice | Reason |
|--------|--------|--------|
| Object storage | MinIO (self-hosted) | S3-compatible, on-premise, no egress cost |
| Client SDK | `@aws-sdk/client-s3` | Works with MinIO, well-typed |
| Signed URLs | S3 presigned GET (1 h TTL) | Avoids streaming through Node.js for downloads |

## Buckets

```
aios-files        — user-uploaded files
aios-artifacts    — AI-generated output files (docx, pptx, etc.)
aios-tmp          — temporary working files (TTL 24 h via bucket policy)
```

## Object Key Structure

```
aios-files/{userId}/{workspaceId}/{fileId}/original.{ext}
aios-artifacts/{userId}/{workspaceId}/{artifactId}/output.{ext}
aios-tmp/{jobId}/working.{ext}
```

## Upload Flow (files)

```
Client  →  POST /api/files/upload  (multipart)
Server  →  multer buffer  →  s3.putObject(bucket='aios-files', key, buffer)
         →  record File row in Postgres (storagePath = object key)
         →  return { fileId }
```

## Download Flow

```
Client  →  GET /api/files/:fileId/download  (with Authorization)
Server  →  verify ownership
         →  s3.getSignedUrl('getObject', key, expires=3600)
         →  redirect 302 to signed URL
```

This eliminates streaming bytes through Node.js and leverages MinIO's bandwidth.

## Artifact Download Flow

Same pattern as files. The signed URL approach works for both.

## Lifecycle Policies

| Bucket | Rule |
|--------|------|
| aios-tmp | Delete objects older than 24 h |
| aios-artifacts | Optionally expire after 90 days (configurable) |
| aios-files | No auto-expiry; honor user delete action |

## Environment Variables

```
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_FILES=aios-files
MINIO_BUCKET_ARTIFACTS=aios-artifacts
MINIO_USE_SSL=false
```

## Migration Plan

1. Install MinIO locally (Docker: `minio/minio`)
2. Create `server/src/lib/objectStorage.ts` wrapping `@aws-sdk/client-s3`
3. Replace `fs.writeFileSync` in `routes/files.ts` with `objectStorage.put()`
4. Replace `fs.createReadStream` in downloads with presigned redirect
5. Migrate existing `server/data/` files to MinIO with one-time script
