from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services import wikipedia as wiki_service

router = APIRouter()


@router.get("/wikipedia/search")
def search(
    q: Annotated[str, Query(min_length=2, max_length=100, pattern=r".*\S.*")],
) -> list[dict]:
    try:
        return wiki_service.search_articles(q)
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Wikipedia search is unavailable") from error


@router.get("/wikipedia/article")
def article(
    title: Annotated[str, Query(min_length=1, max_length=300, pattern=r".*\S.*")],
) -> dict:
    try:
        categories = wiki_service.fetch_categories(title)
        alt_titles = wiki_service.fetch_alt_titles(title)
        return {"categories": categories, "alt_titles": alt_titles}
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Wikipedia preview is unavailable") from error
