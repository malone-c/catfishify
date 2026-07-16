from dataclasses import dataclass
import re
import secrets
import threading
import time

from app.services import wikipedia
from app.services.answer_check import check_answer

ROUND_TTL_SECONDS = 30 * 60


class RoundExpired(Exception):
    pass


@dataclass(frozen=True)
class StoredRound:
    answer: str
    created_at: float


_rounds: dict[str, StoredRound] = {}
_rounds_lock = threading.Lock()


def _prune_expired(now: float) -> None:
    expired = [
        round_id
        for round_id, round_data in _rounds.items()
        if now - round_data.created_at > ROUND_TTL_SECONDS
    ]
    for round_id in expired:
        _rounds.pop(round_id, None)


def create_round() -> dict:
    answer, pages = wikipedia.discover_category_round()
    round_id = secrets.token_urlsafe(18)
    now = time.monotonic()
    with _rounds_lock:
        _prune_expired(now)
        _rounds[round_id] = StoredRound(answer=answer, created_at=now)
    return {"round_id": round_id, "pages": pages, "member_count": len(pages)}


def _get_round(round_id: str) -> StoredRound:
    now = time.monotonic()
    with _rounds_lock:
        _prune_expired(now)
        round_data = _rounds.get(round_id)
    if round_data is None:
        raise RoundExpired
    return round_data


def _clean_guess(guess: str) -> str:
    guess = re.sub(r"^\s*category\s*:\s*", "", guess, flags=re.IGNORECASE)
    return guess.replace("_", " ").strip()


def check_guess(round_id: str, guess: str) -> tuple[bool, str | None]:
    round_data = _get_round(round_id)
    correct = check_answer(_clean_guess(guess), round_data.answer, [])
    if not correct:
        return False, None
    with _rounds_lock:
        _rounds.pop(round_id, None)
    return True, round_data.answer


def reveal(round_id: str) -> str:
    round_data = _get_round(round_id)
    with _rounds_lock:
        _rounds.pop(round_id, None)
    return round_data.answer


def clear_rounds_for_testing() -> None:
    with _rounds_lock:
        _rounds.clear()
