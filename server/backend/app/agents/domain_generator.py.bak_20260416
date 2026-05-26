"""
Domain generator agent

Pipeline:
1) Generate ~N words English domain-relevant text from a topic or paragraph.
2) Generate an image prompt derived from that English text.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import TYPE_CHECKING, Iterator, Optional

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.services.llm_stream import format_sse, format_sse_json, iter_chat_stream_deltas

if TYPE_CHECKING:
    from app.models import DomainGenerateRequest

logger = logging.getLogger(__name__)


def get_client() -> OpenAI:
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _normalize_fenced_text(text: str) -> str:
    """Strip accidental markdown fences from model output."""
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\n?", "", t)
        t = re.sub(r"\n?```$", "", t).strip()
    return t


def _build_source(topic: Optional[str], paragraph: Optional[str]) -> str:
    t = (topic or "").strip()
    p = (paragraph or "").strip()
    if t and p:
        return f"Topic: {t}\n\nUser paragraph:\n{p}"
    if t:
        return f"Topic: {t}"
    if p:
        return f"User paragraph:\n{p}"
    return ""


def generate_english_text(*, topic: Optional[str], paragraph: Optional[str], word_count: int = 500, context: Optional[str] = None) -> str:
    """
    Generate ~word_count English words based on a topic or paragraph.
    """
    _, messages = _english_messages(topic=topic, paragraph=paragraph, word_count=word_count, context=context)
    client = get_client()
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=messages,
        max_tokens=2000,
        temperature=0.6,
    )
    text = (resp.choices[0].message.content or "").strip()
    return _normalize_fenced_text(text)


def generate_image_prompt_from_text(*, english_text: str) -> str:
    """
    Generate an image prompt derived from the already generated English text.
    The prompt is intended for nano-banana style models via grsai-draw-gateway.
    """
    messages = _image_prompt_messages(english_text=english_text)
    client = get_client()
    resp = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=messages,
        max_tokens=500,
        temperature=0.5,
    )
    out = (resp.choices[0].message.content or "").strip()
    return _normalize_fenced_text(out)


def _english_messages(*, topic: Optional[str], paragraph: Optional[str], word_count: int, context: Optional[str]) -> tuple[str, list[dict[str, str]]]:
    source = _build_source(topic, paragraph)
    if not source:
        raise ValueError("Either topic or paragraph must be provided")
    ctx = (context or "").strip()
    context_block = f"\n\nAdditional context:\n{ctx}" if ctx else ""
    prompt = f"""Write approximately {word_count} words in English about the domain described below.

Input:
{source}{context_block}

Requirements:
- Output must be English only.
- Produce a coherent single piece of writing (a few paragraphs are fine).
- Avoid bullet lists, headings, or JSON.
- Be technically accurate but readable to a graduate-level audience.
- Do not include citations, URLs, or references.
"""
    messages = [
        {"role": "system", "content": "You are an expert scientific writer. Output English prose only."},
        {"role": "user", "content": prompt},
    ]
    return prompt, messages


def iter_stream_english_text_deltas(
    *, topic: Optional[str], paragraph: Optional[str], word_count: int = 500, context: Optional[str] = None
) -> Iterator[str]:
    _, messages = _english_messages(topic=topic, paragraph=paragraph, word_count=word_count, context=context)
    client = get_client()
    yield from iter_chat_stream_deltas(
        client,
        DEEPSEEK_MODEL,
        messages,
        max_tokens=2000,
        temperature=0.6,
    )


def _image_prompt_messages(*, english_text: str) -> list[dict[str, str]]:
    base = (english_text or "").strip()
    if not base:
        raise ValueError("english_text is empty")
    prompt = f"""You are an expert at writing image generation prompts for scientific illustrations.

Given the following English text, write ONE single image prompt that would produce a relevant, high-quality scientific/academic illustration.

Text:
{base}

Constraints (must follow):
- clean white background
- highly scientific and academic style, professional journal-figure aesthetic
- minimal text; if any text is unavoidable, English only
- no numbers, no symbols, no equations
- absolutely no captions, labels, titles, or annotations in the image
- specify a clear composition and key visual elements (structures, shapes, colors, materials, lighting, viewpoint)

