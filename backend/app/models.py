import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Numeric, SmallInteger, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Puzzle(Base):
    __tablename__ = "puzzles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    short_id: Mapped[str] = mapped_column(String(8), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    size: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    articles: Mapped[list] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    results: Mapped[list["Result"]] = relationship("Result", back_populates="puzzle")


class Result(Base):
    __tablename__ = "results"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    puzzle_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("puzzles.id"), nullable=False)
    nickname: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False)
    time_taken_secs: Mapped[int] = mapped_column(Integer, nullable=False)
    answer_details: Mapped[dict] = mapped_column(JSONB, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(server_default=func.now())

    puzzle: Mapped["Puzzle"] = relationship("Puzzle", back_populates="results")
