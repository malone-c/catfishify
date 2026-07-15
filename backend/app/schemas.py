from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ArticleIn(BaseModel):
    wikipedia_title: str
    categories: list[str]
    alt_titles: list[str]


class ArticleForPlayer(BaseModel):
    # wikipedia_title and alt_titles are intentionally omitted — titles are redacted for players
    categories: list[str]


class PuzzleCreate(BaseModel):
    title: str
    description: str | None = None
    articles: list[ArticleIn] = Field(min_length=1, max_length=10)


class PuzzleCreated(BaseModel):
    short_id: str


class PuzzleSummary(BaseModel):
    short_id: str
    title: str
    description: str | None
    size: int
    completions: int


class PuzzleDetail(BaseModel):
    short_id: str
    title: str
    description: str | None
    size: int
    articles: list[ArticleForPlayer]


class ResultCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=50)
    score: float = Field(ge=0)
    time_taken_secs: int = Field(ge=0)
    answer_details: list[Literal["correct", "half", "wrong", "skipped"]]


class ResultCreated(BaseModel):
    id: str


class LeaderboardEntry(BaseModel):
    nickname: str
    score: float
    time_taken_secs: int
    completed_at: datetime


class AnswerCheckRequest(BaseModel):
    article_index: int
    guess: str


class AnswerCheckResult(BaseModel):
    correct: bool
