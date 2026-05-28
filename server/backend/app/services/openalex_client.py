"""
OpenAlex客户端服务
直接实现OpenAlex搜索功能，不依赖NFTCORE
"""
import logging
import re
import requests
from requests.exceptions import RequestException
from typing import List, Dict, Optional
from datetime import date

logger = logging.getLogger(__name__)

# Strip from Idea/Intro search strings — long queries hurt OpenAlex recall.
_OPENALEX_NOISE_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\b(19|20)\d{2}\b",
        r"\bNature\s+Communications\b",
        r"\bNature\b",
        r"\bScience\b",
        r"\bCell\b",
        r"\bPNAS\b",
        r"\bACS\b",
    )
]


def clamp_openalex_search_query(query: str, max_words: int = 6) -> str:
    """Keep a short OpenAlex `search` string (few English content words)."""
    q = " ".join((query or "").split())
    if not q:
        return q
    words = q.split()
    if len(words) <= max_words:
        return q
    return " ".join(words[:max_words])


def normalize_openalex_search_query(raw: str) -> str:
    """Remove years/journal names; prefer first short English phrase if comma-separated."""
    q = " ".join((raw or "").split())
    if not q:
        return q
    for pat in _OPENALEX_NOISE_PATTERNS:
        q = pat.sub(" ", q)
    q = re.sub(r"[，,;；]+", " ", q)
    q = " ".join(q.split())
    # If mixed CJK + Latin, keep Latin tokens (OpenAlex works best in English).
    latin = re.findall(r"[A-Za-z][A-Za-z0-9\-]{1,}", q)
    if latin:
        return clamp_openalex_search_query(" ".join(latin), max_words=6)
    return clamp_openalex_search_query(q, max_words=6)


class OpenAlexFetcher:
    """OpenAlex API 搜索实现"""
    
    def __init__(self, email: Optional[str] = None, per_page: int = 25, enable_journal_filter: bool = True):
        self.base_url = "https://api.openalex.org/works"
        self.email = email
        self.per_page = min(per_page, 200)  # OpenAlex限制每页最多200条
        self.enable_journal_filter = enable_journal_filter
        logger.info(f"[OpenAlex] Initialized, email={email}, per_page={self.per_page}")
    
    def search_works(self, topic: str, max_results: int = 50) -> List[Dict]:
        """
        根据主题搜索相关文献
        
        Args:
            topic: 主题词组
            max_results: 最大返回结果数
        
        Returns:
            文献信息列表
        """
        logger.info(f"[OpenAlex] Starting search, topic='{topic}', max_results={max_results}")
        
        all_results = []
        page = 1
        
        while len(all_results) < max_results:
            params = {
                "search": topic,
                "per_page": min(self.per_page, max_results - len(all_results), 200),
                "page": page,
                "sort": "cited_by_count:desc"  # 按被引次数降序排列
            }
            
            if self.email:
                params["mailto"] = self.email
            
            try:
                logger.debug(f"[OpenAlex] Requesting page {page}, params: {params}")
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                results = data.get('results', [])
                
                logger.info(f"[OpenAlex] Page {page} returned {len(results)} results")
                
                if not results:
                    logger.warning(f"[OpenAlex] Page {page} returned no results, stopping search")
                    break
                
                all_results.extend(results)
                
                # 检查是否还有更多结果
                if len(results) < params['per_page']:
                    logger.info(f"[OpenAlex] Retrieved all available results, total {len(all_results)}")
                    break
                
                page += 1
                
            except requests.exceptions.HTTPError as e:
                logger.error(f"[OpenAlex] HTTP error: {e}")
                if hasattr(e.response, 'status_code'):
                    logger.error(f"[OpenAlex] Response status code: {e.response.status_code}")
                    logger.error(f"[OpenAlex] Response content: {e.response.text[:500]}")
                break
            except requests.exceptions.RequestException as e:
                logger.error(f"[OpenAlex] Request failed: {e}")
                break
            except Exception as e:
                logger.error(f"[OpenAlex] Unexpected error: {e}", exc_info=True)
                break
        
        logger.info(f"[OpenAlex] Search completed, found {len(all_results)} results")
        return all_results[:max_results]

    def search_works_filtered(
        self,
        topic: str,
        max_raw_results: int = 400,
        min_publication_year: Optional[int] = None,
        sort: str = "publication_date:desc",
    ) -> List[Dict]:
        """
        Search works with optional publication year lower bound and custom sort.
        Used for introduction remake (recency + post-filter by journal allowlist).
        """
        logger.info(
            f"[OpenAlex] Filtered search topic={topic!r} max_raw={max_raw_results} "
            f"min_year={min_publication_year} sort={sort}"
        )
        all_results: List[Dict] = []
        page = 1
        current_year = date.today().year
        year_upper = current_year + 1
        filter_parts = []
        if min_publication_year is not None:
            filter_parts.append(f"publication_year:{min_publication_year}-{year_upper}")

        while len(all_results) < max_raw_results:
            params: Dict = {
                "search": topic,
                "per_page": min(self.per_page, max_raw_results - len(all_results), 200),
                "page": page,
                "sort": sort,
            }
            if filter_parts:
                params["filter"] = ",".join(filter_parts)
            if self.email:
                params["mailto"] = self.email
            try:
                response = requests.get(self.base_url, params=params, timeout=45)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                if not results:
                    break
                all_results.extend(results)
                if len(results) < params["per_page"]:
                    break
                page += 1
            except Exception as e:
                logger.error(f"[OpenAlex] Filtered search error: {e}", exc_info=True)
                break
        return all_results[:max_raw_results]

    def fetch_works_filtered_page(
        self,
        topic: str,
        page: int,
        min_publication_year: Optional[int],
        sort: str,
        per_page: int = 200,
    ) -> List[Dict]:
        """
        Single page of /works search with optional publication_year filter.
        Used by Introduction literature pool only (per_page=200); does not change default self.per_page.
        """
        current_year = date.today().year
        year_upper = current_year + 1
        filter_parts: List[str] = []
        if min_publication_year is not None:
            filter_parts.append(f"publication_year:{min_publication_year}-{year_upper}")
        pp = min(max(1, per_page), 200)
        params: Dict = {
            "search": topic,
            "per_page": pp,
            "page": page,
            "sort": sort,
        }
        if filter_parts:
            params["filter"] = ",".join(filter_parts)
        if self.email:
            params["mailto"] = self.email
        try:
            response = requests.get(self.base_url, params=params, timeout=45)
            response.raise_for_status()
            data = response.json()
            return data.get("results", []) or []
        except RequestException as e:
            # Network down / unreachable: avoid multi-page traceback spam in logs
            logger.warning("[OpenAlex] fetch_works_filtered_page request failed: %s", e)
            return []
        except Exception as e:
            logger.warning("[OpenAlex] fetch_works_filtered_page unexpected error: %s", e)
            return []

    def get_work_by_id(self, work_id: str) -> Optional[Dict]:
        """根据ID获取论文"""
        try:
            url = f"{self.base_url}/{work_id}"
            params = {}
            if self.email:
                params["mailto"] = self.email
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"[OpenAlex] Failed to fetch paper: {e}")
            return None


