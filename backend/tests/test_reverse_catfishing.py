from unittest.mock import patch

import pytest

from app.services import reverse_catfishing


@pytest.fixture(autouse=True)
def clear_rounds():
    reverse_catfishing.clear_rounds_for_testing()
    yield
    reverse_catfishing.clear_rounds_for_testing()


def test_create_round_hides_answer_and_preserves_all_pages():
    with patch(
        "app.services.reverse_catfishing.wikipedia.discover_category_round",
        return_value=("Galilean moons", ["Callisto (moon)", "Europa (moon)", "Ganymede (moon)", "Io (moon)"]),
    ):
        round_data = reverse_catfishing.create_round()

    assert set(round_data) == {"round_id", "pages", "member_count"}
    assert round_data["pages"] == ["Callisto (moon)", "Europa (moon)", "Ganymede (moon)", "Io (moon)"]
    assert round_data["member_count"] == 4
    assert "Galilean moons" not in str(round_data)


def test_check_guess_allows_repeated_free_text_attempts_and_category_prefix():
    with patch(
        "app.services.reverse_catfishing.wikipedia.discover_category_round",
        return_value=("Galilean moons", ["Callisto", "Europa", "Ganymede", "Io"]),
    ):
        round_id = reverse_catfishing.create_round()["round_id"]

    assert reverse_catfishing.check_guess(round_id, "Moons of Jupiter") == (False, None)
    assert reverse_catfishing.check_guess(round_id, "Category:Galilean moons") == (True, "Galilean moons")

    with pytest.raises(reverse_catfishing.RoundExpired):
        reverse_catfishing.check_guess(round_id, "Galilean moons")


def test_reveal_consumes_round():
    with patch(
        "app.services.reverse_catfishing.wikipedia.discover_category_round",
        return_value=("Galilean moons", ["Callisto", "Europa", "Ganymede", "Io"]),
    ):
        round_id = reverse_catfishing.create_round()["round_id"]

    assert reverse_catfishing.reveal(round_id) == "Galilean moons"
    with pytest.raises(reverse_catfishing.RoundExpired):
        reverse_catfishing.reveal(round_id)
