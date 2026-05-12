from unittest.mock import MagicMock, patch

from app.services.wikipedia import fetch_alt_titles, fetch_categories, search_articles


def make_mock_response(json_data: dict) -> MagicMock:
    mock = MagicMock()
    mock.json.return_value = json_data
    mock.raise_for_status.return_value = None
    return mock


def test_search_articles_returns_title_and_snippet():
    mock_response = make_mock_response({
        "query": {
            "search": [
                {"title": "Albert Einstein", "snippet": "German-born physicist"},
                {"title": "Einstein (crater)", "snippet": "Lunar crater"},
            ]
        }
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response) as mock_get:
        result = search_articles("einstein")

    assert result == [
        {"title": "Albert Einstein", "snippet": "German-born physicist"},
        {"title": "Einstein (crater)", "snippet": "Lunar crater"},
    ]
    assert mock_get.call_args[1]["params"]["srsearch"] == "einstein"


def test_search_articles_returns_empty_list_when_no_results():
    mock_response = make_mock_response({"query": {"search": []}})
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response):
        result = search_articles("xyznotarealarticle")
    assert result == []


def test_fetch_categories_strips_eponymous():
    mock_response = make_mock_response({
        "query": {
            "pages": {
                "736": {
                    "title": "Albert Einstein",
                    "categories": [
                        {"title": "Category:1879 births"},
                        {"title": "Category:Albert Einstein"},  # eponymous — must be stripped
                        {"title": "Category:Nobel laureates in Physics"},
                    ],
                }
            }
        }
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response):
        result = fetch_categories("Albert Einstein")

    assert "1879 births" in result
    assert "Nobel laureates in Physics" in result
    assert "Albert Einstein" not in result


def test_fetch_categories_strips_category_prefix():
    mock_response = make_mock_response({
        "query": {
            "pages": {
                "1": {
                    "title": "Python",
                    "categories": [{"title": "Category:Programming languages"}],
                }
            }
        }
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response):
        result = fetch_categories("Python")
    assert result == ["Programming languages"]


def test_fetch_categories_returns_empty_when_none():
    mock_response = make_mock_response({
        "query": {"pages": {"1": {"title": "Python"}}}
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response):
        result = fetch_categories("Python")
    assert result == []


def test_fetch_alt_titles_returns_redirect_titles():
    mock_response = make_mock_response({
        "query": {
            "pages": {
                "736": {
                    "title": "Albert Einstein",
                    "redirects": [
                        {"title": "Einstein"},
                        {"title": "A. Einstein"},
                    ],
                }
            }
        }
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response):
        result = fetch_alt_titles("Albert Einstein")
    assert result == ["Einstein", "A. Einstein"]


def test_fetch_alt_titles_returns_empty_when_none():
    mock_response = make_mock_response({
        "query": {"pages": {"736": {"title": "Albert Einstein"}}}
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response):
        result = fetch_alt_titles("Albert Einstein")
    assert result == []