class OpenAlexClient:
    """OpenAlex客户端封装"""
    
    def __init__(self, email: Optional[str] = None):
        from app.config import OPENALEX_EMAIL
        self.fetcher = OpenAlexFetcher(
            email=email or OPENALEX_EMAIL,
            per_page=25,
            enable_journal_filter=True
        )
        logger.info("[OpenAlex] Client initialization completed")
    
    def search_latest_papers(self, topic: str, max_results: int = 10) -> List[Dict]:
        """
        搜索最新相关论文
        
        Args:
            topic: 搜索主题
            max_results: 最大结果数
        
        Returns:
            论文列表
        """
        topic = normalize_openalex_search_query(topic)
        logger.info(f"[OpenAlex] Starting paper search, topic='{topic}', max_results={max_results}")
        results = self.fetcher.search_works(topic, max_results=max_results)
        logger.info(f"[OpenAlex] Search completed, returned {len(results)} results")
        return results
    
    def get_paper_details(self, work_id: str) -> Optional[Dict]:
        """
        获取论文详情
        
        Args:
            work_id: 论文ID
        
        Returns:
            论文详情
        """
        return self.fetcher.get_work_by_id(work_id)

    def search_for_intro_remake(
        self,
        topic: str,
        max_raw_results: int = 400,
        min_publication_year: Optional[int] = None,
        sort: str = "publication_date:desc",
    ) -> List[Dict]:
        return self.fetcher.search_works_filtered(
            topic=topic,
            max_raw_results=max_raw_results,
            min_publication_year=min_publication_year,
            sort=sort,
        )

    def fetch_intro_filtered_page(
        self,
        topic: str,
        page: int,
        min_publication_year: Optional[int],
        sort: str,
        per_page: int = 200,
    ) -> List[Dict]:
        """Introduction-only: one page with large per_page for fewer round trips."""
        return self.fetcher.fetch_works_filtered_page(
            topic=topic,
            page=page,
            min_publication_year=min_publication_year,
            sort=sort,
            per_page=per_page,
        )
