import re
import unicodedata

from Levenshtein import distance


def normalize(text: str) -> str:
    """Lowercase, strip bracket content, and remove accents from text."""
    text = text.lower()
    text = re.sub(r"\s*[\(\[][^\)\]]*[\)\]]", "", text)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    return text.strip()


def check_answer(guess: str, canonical: str, alt_titles: list[str]) -> bool:
    """Return True if the guess matches the canonical title or any alt title within edit distance 1."""
    normalized_guess = normalize(guess)
    targets = [normalize(t) for t in [canonical] + alt_titles]
    return any(distance(normalized_guess, t) <= 1 for t in targets)
