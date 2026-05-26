# Domain Generation + Image (Handover)

This document describes the **“topic/paragraph → ~500-word English text → image prompt → generated image”** feature in `paper-remake-service`.

## What it does

Given a **topic** or a **paragraph**, the service:

1. Generates ~500 words of **English-only** domain-relevant content.
2. Generates an **image-generation prompt** derived from that English text.
3. Calls local **`grsai-draw-gateway`** to generate an image, **downloads** it, and **saves** it into the project folder.

## Components & where the code is

- **API endpoint**: `POST /api/v1/remake/domain`  
  - File: `backend/app/routers/remake.py`
- **LLM agent (2-step pipeline)**:
  - File: `backend/app/agents/domain_generator.py`
  - Functions:
    - `generate_english_text(...)`
    - `generate_image_prompt_from_text(...)`
    - `iter_stream_english_text_deltas(...)` / `iter_stream_image_prompt_deltas(...)` (LLM token deltas)
    - `stream_domain_sse(...)` (SSE pipeline for `stream=true`)
- **Draw gateway client**:
  - File: `backend/app/services/draw_gateway_client.py`
  - Implements the recommended long-task flow:
    - `POST /v1/draw/nano-banana` with `webHook="-1"` → returns `task_id`
    - poll `POST /v1/draw/result` until `status` is `succeeded`/`failed`
    - download the `results[0].url` image bytes
- **Persistence (image + metadata)**:
  - File: `backend/app/project_manager.py`
  - Function: `save_generated_image(...)`
  - Saves to: `data/projects/<project>/data/plots/genimg_<timestamp>.png` and a `*.metadata.json`
- **Request/response models**:
  - File: `backend/app/models.py`
  - `DomainGenerateRequest`, `DomainGenerateResponse`

## Requirements / dependencies

- Python deps are in `backend/requirements.txt`.
- **Important compatibility note**: `openai` SDK (used for DeepSeek-compatible Chat Completions) requires an `httpx` version that supports its client kwargs.  
  We pin:
  - `httpx>=0.27.0,<0.28.0`

If you upgrade `openai`/`httpx`, re-run a quick import test:

```bash
cd backend
python -c "from app.routers.remake import generate_domain_content; print('import_ok')"
```

## Configuration (backend)

Environment variables are documented in `backend/.env.example`.

### DeepSeek (text + prompt generation)

- `DEEPSEEK_API_KEY` (required)
- `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`)
- `DEEPSEEK_MODEL` (default `deepseek-chat`)

### Draw gateway (image generation)

- `DRAW_GATEWAY_BASE_URL` (default `http://127.0.0.1:42000`)
- `DRAW_GATEWAY_TIMEOUT_SECONDS` (default `300`)
- `DRAW_GATEWAY_POLL_INTERVAL_SECONDS` (default `3`)

**Important for remote setups:** The backend calls the draw gateway **from the machine where `paper-remake-service` runs** (server-side HTTP). Your laptop/browser does not talk to the gateway directly. If `grsai-draw-gateway` runs on the **same** host as the backend, keep `DRAW_GATEWAY_BASE_URL=http://127.0.0.1:<PORT>` (or `http://localhost:<PORT>`). If the gateway runs on **another** host, set `DRAW_GATEWAY_BASE_URL` to that host’s reachable URL (e.g. `http://10.0.0.5:42000`) in the backend `.env` on the **server**, and ensure that server can reach the gateway (firewall/VPC).

## grsai-draw-gateway (required for images)

This feature expects a running local gateway service (repo: `grsai-draw-gateway`).

### Start gateway (example)

Follow the gateway README in its repo; the endpoint used here is:

- `POST /v1/draw/nano-banana`
- `POST /v1/draw/result`

After starting it, verify:

- `GET /health` returns ok
- Swagger: `http://127.0.0.1:<PORT>/docs`

## API: `POST /api/v1/remake/domain`

### Request body (JSON)

`DomainGenerateRequest` supports either `topic` or `paragraph`:

```json
{
  "project_id": null,
  "topic": "surface codes for quantum error correction",
  "paragraph": null,
  "word_count": 500,
  "context": null,

  "aspect_ratio": "16:9",
  "draw_model": "nano-banana-pro",
  "image_size": "1K",
  "timeout_seconds": 300,
  "poll_interval_seconds": 3,

  "stream": false
}
```

Notes:
- Provide **at least one** of `topic` / `paragraph`.
- If `project_id` is omitted, the service creates a new project internally (so it has a place to store the generated image).
- **`stream`** (default `false`): when `true`, the same `POST /api/v1/remake/domain` returns **`text/event-stream` (SSE)** instead of a single JSON body. When `false`, response is **`application/json`** as below.

### Streaming (`stream: true`)

Response header: `Content-Type: text/event-stream`. Events (same pattern as other remake SSE routes, e.g. `/check/stream`):

