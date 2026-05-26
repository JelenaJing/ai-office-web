import os

from app.config import DEEPSEEK_MAX_OUTPUT_TOKENS, DEEPSEEK_MODEL


def get_api_kwargs(max_tokens: int = 3000, temperature: float = 0.3) -> dict:
    mt = max(1, min(int(max_tokens), DEEPSEEK_MAX_OUTPUT_TOKENS))
    return {
        "model": os.getenv("DEEPSEEK_MODEL", DEEPSEEK_MODEL),
        "max_tokens": mt,
        "temperature": temperature,
    }
