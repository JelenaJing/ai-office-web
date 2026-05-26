"""Assemble final Markdown paper from section bodies."""
from __future__ import annotations

from typing import Any, Dict, List, Optional


def format_references_block(
    *,
    reference_entries: Optional[List[Dict[str, Any]]] = None,
    fallback_reference_lines: Optional[List[str]] = None,
) -> str:
    """Body under `## References` (no heading)."""
    ref_entries = reference_entries or []
    if ref_entries:
        body = format_reference_list(ref_entries)
        return body if body.strip() else "*(References pending.)*"
    if fallback_reference_lines:
        lines = []
        for i, line in enumerate(fallback_reference_lines, start=1):
            lines.append(f"{i}. {line}")
        return "\n".join(lines) if lines else "*(References pending.)*"
    return "*(References pending — introduction pipeline did not return a citation list.)*"


def format_reference_list(entries: List[Dict[str, Any]]) -> str:
    """Format introduction_remaker-style reference dicts into numbered list."""
    lines: List[str] = []
    for i, r in enumerate(entries, start=1):
        cite = (r.get("citation") or "").strip()
        if not cite:
            continue
        lines.append(f"{i}. {cite}")
    return "\n".join(lines)


def assemble_paper_markdown(
    *,
    original_title: str,
    remade_abstract: str,
    introduction: str,
    methods: str,
    results: str,
    theory: str,
    conclusion: str,
    reference_entries: Optional[List[Dict[str, Any]]] = None,
    fallback_reference_lines: Optional[List[str]] = None,
) -> str:
    ref_entries = reference_entries or []
    title = (original_title or "Untitled study").strip()
    header = f"# [CoRemake] {title}"

    def _block(title_sec: str, body: str) -> str:
        b = (body or "").strip()
        if not b:
            return f"## {title_sec}\n\n*(Section unavailable.)*\n"
        return f"## {title_sec}\n\n{b}\n"

    parts = [
        header,
        "",
        _block("Abstract", remade_abstract),
        _block("Introduction", introduction),
        _block("Methods", methods),
        _block("Results", results),
        _block("Theory", theory),
        _block("Conclusion", conclusion),
        "## References",
        "",
    ]
    if ref_entries:
        parts.append(format_reference_list(ref_entries))
    elif fallback_reference_lines:
        for i, line in enumerate(fallback_reference_lines, start=1):
            parts.append(f"{i}. {line}")
    else:
        parts.append("*(References pending — introduction pipeline did not return a citation list.)*")

    return "\n".join(parts).rstrip() + "\n"
