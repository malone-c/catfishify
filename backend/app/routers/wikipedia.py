from fastapi import APIRouter

from app.services import wikipedia as wiki_service

router = APIRouter()


@router.get("/wikipedia/search")
def search(q: str) -> list[dict]:
    return wiki_service.search_articles(q)


@router.get("/wikipedia/article")
def article(title: str) -> dict:
    categories = wiki_service.fetch_categories(title)
    alt_titles = wiki_service.fetch_alt_titles(title)
    return {"categories": categories, "alt_titles": alt_titles}