Output format:
- Return ONLY the prompt text, no quotes, no bullet points, no JSON.
"""
    return [
        {"role": "system", "content": "You write concise, concrete image prompts. Output prompt text only."},
        {"role": "user", "content": prompt},
    ]


def iter_stream_image_prompt_deltas(*, english_text: str) -> Iterator[str]:
    messages = _image_prompt_messages(english_text=english_text)
    client = get_client()
    yield from iter_chat_stream_deltas(
        client,
        DEEPSEEK_MODEL,
        messages,
        max_tokens=500,
        temperature=0.5,
    )


def stream_domain_sse(request: "DomainGenerateRequest", project_id: str, project_manager) -> Iterator[bytes]:
    """
    SSE: meta -> english_delta* -> phase(image_prompt) -> image_prompt_delta* -> phase(draw) -> done | error
    Draw phase is not token-streamed; final done includes full DomainGenerateResponse fields.
    """
    from app.services.draw_gateway_client import DrawGatewayClient

    english_text: Optional[str] = None
    image_prompt: Optional[str] = None
    draw_task_id: Optional[str] = None

    try:
        yield format_sse_json(
            "meta",
            {
                "job": "domain_generate",
                "project_id": project_id,
                "stages": ["english", "image_prompt", "draw"],
            },
        )

        parts_en: list[str] = []
        for frag in iter_stream_english_text_deltas(
            topic=request.topic,
            paragraph=request.paragraph,
            word_count=request.word_count,
            context=request.context,
        ):
            parts_en.append(frag)
            yield format_sse("english_delta", frag)
        english_text = _normalize_fenced_text("".join(parts_en))
        if not english_text:
            raise ValueError("English generation produced empty text")

        yield format_sse_json("phase", {"phase": "image_prompt"})

        parts_ip: list[str] = []
        for frag in iter_stream_image_prompt_deltas(english_text=english_text):
            parts_ip.append(frag)
            yield format_sse("image_prompt_delta", frag)
        image_prompt = _normalize_fenced_text("".join(parts_ip))
        if not image_prompt:
            raise ValueError("Image prompt generation produced empty text")

        async def _draw_pipeline() -> tuple[str, bytes]:
            nonlocal draw_task_id
            draw_client = DrawGatewayClient()
            tid = await draw_client.submit_task(
                prompt=image_prompt,
                aspect_ratio=request.aspect_ratio,
                model=request.draw_model,
                image_size=request.image_size,
            )
            draw_task_id = tid
            result = await draw_client.wait_for_image(
                task_id=tid,
                timeout_seconds=request.timeout_seconds,
                poll_interval_seconds=request.poll_interval_seconds,
            )
            if result.status != "succeeded":
                raise RuntimeError(f"draw task failed: status={result.status}")
            if not result.image_url:
                raise RuntimeError("draw task succeeded but missing image_url")
            image_bytes = await draw_client.download_image_bytes(result.image_url)
            return tid, image_bytes

        task_id, image_bytes = asyncio.run(_draw_pipeline())

        yield format_sse_json("phase", {"phase": "draw", "draw_task_id": task_id})

        saved = project_manager.save_generated_image(
            project_id,
            image_data=image_bytes,
            image_prompt=image_prompt,
            task_id=task_id,
        )
        rel_path = saved.get("rel_path")
        file_url = f"/api/v1/paper/{project_id}/files/{rel_path}" if rel_path else None

        done_payload = {
            "status": "success",
            "message": "Domain generation completed",
            "data": None,
            "project_id": project_id,
            "english_text": english_text,
            "image_prompt": image_prompt,
            "image_path": saved.get("abs_path"),
            "image_file_url": file_url,
            "draw_task_id": task_id,
        }
        yield format_sse_json("done", done_payload)
    except TimeoutError as e:
        logger.error(f"[Domain stream] timeout: {e}")
        yield format_sse_json(
            "error",
            {
                "kind": "timeout",
                "message": str(e),
                "project_id": project_id,
                "english_text": english_text,
                "image_prompt": image_prompt,
                "draw_task_id": draw_task_id,
            },
        )
    except Exception as e:
        logger.error(f"[Domain stream] failed: {e}", exc_info=True)
        err_payload: dict = {
            "kind": "error",
            "message": str(e),
            "project_id": project_id,
        }
        if english_text is not None:
            err_payload["english_text"] = english_text
        if image_prompt is not None:
            err_payload["image_prompt"] = image_prompt
        if draw_task_id is not None:
            err_payload["draw_task_id"] = draw_task_id
        yield format_sse_json("error", err_payload)

