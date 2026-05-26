from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Optional

import httpx
import asyncio

from app.config import (
    DRAW_GATEWAY_BASE_URL,
    DRAW_GATEWAY_POLL_INTERVAL_SECONDS,
    DRAW_GATEWAY_TIMEOUT_SECONDS,
)


@dataclass(frozen=True)
class DrawResult:
    task_id: str
    status: str
    image_url: Optional[str]
    raw: dict[str, Any]


class DrawGatewayClient:
    """
    Client for local grsai-draw-gateway.

    Protocol:
    - POST /v1/draw/nano-banana with webHook='-1' to receive task id
    - POST /v1/draw/result to poll until status is succeeded/failed
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or DRAW_GATEWAY_BASE_URL).rstrip("/")

    async def submit_task(
        self,
        *,
        prompt: str,
        aspect_ratio: str = "16:9",
        model: str = "nano-banana-pro",
        image_size: str = "1K",
        urls: Optional[list[str]] = None,
    ) -> str:
        payload: dict[str, Any] = {
            "prompt": prompt,
            "aspectRatio": aspect_ratio,
            "model": model,
            "imageSize": image_size,
            "urls": urls or [],
            "webHook": "-1",
        }

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(f"{self.base_url}/v1/draw/nano-banana", json=payload)
            resp.raise_for_status()
            data = resp.json()

        task_id = None
        if isinstance(data, dict):
            inner = data.get("data") if isinstance(data.get("data"), dict) else None
            task_id = (inner or {}).get("id") or data.get("id")

        if not task_id or not str(task_id).strip():
            raise RuntimeError(f"draw submit did not return task id: {data}")

        return str(task_id)

    async def fetch_result(self, task_id: str) -> DrawResult:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(f"{self.base_url}/v1/draw/result", json={"id": task_id})
            resp.raise_for_status()
            data = resp.json()

        payload = data.get("data") if isinstance(data, dict) else None
        if not isinstance(payload, dict):
            payload = data if isinstance(data, dict) else {}

        status = str(payload.get("status") or "").strip()
        image_url = None
        results = payload.get("results")
        if isinstance(results, list) and results:
            first = results[0] if isinstance(results[0], dict) else {}
            image_url = first.get("url")

        return DrawResult(task_id=task_id, status=status, image_url=image_url, raw=data if isinstance(data, dict) else {"raw": data})

    async def wait_for_image(
        self,
        *,
        task_id: str,
        timeout_seconds: Optional[int] = None,
        poll_interval_seconds: Optional[int] = None,
    ) -> DrawResult:
        timeout_s = int(timeout_seconds or DRAW_GATEWAY_TIMEOUT_SECONDS)
        poll_s = int(poll_interval_seconds or DRAW_GATEWAY_POLL_INTERVAL_SECONDS)
        poll_s = max(1, poll_s)

        start = time.time()
        last: Optional[DrawResult] = None

        while True:
            last = await self.fetch_result(task_id)
            if last.status in {"succeeded", "failed"}:
                return last

            if time.time() - start >= timeout_s:
                raise TimeoutError(f"draw task timeout after {timeout_s}s (task_id={task_id})")

            await asyncio.sleep(poll_s)

    async def download_image_bytes(self, image_url: str) -> bytes:
        if not image_url or not str(image_url).strip():
            raise ValueError("image_url is empty")
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            return resp.content

