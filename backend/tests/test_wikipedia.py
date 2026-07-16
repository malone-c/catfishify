from unittest.mock import MagicMock, patch

import pytest

from app.services.wikipedia import (
    _category_is_lexically_revealed,
    clear_category_candidate_cache_for_testing,
    discover_category_round,
    fetch_alt_titles,
    fetch_categories,
    fetch_category_members,
    search_categories,
    search_articles,
)


@pytest.fixture(autouse=True)
def clear_category_cache():
    clear_category_candidate_cache_for_testing()
    yield
    clear_category_candidate_cache_for_testing()


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


def test_search_articles_uses_timeout_and_identifies_the_app():
    mock_response = make_mock_response({"query": {"search": []}})
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response) as mock_get:
        search_articles("einstein")

    kwargs = mock_get.call_args.kwargs
    assert kwargs["timeout"] == 10.0
    assert kwargs["headers"]["User-Agent"].startswith("Catfishify/")


def test_search_categories_uses_category_namespace_and_strips_prefix():
    mock_response = make_mock_response({
        "query": {
            "pages": [
                {
                    "title": "Category:Extraterrestrial volcanoes",
                    "index": 2,
                    "categoryinfo": {"pages": 6, "subcats": 5},
                },
                {
                    "title": "Category:Extraterrestrial volcanic calderas",
                    "index": 1,
                    "categoryinfo": {"pages": 7, "subcats": 0},
                },
            ],
            "search": [
                {
                    "title": "Category:Extraterrestrial volcanic calderas",
                    "snippet": "Volcanic features beyond Earth",
                },
                {
                    "title": "Category:Calderas of Io",
                    "snippet": "Large volcanic depressions",
                },
            ]
        }
    })
    with patch("app.services.wikipedia.httpx.get", return_value=mock_response) as mock_get:
        result = search_categories("volcanic calderas")

    assert result == [
        {"title": "Extraterrestrial volcanic calderas", "snippet": "7 direct pages · 0 subcategories"},
        {"title": "Extraterrestrial volcanoes", "snippet": "6 direct pages · 5 subcategories"},
        {"title": "Calderas of Io", "snippet": "Large volcanic depressions"},
    ]
    params = mock_get.call_args.kwargs["params"]
    assert params["generator"] == "prefixsearch"
    assert params["gpsnamespace"] == 14
    assert params["srnamespace"] == 14


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


def test_fetch_category_members_returns_complete_namespace_zero_members():
    first_response = make_mock_response({
        "continue": {"cmcontinue": "next-page", "continue": "-||"},
        "query": {
            "categorymembers": [
                {"ns": 0, "title": "Galilean moons"},
                {"ns": 0, "title": "Callisto (moon)"},
                {"ns": 0, "title": "Europa (moon)"},
            ]
        },
    })
    second_response = make_mock_response({
        "query": {
            "categorymembers": [
                {"ns": 0, "title": "Ganymede (moon)"},
                {"ns": 0, "title": "Io (moon)"},
            ]
        },
    })

    with patch("app.services.wikipedia.httpx.get", side_effect=[first_response, second_response]) as mock_get:
        result = fetch_category_members("Galilean moons")

    assert result == ["Callisto (moon)", "Europa (moon)", "Galilean moons", "Ganymede (moon)", "Io (moon)"]
    assert mock_get.call_count == 2
    assert mock_get.call_args_list[0].kwargs["params"]["cmnamespace"] == 0
    assert mock_get.call_args_list[1].kwargs["params"]["cmcontinue"] == "next-page"


