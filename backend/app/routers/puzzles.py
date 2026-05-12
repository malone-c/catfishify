from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Puzzle, Result
from app.schemas import (
    ArticleForPlayer,
    LeaderboardEntry,
    PuzzleCreate,
    PuzzleCreated,
    PuzzleDetail,
    PuzzleSummary,
    ResultCreate,
    ResultCreated,
)
from app.utils import generate_short_id

router = APIRouter()


@router.post("/puzzles", status_code=201)
def create_puzzle(body: PuzzleCreate, db: Session = Depends(get_db)) -> PuzzleCreated:
    short_id = generate_short_id(db)
    puzzle = Puzzle(
        short_id=short_id,
        title=body.title,
        description=body.description,
        size=len(body.articles),
        articles=[a.model_dump() for a in body.articles],
    )
    db.add(puzzle)
    db.commit()
    return PuzzleCreated(short_id=short_id)


@router.get("/puzzles")
def list_puzzles(db: Session = Depends(get_db)) -> list[PuzzleSummary]:
    rows = (
        db.query(Puzzle, func.count(Result.id).label("completions"))
        .outerjoin(Result, Result.puzzle_id == Puzzle.id)
        .group_by(Puzzle.id)
        .order_by(func.count(Result.id).desc())
        .all()
    )
    return [
        PuzzleSummary(
            short_id=puzzle.short_id,
            title=puzzle.title,
            description=puzzle.description,
            size=puzzle.size,
            completions=completions,
        )
        for puzzle, completions in rows
    ]
