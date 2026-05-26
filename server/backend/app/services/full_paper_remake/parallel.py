"""Async helpers: run blocking work in threads with optional timeout."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable, Optional, Tuple

logger = logging.getLogger(__name__)


async def run_in_thread(
    fn: Callable[[], Any],
    *,
    timeout_seconds: Optional[float] = None,
) -> Tuple[bool, Optional[Any], str]:
    """
    Run sync callable in a worker thread.
    Returns (ok, result_or_none, error_message).
    """
    try:
        if timeout_seconds is not None and timeout_seconds > 0:
            out = await asyncio.wait_for(asyncio.to_thread(fn), timeout=timeout_seconds)
        else:
            out = await asyncio.to_thread(fn)
        return True, out, ""
    except asyncio.TimeoutError:
        return False, None, "timeout"
    except Exception as e:
        logger.warning("[full_paper_remake] worker failed: %s", e, exc_info=True)
        return False, None, str(e)
