"""
SSE helpers and OpenAI-compatible chat streaming (DeepSeek).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Iterator, List, Optional

from openai import OpenAI

from app.config import DEEPSEEK_MAX_OUTPUT_TOKENS

logger = logging.getLogger(__name__)


def format_sse(event: str, data: str) -> bytes:
    """One SSE message: event + one or more data lines (UTF-8)."""
    if data is None:
        data = ""
    lines = str(data).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out = [f"event: {event}"]
    for line in lines:
        out.append(f"data: {line}")
    out.append("")
    out.append("")
    return ("\n".join(out)).encode("utf-8")


def format_sse_json(event: str, payload: Any) -> bytes:
    return format_sse(event, json.dumps(payload, ensure_ascii=False))


def iter_chat_stream_deltas(
    client: OpenAI,
    model: str,
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 8000,
    temperature: float = 0.3,
) -> Iterator[str]:
    """Yield text fragments from stream=True completion."""
    mt = max(1, min(int(max_tokens), DEEPSEEK_MAX_OUTPUT_TOKENS))
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=mt,
        temperature=temperature,
        stream=True,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta is None:
            continue
        piece = getattr(delta, "content", None)
        if piece:
            yield piece
