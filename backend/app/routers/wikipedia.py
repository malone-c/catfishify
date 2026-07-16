from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    ReverseCategoryGuess,
    ReverseCategoryGuessResult,
    ReverseCategoryReveal,
    ReverseCategoryRevealResult,
    ReverseCategoryRound,
)
from app.services import reverse_catfishing as reverse_game
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


@router.get("/arcade/reverse/round", response_model=ReverseCategoryRound)
def reverse_category_round() -> dict:
    try:
        return reverse_game.create_round()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Wikipedia category data is unavailable") from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="No suitable category was found; request another round") from error


@router.post("/arcade/reverse/check", response_model=ReverseCategoryGuessResult)
def check_reverse_category_guess(body: ReverseCategoryGuess) -> dict:
    try:
        correct, answer = reverse_game.check_guess(body.round_id, body.guess)
        return {"correct": correct, "answer": answer}
    except reverse_game.RoundExpired as error:
        raise HTTPException(status_code=410, detail="This round expired; request another category") from error


@router.post("/arcade/reverse/reveal", response_model=ReverseCategoryRevealResult)
def reveal_reverse_category(body: ReverseCategoryReveal) -> dict:
    try:
        return {"answer": reverse_game.reveal(body.round_id)}
    except reverse_game.RoundExpired as error:
        raise HTTPException(status_code=410, detail="This round expired; request another category") from error
