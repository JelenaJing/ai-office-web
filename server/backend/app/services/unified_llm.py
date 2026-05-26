"""
Unified LLM client — same resolution order as server/src/modules/ai-gateway/llmClient.ts.

Priority: LLM_API_KEY / LLM_BASE_URL / LLM_MODEL → LLM_PROVIDER + provider keys → build/ai-config.json
Legacy DEEPSEEK_* env vars are used only when no LLM_* / provider key is set.
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

KNOWN_PROVIDERS = frozenset({"openai", "qwen", "deepseek", "cuhk", "custom"})
FALLBACK_MODEL = "gpt-4o-mini"

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_AI_CONFIG_PATH = _BACKEND_ROOT.parent.parent / "build" / "ai-config.json"


@dataclass
class LlmRuntime:
    provider: str
    api_key: str
    base_url: str
    model: str


@lru_cache(maxsize=1)
def _load_ai_config() -> Dict[str, Any]:
    if not _AI_CONFIG_PATH.is_file():
        return {"llm": {"active": "openai", "providers": {}}}
    with open(_AI_CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def resolve_provider() -> str:
    explicit = (os.getenv("LLM_PROVIDER") or "").strip()
    if explicit and explicit in KNOWN_PROVIDERS:
        return explicit
    cfg = _load_ai_config()
    active = (cfg.get("llm") or {}).get("active") or "openai"
    return active if active in KNOWN_PROVIDERS else "openai"


def resolve_provider_api_key(provider: str) -> str:
    if (os.getenv("LLM_API_KEY") or "").strip():
        return os.getenv("LLM_API_KEY", "").strip()
    if provider == "qwen":
        return (os.getenv("QWEN_API_KEY") or "").strip()
    if provider == "deepseek":
        return (os.getenv("DEEPSEEK_API_KEY") or "").strip()
    if provider == "cuhk":
        return (os.getenv("CUHK_API_KEY") or "").strip()
    if provider == "openai":
        return (os.getenv("OPENAI_API_KEY") or "").strip()
    return ""


def resolve_model() -> str:
    if (os.getenv("LLM_MODEL") or "").strip():
        return os.getenv("LLM_MODEL", "").strip()
    provider = resolve_provider()
    cfg = _load_ai_config()
    providers = (cfg.get("llm") or {}).get("providers") or {}
    model = (providers.get(provider) or {}).get("defaultModel")
    if model:
        return str(model).strip()
    return FALLBACK_MODEL


def resolve_base_url() -> str:
    if (os.getenv("LLM_BASE_URL") or "").strip():
        return os.getenv("LLM_BASE_URL", "").strip().rstrip("/")
    provider = resolve_provider()
    cfg = _load_ai_config()
    providers = (cfg.get("llm") or {}).get("providers") or {}
    url = (providers.get(provider) or {}).get("defaultBaseUrl")
    if url:
        return str(url).strip().rstrip("/")
    return ""


def resolve_runtime() -> LlmRuntime:
    provider = resolve_provider()
    api_key = resolve_provider_api_key(provider)
    base_url = resolve_base_url()
    model = resolve_model()
    if not api_key and provider == "deepseek":
        api_key = (os.getenv("DEEPSEEK_API_KEY") or "").strip()
    if not base_url and provider == "deepseek":
        base_url = (os.getenv("DEEPSEEK_BASE_URL") or "https://api.deepseek.com/v1").strip().rstrip("/")
    if not model and provider == "deepseek":
        model = (os.getenv("DEEPSEEK_MODEL") or "deepseek-chat").strip()
    return LlmRuntime(provider=provider, api_key=api_key, base_url=base_url, model=model)


def is_llm_configured() -> bool:
    rt = resolve_runtime()
    return bool(rt.api_key and rt.base_url)


def get_openai_client() -> OpenAI:
    rt = resolve_runtime()
    if not rt.api_key or not rt.base_url:
        raise RuntimeError(
            "LLM is not configured. Set LLM_API_KEY + LLM_BASE_URL or provider keys (see server/.env.example)."
        )
    return OpenAI(api_key=rt.api_key, base_url=rt.base_url)


def get_model() -> str:
    return resolve_runtime().model


def _strip_json_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    start = t.find("{")
    end = t.rfind("}")
    if start >= 0 and end > start:
        return t[start : end + 1]
    return t


def chat_completion(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 2000,
    temperature: float = 0.3,
) -> str:
    client = get_openai_client()
    resp = client.chat.completions.create(
        model=get_model(),
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()


def chat_completion_json(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 2000,
    temperature: float = 0.3,
) -> Dict[str, Any]:
    raw = chat_completion(messages, max_tokens=max_tokens, temperature=temperature)
    cleaned = _strip_json_fence(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"raw": raw}


def synthesize_json(
    *,
    system: str,
    user: str,
    max_tokens: int = 2500,
    temperature: float = 0.2,
) -> Dict[str, Any]:
    """JSON synthesis helper (idea fulltext merge path)."""
    return chat_completion_json(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
