from datetime import datetime

from pydantic import BaseModel


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
    size: int
    articles: list[ArticleIn]


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
    nickname: str
    score: float
    time_taken_secs: int
    # per-article outcome, one entry per puzzle article: "correct" | "half" | "wrong" | "skipped"
    answer_details: list[str]


class ResultCreated(BaseModel):
    id: str


class LeaderboardEntry(BaseModel):
    nickname: str
    score: float
    time_taken_secs: int
    completed_at: datetime
