"""Bridge blocking LLM token iterators to async SSE emission."""
from __future__ import annotations

import asyncio
from typing import AsyncIterator, Iterator, Optional

from app.services.llm_stream import format_sse, format_sse_json

_STOP = object()


def _next_chunk(it: Iterator[str]) -> object:
    try:
        return next(it)
    except StopIteration:
        return _STOP


async def forward_llm_token_stream(
    *,
    section: str,
    token_iterator: Iterator[str],
    extra_meta: dict | None = None,
    emit_section_meta: bool = True,
    acc: Optional[list] = None,
) -> AsyncIterator[bytes]:
    """Emit optional meta (with section) then delta per token chunk from a sync iterator."""
    if emit_section_meta:
        meta = {"stage": "streaming_section", "section": section}
        if extra_meta:
            meta.update(extra_meta)
        yield format_sse_json("meta", meta)
    loop = asyncio.get_running_loop()
    it = iter(token_iterator)
    while True:
        piece = await loop.run_in_executor(None, _next_chunk, it)
        if piece is _STOP:
            break
        if piece:
            s = str(piece)
            if acc is not None:
                acc.append(s)
            yield format_sse("delta", s)


async def yield_text_in_chunks(
    *,
    section: str,
    text: str,
    chunk_size: int = 400,
    pause_ms: float = 0,
    emit_meta: bool = True,
) -> AsyncIterator[bytes]:
    """Emit precomputed text in fixed-size deltas (smooth display for non-stream LLM outputs)."""
    if emit_meta:
        yield format_sse_json("meta", {"stage": "streaming_section", "section": section})
    t = text or ""
    if not t:
        return
    for i in range(0, len(t), max(1, chunk_size)):
        yield format_sse("delta", t[i : i + chunk_size])
        if pause_ms > 0:
            await asyncio.sleep(pause_ms / 1000.0)
