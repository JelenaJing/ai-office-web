"""
引用处理模块（迁移自 NFTCORE）
"""
import json
import logging
import os
from typing import Dict, List

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL
from .config import get_api_kwargs

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", DEEPSEEK_API_KEY),
    base_url=os.getenv("DEEPSEEK_BASE_URL", DEEPSEEK_BASE_URL),
)


def generate_reference_relations_batch(
    topic: str, references: List[Dict], batch_size: int = 30
) -> Dict[int, str]:
    all_relations: Dict[int, str] = {}
    total_refs = len(references)
    num_batches = (total_refs + batch_size - 1) // batch_size

    for batch_idx in range(num_batches):
        start_idx = batch_idx * batch_size
        end_idx = min(start_idx + batch_size, total_refs)
        batch_refs = references[start_idx:end_idx]

        refs_context = ""
        for ref in batch_refs:
            ref_idx = ref["index"]
            citation = ref["citation"]
            abstract = ref.get("abstract", "")
            has_abstract = ref.get("has_abstract", False)
            short_citation = citation[:200] + "..." if len(citation) > 200 else citation
            refs_context += f"\n[{ref_idx}] {short_citation}"
            if has_abstract and abstract:
                short_abstract = abstract[:150] + "..." if len(abstract) > 150 else abstract
                refs_context += f"\n   Abstract: {short_abstract}"
            refs_context += "\n"

        prompt = f"""You are an academic paper writing expert. Given a paper topic and a list of references, please generate a brief statement (15-30 words) in English for each reference, describing its role and relationship to the paper.

Paper Topic: {topic}

Reference List:
{refs_context}

Requirements:
1. Generate one sentence statement for each reference, describing its role in the paper
2. The statement should be concise (15-30 words), using academic language
3. Output in JSON format only: [{{"index": 1, "relation": "..."}}]
"""
        try:
            completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an academic paper writing expert skilled in analyzing the role of references. Please strictly output JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                **get_api_kwargs(max_tokens=2000),
            )
            response_text = completion.choices[0].message.content.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            batch_relations = json.loads(response_text.strip())
            for item in batch_relations:
                ref_idx = item.get("index")
                relation = item.get("relation", "")
                if ref_idx and relation:
                    all_relations[int(ref_idx)] = relation
        except Exception as e:
            logger.warning("generate_reference_relations_batch fallback: %s", e)
            for ref in batch_refs:
                all_relations[int(ref["index"])] = (
                    "This reference is cited as background and theoretical support for the research."
                )

    return all_relations