def test_discover_category_round_uses_live_categories_and_full_membership():
    random_pages_response = make_mock_response({
        "query": {
            "pages": [
                {
                    "title": "Io (moon)",
                    "categories": [
                        {"title": "Category:Galilean moons"},
                        {"title": "Category:Wikipedia articles with identifiers"},
                    ],
                }
            ]
        }
    })
    category_info_response = make_mock_response({
        "query": {
            "pages": [
                {
                    "title": "Category:Galilean moons",
                    "categoryinfo": {"size": 4, "pages": 4, "files": 0, "subcats": 0},
                }
            ]
        }
    })
    members_response = make_mock_response({
        "query": {
            "categorymembers": [
                {"ns": 0, "title": "Callisto"},
                {"ns": 0, "title": "Europa"},
                {"ns": 0, "title": "Ganymede"},
                {"ns": 0, "title": "Io"},
            ]
        }
    })

    with patch(
        "app.services.wikipedia.httpx.get",
        side_effect=[random_pages_response, category_info_response, members_response],
    ):
        category, members = discover_category_round(min_pages=4, max_pages=10)

    assert category == "Galilean moons"
    assert members == ["Callisto", "Europa", "Ganymede", "Io"]


def test_discover_category_round_rejects_categories_outside_member_bounds():
    random_pages_response = make_mock_response({
        "query": {
            "pages": [{"title": "Example", "categories": [{"title": "Category:Enormous category"}]}]
        }
    })
    category_info_response = make_mock_response({
        "query": {
            "pages": [
                {
                    "title": "Category:Enormous category",
                    "categoryinfo": {"size": 900, "pages": 900, "files": 0, "subcats": 0},
                }
            ]
        }
    })

    with patch(
        "app.services.wikipedia.httpx.get",
        side_effect=[random_pages_response, category_info_response] * 3,
    ):
        with pytest.raises(RuntimeError, match="suitable Wikipedia category"):
            discover_category_round(min_pages=4, max_pages=10)


def test_discover_category_round_reuses_other_sized_candidates():
    random_pages_response = make_mock_response({
        "query": {
            "pages": [{
                "title": "Example",
                "categories": [
                    {"title": "Category:First category"},
                    {"title": "Category:Second category"},
                ],
            }]
        }
    })
    category_info_response = make_mock_response({
        "query": {
            "pages": [
                {"title": "Category:First category", "categoryinfo": {"pages": 5}},
                {"title": "Category:Second category", "categoryinfo": {"pages": 5}},
            ]
        }
    })
    second_members_response = make_mock_response({
        "query": {"categorymembers": [
            {"ns": 0, "title": f"Alpha item {index}"} for index in range(5)
        ]}
    })
    first_members_response = make_mock_response({
        "query": {"categorymembers": [
            {"ns": 0, "title": f"Beta item {index}"} for index in range(5)
        ]}
    })

    with (
        patch("app.services.wikipedia.random.shuffle"),
        patch(
            "app.services.wikipedia.httpx.get",
            side_effect=[
                random_pages_response,
                category_info_response,
                second_members_response,
                first_members_response,
            ],
        ) as mock_get,
    ):
        first_round = discover_category_round(min_pages=4, max_pages=10)
        second_round = discover_category_round(min_pages=4, max_pages=10)

    assert first_round[0] == "Second category"
    assert second_round[0] == "First category"
    assert mock_get.call_count == 4


def test_lexical_reveal_filter_rejects_answers_repeated_across_page_titles():
    obvious_members = [
        "1967 Indianapolis 500",
        "1967 Indiana Hoosiers football team",
        "1967 Purdue Boilermakers football team",
        "1967 Ball State Cardinals football team",
        "1967 Notre Dame Fighting Irish football team",
    ]
    inferential_members = [
        "Dazhbog Patera",
        "Jaszai Patera",
        "Pillan Patera",
        "Sacajawea Patera",
        "Sachs Patera",
    ]

    assert _category_is_lexically_revealed("1967 in sports in Indiana", obvious_members)
    assert _category_is_lexically_revealed(
        "Galilean moons",
        ["Callisto", "Europa", "Ganymede", "List of Galilean moons", "Io"],
    )
    assert not _category_is_lexically_revealed("Extraterrestrial volcanic calderas", inferential_members)
