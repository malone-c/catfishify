from unittest.mock import patch

import httpx


def test_wikipedia_search_proxies_to_service(client):
    with patch("app.routers.wikipedia.wiki_service.search_articles") as mock:
        mock.return_value = [{"title": "Albert Einstein", "snippet": "Physicist"}]
        response = client.get("/api/wikipedia/search?q=einstein")
    assert response.status_code == 200
    assert response.json() == [{"title": "Albert Einstein", "snippet": "Physicist"}]
    mock.assert_called_once_with("einstein")


def test_wikipedia_search_rejects_query_shorter_than_two_characters(client):
    response = client.get("/api/wikipedia/search?q=e")
    assert response.status_code == 422


def test_wikipedia_search_returns_502_when_wikipedia_is_unavailable(client):
    with patch("app.routers.wikipedia.wiki_service.search_articles") as mock:
        mock.side_effect = httpx.TimeoutException("timed out")
        response = client.get("/api/wikipedia/search?q=einstein")
    assert response.status_code == 502


def test_wikipedia_article_proxies_to_service(client):
    with patch("app.routers.wikipedia.wiki_service.fetch_categories") as mock_cats, \
         patch("app.routers.wikipedia.wiki_service.fetch_alt_titles") as mock_alts:
        mock_cats.return_value = ["1879 births", "Nobel laureates in Physics"]
        mock_alts.return_value = ["Einstein", "A. Einstein"]
        response = client.get("/api/wikipedia/article?title=Albert+Einstein")
    assert response.status_code == 200
    data = response.json()
    assert data["categories"] == ["1879 births", "Nobel laureates in Physics"]
    assert data["alt_titles"] == ["Einstein", "A. Einstein"]
    mock_cats.assert_called_once_with("Albert Einstein")
    mock_alts.assert_called_once_with("Albert Einstein")


def test_wikipedia_article_rejects_blank_or_oversized_titles(client):
    assert client.get("/api/wikipedia/article?title=").status_code == 422
    assert client.get(f"/api/wikipedia/article?title={'x' * 301}").status_code == 422


def test_wikipedia_article_returns_502_when_wikipedia_is_unavailable(client):
    with patch("app.routers.wikipedia.wiki_service.fetch_categories") as mock:
        mock.side_effect = httpx.TimeoutException("timed out")
        response = client.get("/api/wikipedia/article?title=Albert+Einstein")
    assert response.status_code == 502


def test_reverse_catfishing_round_proxies_to_service(client):
    round_data = {
        "round_id": "opaque-round",
        "pages": ["Callisto (moon)", "Europa (moon)", "Ganymede (moon)", "Io (moon)"],
        "member_count": 4,
    }
    with patch("app.routers.wikipedia.reverse_game.create_round", return_value=round_data) as mock:
        response = client.get("/api/arcade/reverse/round")

    assert response.status_code == 200
    assert response.json() == round_data
    mock.assert_called_once_with()


def test_reverse_catfishing_guess_is_free_text_and_server_checked(client):
    with patch(
        "app.routers.wikipedia.reverse_game.check_guess",
        return_value=(True, "Galilean moons"),
    ) as mock:
        response = client.post(
            "/api/arcade/reverse/check",
            json={"round_id": "opaque-round", "guess": "Galilean moons"},
        )

    assert response.status_code == 200
    assert response.json() == {"correct": True, "answer": "Galilean moons"}
    mock.assert_called_once_with("opaque-round", "Galilean moons")


def test_reverse_catfishing_rejects_blank_guess(client):
    response = client.post(
        "/api/arcade/reverse/check",
        json={"round_id": "opaque-round", "guess": "   "},
    )
    assert response.status_code == 422


def test_reverse_catfishing_returns_gone_for_expired_round(client):
    from app.services.reverse_catfishing import RoundExpired

    with patch("app.routers.wikipedia.reverse_game.check_guess", side_effect=RoundExpired):
        response = client.post(
            "/api/arcade/reverse/check",
            json={"round_id": "expired", "guess": "anything"},
        )
    assert response.status_code == 410
