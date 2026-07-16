import os

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