| Event | Payload |
|--------|---------|
| `meta` | JSON: `job`, `project_id`, `stages` |
| `english_delta` | Raw text fragment for the English article (append to build full text) |
| `phase` | JSON: e.g. `{"phase":"image_prompt"}` then after submit `{"phase":"draw","draw_task_id":"..."}` |
| `image_prompt_delta` | Raw text fragment for the image prompt |
| `done` | JSON: same fields as **Response body (success)** below (full `english_text`, `image_prompt`, `image_file_url`, etc.) |
| `error` | JSON on failure (`kind`, `message`, `project_id`; may include `english_text`, `image_prompt`, `draw_task_id` when available) |

The draw gateway step is **not** token-streamed; clients see a `phase` event with `draw_task_id`, then `done` when the image is saved.

### Response body (success)

`DomainGenerateResponse`:

```json
{
  "status": "success",
  "message": "Domain generation completed",
  "data": null,
  "project_id": "........",
  "english_text": ".... ~500 English words ....",
  "image_prompt": ".... image prompt ....",
  "image_path": "/abs/path/to/.../genimg_YYYYmmdd_HHMMSS.png",
  "image_file_url": "/api/v1/paper/<project_id>/files/data/plots/<filename>.png",
  "draw_task_id": "..."
}
```

### Errors

- **400/500**: LLM pipeline errors (missing input, DeepSeek unavailable, etc.)
- **502**: draw gateway failed / upstream error
  - `detail` includes `english_text`, `image_prompt`, `draw_task_id` (if already created)
- **504**: draw polling timed out
  - `detail` includes `draw_task_id` so you can continue polling manually against the gateway

## Remote / non-local usage (calling the API from another machine)

1. **Expose the FastAPI app** on the host that runs `paper-remake-service`. The repo defaults to `uvicorn ... --host 0.0.0.0 --port 8020` (see `backend/app/main.py` / `backend/start.sh`). From a **client** machine, call:
   - `http://<SERVER_IP_OR_HOSTNAME>:8020/api/v1/remake/domain`
   - Open docs at `http://<SERVER_IP_OR_HOSTNAME>:8020/docs`
2. **Firewall / reverse proxy**: Allow inbound TCP to the port you use (8020), or terminate TLS at nginx/Caddy and proxy to `127.0.0.1:8020`.
3. **`image_file_url` in the JSON response** is a **relative** path (e.g. `/api/v1/paper/<project_id>/files/...`). When downloading from another machine, prefix your public API base, e.g. `http://<SERVER>:8020` + `image_file_url`.
4. **`image_path`** is an absolute filesystem path **on the server**; it is mainly for server-side debugging. Remote clients should use the HTTP endpoints above, not this path.
5. **DeepSeek**: The server must have outbound HTTPS to `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`).
6. **Draw gateway**: Still configured on the **server** via `DRAW_GATEWAY_BASE_URL` (see previous section). The client never needs direct access to port 42000 unless you intentionally expose the gateway separately.

## Retrieving the generated image

Images are stored in the project directory under `data/plots/`.

To access via API, use the existing project file endpoints:

- Metadata endpoint (returns JSON with `url` for binary files):  
  `GET /api/v1/paper/<project_id>/files/data/plots/<filename>.png`

- Download endpoint (returns raw image bytes):  
  `GET /api/v1/paper/<project_id>/files/data/plots/<filename>.png/download`

## Example: end-to-end curl

Local (same machine as backend; default port **8020**):

```bash
curl -X POST "http://127.0.0.1:8020/api/v1/remake/domain" \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"surface codes for quantum error correction",
    "word_count":500
  }'
```

Remote client (replace host with your server):

```bash
curl -X POST "http://<SERVER_HOST>:8020/api/v1/remake/domain" \
  -H "Content-Type: application/json" \
  -d '{"topic":"surface codes for quantum error correction","word_count":500}'
```

Streaming SSE (`-N` disables curl buffering):

```bash
curl -N -X POST "http://127.0.0.1:8020/api/v1/remake/domain" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"topic":"surface codes for quantum error correction","word_count":500,"stream":true}'
```

## Troubleshooting

### 1) `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'`

Cause: `openai` SDK + incompatible `httpx` version.

Fix: ensure `backend/requirements.txt` pins:

- `httpx>=0.27.0,<0.28.0`

Then reinstall:

```bash
cd backend
pip install -r requirements.txt
```

### 2) Image generation hangs or times out

- Ensure `grsai-draw-gateway` is running and reachable at `DRAW_GATEWAY_BASE_URL`.
- The gateway uses long-task semantics; prefer **id + polling**.
- Increase `timeout_seconds` in request body (up to 1800s allowed by validation) if your images are slow.

### 3) Returned image URL is missing

If the gateway returns `succeeded` but without `results[0].url`, it’s treated as failure (502).
Check gateway logs and upstream provider status.

### 4) Remote API works but image step fails (502) or times out (504)

- On the **server**, verify the backend can reach the draw gateway: `curl -sS http://127.0.0.1:<PORT>/health` (or whatever you set in `DRAW_GATEWAY_BASE_URL`).
- If the gateway is not on localhost, fix `DRAW_GATEWAY_BASE_URL` in the server’s `.env` and restart the backend.

## Security notes

- Never commit real keys (`DEEPSEEK_API_KEY`, upstream gateway keys) into git.
- This service currently has no auth/rate-limit middleware; deploy behind a gateway if exposed outside a trusted network.

