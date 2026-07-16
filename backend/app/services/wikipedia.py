import os
import random
import re
import threading

import httpx

WIKIPEDIA_API_BASE = os.getenv("WIKIPEDIA_API_BASE", "https://en.wikipedia.org/w/api.php")
WIKIPEDIA_TIMEOUT_SECONDS = 10.0
WIKIPEDIA_HEADERS = {
    "User-Agent": "Catfishify/1.0 (Wikipedia category guessing game)",
}


def _get(params: dict) -> httpx.Response:
    return httpx.get(
        WIKIPEDIA_API_BASE,
        params=params,
        headers=WIKIPEDIA_HEADERS,
        timeout=WIKIPEDIA_TIMEOUT_SECONDS,
    )


def search_articles(query: str) -> list[dict]:
    """Returns list of {"title": ..., "snippet": ...} for a Wikipedia search query."""
    response = _get({
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": 10,
        "format": "json",
    })
    response.raise_for_status()
    return [
        {"title": r["title"], "snippet": r["snippet"]}
        for r in response.json()["query"]["search"]
    ]


def search_categories(query: str) -> list[dict]:
    """Return live Wikipedia category-title matches for an autocomplete query."""
    search_query = re.sub(r"^\s*category\s*:\s*", "", query, flags=re.IGNORECASE).strip() or query
    response = _get({
        "action": "query",
        "generator": "prefixsearch",
        "gpssearch": search_query,
        "gpsnamespace": 14,
        "gpslimit": 10,
        "prop": "categoryinfo",
        "list": "search",
        "srsearch": search_query,
        "srnamespace": 14,
        "srlimit": 10,
        "format": "json",
        "formatversion": 2,
    })
    response.raise_for_status()
    query_data = response.json().get("query", {})
    results = []
    seen: set[str] = set()

    for page in sorted(query_data.get("pages", []), key=lambda item: item.get("index", 999)):
        title = page["title"].removeprefix("Category:")
        info = page.get("categoryinfo", {})
        page_count = info.get("pages", 0)
        subcategory_count = info.get("subcats", 0)
        page_label = "page" if page_count == 1 else "pages"
        subcategory_label = "subcategory" if subcategory_count == 1 else "subcategories"
        results.append({
            "title": title,
            "snippet": f"{page_count} direct {page_label} · {subcategory_count} {subcategory_label}",
        })
        seen.add(title.casefold())

    for result in query_data.get("search", []):
        title = result["title"].removeprefix("Category:")
        if title.casefold() in seen:
            continue
        results.append({"title": title, "snippet": result["snippet"]})
        seen.add(title.casefold())

    return results[:10]


def fetch_categories(title: str) -> list[str]:
    """Returns non-hidden, non-eponymous categories for a Wikipedia article."""
    response = _get({
        "action": "query",
        "titles": title,
        "prop": "categories",
        "clshow": "!hidden",
        "cllimit": "max",
        "format": "json",
    })
    response.raise_for_status()
    pages = response.json()["query"]["pages"]
    page = next(iter(pages.values()))
    return [
        c["title"].removeprefix("Category:")
        for c in page.get("categories", [])
        if c["title"] != f"Category:{title}"
    ]


def fetch_alt_titles(title: str) -> list[str]:
    """Returns redirect titles (alternative names) for a Wikipedia article."""
    response = _get({
        "action": "query",
        "titles": title,
        "prop": "redirects",
        "rdlimit": "max",
        "format": "json",
    })
    response.raise_for_status()
    pages = response.json()["query"]["pages"]
    page = next(iter(pages.values()))
    return [r["title"] for r in page.get("redirects", [])]


_UNPLAYABLE_CATEGORY_PATTERNS = (
    r"\bwikipedia\b",
    r"\barticles?\b",
    r"\bpages? (?:using|with|containing|needing)\b",
    r"\bcs1\b",
    r"\bwebarchive\b",
    r"\bcommons category\b",
    r"\buse (?:dmy|mdy) dates\b",
    r"\bstubs?\b",
    r"\b(?:births|deaths)\b",
)

_candidate_queues: dict[tuple[int, int], list[str]] = {}
_candidate_queues_lock = threading.Lock()
_candidate_refresh_lock = threading.Lock()
_CATEGORY_STOPWORDS = {
    "and",
    "at",
    "by",
    "for",
    "from",
    "in",
    "of",
    "on",
    "the",
    "to",
    "with",
}


def _is_playable_category(title: str) -> bool:
    if not title.startswith("Category:") or len(title) > 140:
        return False
    lowered = title.casefold()
    return not any(re.search(pattern, lowered) for pattern in _UNPLAYABLE_CATEGORY_PATTERNS)


