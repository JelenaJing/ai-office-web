"""
OpenAlex 检索与 APA 引用组装（兼容 NFTCORE reference_inserter 调用）。
"""
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from app.services.openalex_client import OpenAlexFetcher as BaseOpenAlexFetcher
from app.services.tier1_journals import get_allowed_source_ids, work_matches_allowlist


class OpenAlexFetcher(BaseOpenAlexFetcher):
    def extract_doi(self, work: Dict) -> Optional[str]:
        doi = work.get("doi")
        if not doi:
            return None
        if doi.startswith("https://doi.org/"):
            return doi.replace("https://doi.org/", "")
        if doi.startswith("http://doi.org/"):
            return doi.replace("http://doi.org/", "")
        return doi

    def format_author_names(self, authorships: List[Dict]) -> str:
        if not authorships:
            return "Unknown Author"
        author_names: List[str] = []
        for author in authorships:
            display_name = ((author.get("author") or {}).get("display_name") or "").strip()
            if not display_name:
                continue
            if "," in display_name:
                parts = display_name.split(",", 1)
                last_name = parts[0].strip()
                first_name = parts[1].strip()
                initials = " ".join([n[0].upper() + "." for n in first_name.split() if n])
                author_names.append(f"{last_name}, {initials}".strip())
            else:
                name_parts = display_name.split()
                if len(name_parts) >= 2:
                    last_name = name_parts[-1]
                    first_parts = name_parts[:-1]
                    initials = " ".join([n[0].upper() + "." for n in first_parts])
                    author_names.append(f"{last_name}, {initials}")
                else:
                    author_names.append(display_name)
        if not author_names:
            return "Unknown Author"
        if len(author_names) == 1:
            return author_names[0]
        if len(author_names) == 2:
            return f"{author_names[0]} & {author_names[1]}"
        return ", ".join(author_names[:-1]) + ", & " + author_names[-1]

    def generate_apa_citation(self, work: Dict) -> Optional[str]:
        authorships = work.get("authorships", [])
        author_str = self.format_author_names(authorships)
        if not author_str or author_str == "Unknown Author":
            return None
        publication_year = work.get("publication_date")
        if publication_year:
            try:
                year = datetime.strptime(publication_year, "%Y-%m-%d").year
            except Exception:
                year = work.get("publication_year")
        else:
            year = work.get("publication_year")
        if not year:
            return None
        title = (work.get("title") or "").strip()
        if not title:
            return None
        host_venue = work.get("host_venue") or {}
        journal = (host_venue.get("display_name") or "").strip()
        if not journal:
            primary_location = work.get("primary_location") or {}
            source = primary_location.get("source") or {}
            journal = (source.get("display_name") or "").strip()
        if not journal:
            return None
        biblio = work.get("biblio", {})
        volume = biblio.get("volume", "")
        issue = biblio.get("issue", "")
        first_page = biblio.get("first_page", "")
        last_page = biblio.get("last_page", "")
        pages = ""
        if first_page and last_page:
            pages = first_page if first_page == last_page else f"{first_page}-{last_page}"
        elif first_page:
            pages = first_page
        elif last_page:
            pages = last_page
        doi = self.extract_doi(work)
        citation = f"{author_str} ({year}). {title}. {journal}"
        if volume:
            citation += f", {volume}"
            if issue:
                citation += f"({issue})"
        elif issue:
            citation += f", ({issue})"
        if pages:
            citation += f", {pages}"
        citation += "."
        if doi:
            citation += f" https://doi.org/{doi}"
        return citation

    def reconstruct_abstract_from_inverted_index(self, inverted_index: Dict[str, List[int]]) -> Optional[str]:
        if not inverted_index:
            return None
        position_map: Dict[int, str] = {}
        for word, positions in inverted_index.items():
            for pos in positions:
                position_map[pos] = word
        if not position_map:
            return None
        return " ".join([position_map[i] for i in sorted(position_map.keys())]).strip() or None

    def extract_abstract(self, work: Dict) -> Optional[str]:
        abstract = work.get("abstract")
        if isinstance(abstract, str) and abstract.strip():
            return abstract.strip()
        inverted_index = work.get("abstract_inverted_index")
        if isinstance(inverted_index, dict) and inverted_index:
            return self.reconstruct_abstract_from_inverted_index(inverted_index)
        return None

    def fetch_references(
        self, topic: str, max_results: int = 500, year_range: Optional[str] = None
    ) -> Tuple[List[str], List[str], List[Optional[str]], str, List[int], List[str]]:
        # 保持函数签名兼容 NFTCORE
        works = self.search_works(topic=topic, max_results=max_results * 4)
        allowed_source_ids = get_allowed_source_ids()
        doi_list: List[str] = []
        apa_citations: List[str] = []
        abstracts: List[Optional[str]] = []
        years: List[int] = []
        seen_doi = set()
        seen_title = set()
        year_from: Optional[int] = None
        year_to: Optional[int] = None
        if year_range:
            if "-" in year_range:
                parts = year_range.split("-", 1)
                year_from = int(parts[0])
                year_to = int(parts[1])
            else:
                year_from = int(year_range)

        for work in works:
            # 与 introduction remake 对齐：仅保留顶刊白名单来源
            if not work_matches_allowlist(work, allowed_source_ids):
                continue
            yr = work.get("publication_year")
            if isinstance(yr, int):
                if year_from is not None and yr < year_from:
                    continue
                if year_to is not None and yr > year_to:
                    continue
            citation = self.generate_apa_citation(work)
            if not citation:
                continue
            doi = self.extract_doi(work)
            title = (work.get("title") or "").strip().lower()
            if doi and doi in seen_doi:
                continue
            if title and title in seen_title:
                continue
            if doi:
                seen_doi.add(doi)
            if title:
                seen_title.add(title)
            apa_citations.append(citation)
            doi_list.append(doi or "")
            abstracts.append(self.extract_abstract(work))
            if isinstance(yr, int):
                years.append(yr)
            if len(apa_citations) >= max_results:
                break

        return doi_list, apa_citations, abstracts, topic, years, []
