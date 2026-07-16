from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, Field, field_validator, model_validator


class ArticleIn(BaseModel):
    wikipedia_title: str
    categories: list[str] = Field(max_length=500)
    alt_titles: list[str] = Field(max_length=500)

    @field_validator("wikipedia_title")
    @classmethod
    def wikipedia_title_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("wikipedia_title must not be blank")
        return value


class ArticleForPlayer(BaseModel):
    # wikipedia_title and alt_titles are intentionally omitted — titles are redacted for players
    categories: list[str]


class PuzzleCreate(BaseModel):
    title: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)
    articles: list[ArticleIn] = Field(min_length=1, max_length=10)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("title must not be blank")
        return value

    @model_validator(mode="after")
    def articles_must_be_unique(self) -> Self:
        titles = [article.wikipedia_title.strip().casefold() for article in self.articles]
        if len(titles) != len(set(titles)):
            raise ValueError("articles must be unique")
        return self


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

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("nickname must not be blank")
        return value


class ResultCreated(BaseModel):
    id: str


class LeaderboardEntry(BaseModel):
    nickname: str
    score: float
    time_taken_secs: int
    completed_at: datetime


class AnswerCheckRequest(BaseModel):
    article_index: int
    guess: str = Field(min_length=1, max_length=300)

    @field_validator("guess")
    @classmethod
    def guess_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("guess must not be blank")
        return value


class AnswerCheckResult(BaseModel):
    correct: bool


class RevealAnswerRequest(BaseModel):
    article_index: int


class RevealAnswerResult(BaseModel):
    wikipedia_title: str
