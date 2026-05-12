import random
import string

from sqlalchemy.orm import Session

from app.models import Puzzle

BASE62 = string.digits + string.ascii_lowercase + string.ascii_uppercase


def generate_short_id(session: Session) -> str:
    """Generate a unique 8-char base62 short ID not already present in puzzles."""
    while True:
        short_id = "".join(random.choices(BASE62, k=8))
        if not session.query(Puzzle).filter_by(short_id=short_id).first():
            return short_id
