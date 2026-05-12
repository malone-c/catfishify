"""initial

Revision ID: 30e6bc80a291
Revises: 
Create Date: 2026-05-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "30e6bc80a291"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "puzzles",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("short_id", sa.String(length=8), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("size", sa.SmallInteger(), nullable=False),
        sa.Column("articles", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_puzzles_short_id"), "puzzles", ["short_id"], unique=True)
    op.create_table(
        "results",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("puzzle_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("nickname", sa.Text(), nullable=False),
        sa.Column("score", sa.Numeric(precision=4, scale=1), nullable=False),
        sa.Column("time_taken_secs", sa.Integer(), nullable=False),
        sa.Column("answer_details", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["puzzle_id"], ["puzzles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("results")
    op.drop_index(op.f("ix_puzzles_short_id"), table_name="puzzles")
    op.drop_table("puzzles")