def _stem_title_token(token: str) -> str:
    if token.endswith("ies") and len(token) > 4:
        return f"{token[:-3]}y"
    if token.endswith("s") and not token.endswith("ss") and len(token) > 4:
        return token[:-1]
    return token


def _title_tokens(value: str) -> set[str]:
    return {
        _stem_title_token(token)
        for token in re.findall(r"[a-z0-9]+", value.casefold())
        if token not in _CATEGORY_STOPWORDS and (len(token) >= 4 or token.isdigit())
    }


def _category_is_lexically_revealed(category: str, members: list[str]) -> bool:
    """Reject rounds where the answer can be copied from most page titles."""
    if not members:
        return False
    answer_tokens = _title_tokens(category)
    member_tokens = [_title_tokens(member) for member in members]
    if answer_tokens and any(answer_tokens <= tokens for tokens in member_tokens):
        return True
    return any(
        sum(token in tokens for tokens in member_tokens) / len(member_tokens) >= 0.6
        for token in answer_tokens
    )


def _random_category_candidates() -> list[str]:
    response = _get({
        "action": "query",
        "generator": "random",
        "grnnamespace": 0,
        "grnlimit": 20,
        "prop": "categories",
        "clshow": "!hidden",
        "cllimit": "max",
        "format": "json",
        "formatversion": 2,
    })
    response.raise_for_status()
    candidates = {
        category["title"]
        for page in response.json().get("query", {}).get("pages", [])
        for category in page.get("categories", [])
        if _is_playable_category(category["title"])
    }
    result = list(candidates)
    random.shuffle(result)
    return result[:50]


def _categories_with_playable_size(
    category_titles: list[str],
    min_pages: int,
    max_pages: int,
) -> list[str]:
    if not category_titles:
        return []
    response = _get({
        "action": "query",
        "titles": "|".join(category_titles),
        "prop": "categoryinfo",
        "format": "json",
        "formatversion": 2,
    })
    response.raise_for_status()
    playable = []
    for page in response.json().get("query", {}).get("pages", []):
        page_count = page.get("categoryinfo", {}).get("pages")
        if isinstance(page_count, int) and min_pages <= page_count <= max_pages:
            playable.append(page["title"].removeprefix("Category:"))
    random.shuffle(playable)
    return playable


def _take_cached_candidate(min_pages: int, max_pages: int) -> str | None:
    with _candidate_queues_lock:
        queue = _candidate_queues.get((min_pages, max_pages), [])
        return queue.pop() if queue else None


def _replenish_candidate_cache(min_pages: int, max_pages: int) -> None:
    with _candidate_refresh_lock:
        with _candidate_queues_lock:
            if _candidate_queues.get((min_pages, max_pages)):
                return
        candidates = _random_category_candidates()
        sized_candidates = _categories_with_playable_size(candidates, min_pages, max_pages)
        with _candidate_queues_lock:
            _candidate_queues.setdefault((min_pages, max_pages), []).extend(sized_candidates)


def clear_category_candidate_cache_for_testing() -> None:
    with _candidate_queues_lock:
        _candidate_queues.clear()


def fetch_category_members(category: str) -> list[str]:
    """Return every direct namespace-0 page in a category."""
    members: dict[str, str] = {}
    continuation: dict[str, str] = {}
    while True:
        response = _get({
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Category:{category}",
            "cmnamespace": 0,
            "cmtype": "page",
            "cmlimit": "max",
            "cmsort": "sortkey",
            "cmdir": "asc",
            "format": "json",
            "formatversion": 2,
            **continuation,
        })
        response.raise_for_status()
        payload = response.json()
        for member in payload.get("query", {}).get("categorymembers", []):
            title = member["title"]
            members[title.casefold()] = title
        next_token = payload.get("continue", {}).get("cmcontinue")
        if not next_token:
            break
        continuation = {"cmcontinue": next_token}
    return sorted(members.values(), key=str.casefold)


def discover_category_round(min_pages: int = 5, max_pages: int = 20) -> tuple[str, list[str]]:
    """Find a live, non-hidden category and return its complete playable membership."""
    if min_pages < 2 or max_pages < min_pages:
        raise ValueError("invalid category page bounds")

    refreshes = 0
    for _ in range(36):
        category = _take_cached_candidate(min_pages, max_pages)
        if category is None:
            if refreshes >= 3:
                break
            _replenish_candidate_cache(min_pages, max_pages)
            refreshes += 1
            category = _take_cached_candidate(min_pages, max_pages)
        if category is None:
            continue
        members = fetch_category_members(category)
        if any(member.casefold() == category.casefold() for member in members):
            continue
        if _category_is_lexically_revealed(category, members):
            continue
        if min_pages <= len(members) <= max_pages:
            return category, members
    raise RuntimeError("Could not find a suitable Wikipedia category")
