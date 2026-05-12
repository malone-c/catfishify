from unittest.mock import patch


def test_wikipedia_search_proxies_to_service(client):
    with patch("app.routers.wikipedia.wiki_service.search_articles") as mock:
        mock.return_value = [{"title": "Albert Einstein", "snippet": "Physicist"}]
        response = client.get("/api/wikipedia/search?q=einstein")
    assert response.status_code == 200
    assert response.json() == [{"title": "Albert Einstein", "snippet": "Physicist"}]
    mock.assert_called_once_with("einstein")


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
